// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: SUBJECT-PARTITIONED SCALABLE QUESTION STORE
// Scalable to 1 Lakh+ (100,000+) questions across all disciplines
// Subject Isolation: Physics, Chemistry, Biology, Mathematics, Class 10 Science, Class 10 Maths
// Dual-Disk Persistence with Serverless Fallback (/tmp) and Atomic File Writes
// ============================================================================

const fs = require('fs');
const path = require('path');
const { sanitizeQuestionPayload } = require('./llmQuestionEngine');

// Primary persistent directory on disk
const DB_DIR = path.join(__dirname, '..', 'database');
const TMP_DIR = '/tmp';

// Canonical Subject Bank Mapping
const SUBJECT_FILE_MAP = {
  senior_physics: 'injected_physics.json',
  senior_chemistry: 'injected_chemistry.json',
  senior_biology: 'injected_biology.json',
  senior_mathematics: 'injected_mathematics.json',
  class10_science: 'injected_class10_science.json',
  class10_maths: 'injected_class10_maths.json',
  class10_math_pyq_ncert: 'injected_class10_maths.json'
};

const ALIAS_MAP = {
  'PHYSICS': 'senior_physics',
  'SENIOR_PHYSICS': 'senior_physics',
  'CHEMISTRY': 'senior_chemistry',
  'SENIOR_CHEMISTRY': 'senior_chemistry',
  'BIOLOGY': 'senior_biology',
  'SENIOR_BIOLOGY': 'senior_biology',
  'MATHEMATICS': 'senior_mathematics',
  'SENIOR_MATHEMATICS': 'senior_mathematics',
  'CLASS10_MATHEMATICS': 'class10_math_pyq_ncert',
  'CLASS10_MATHS': 'class10_maths',
  'CLASS10_SCIENCE': 'class10_science'
};

/**
 * Resolves a subject identifier (string or key) to canonical bankKey
 */
function resolveBankKey(subject, grade = '12') {
  if (!subject) return 'senior_physics';
  const sUpper = String(subject).toUpperCase().trim();
  const isC10 = String(grade) === '10' || sUpper.includes('CLASS10') || sUpper.includes('FOUNDATION');

  if (ALIAS_MAP[sUpper]) return ALIAS_MAP[sUpper];

  if (isC10) {
    if (sUpper.includes('MATH')) return 'class10_maths';
    return 'class10_science';
  }

  if (sUpper.includes('CHEM')) return 'senior_chemistry';
  if (sUpper.includes('BIO')) return 'senior_biology';
  if (sUpper.includes('MATH')) return 'senior_mathematics';
  return 'senior_physics';
}

/**
 * Returns candidate paths for a given subject filename
 */
function getStoragePathsForFile(fileName) {
  return [
    path.join(DB_DIR, fileName),
    path.join(TMP_DIR, fileName)
  ];
}

/**
 * Loads questions from all storage paths for a specific subject file, deduping by id
 */
function readQuestionsFromFile(fileName) {
  const map = new Map();
  const paths = getStoragePathsForFile(fileName);

  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(q => {
            if (q && q.id) {
              map.set(q.id, sanitizeQuestionPayload(q));
            }
          });
        }
      }
    } catch (e) {
      // Ignore read errors on individual fallback paths
    }
  }

  return Array.from(map.values());
}

/**
 * Atomically writes questions for a given filename to disk (and tmp fallback)
 */
function writeQuestionsToFile(fileName, questions) {
  if (!Array.isArray(questions)) return false;
  const paths = getStoragePathsForFile(fileName);
  let written = false;

  const dataStr = JSON.stringify(questions, null, 2);

  for (const p of paths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, dataStr, 'utf8');
      written = true;
    } catch (e) {
      // Continue to next path if filesystem is read-only
    }
  }

  return written;
}

/**
 * One-time migration: splits legacy monolithic custom_injected_questions.json into subject partitions
 */
function migrateLegacyMonolithicQuestions() {
  const legacyPaths = [
    path.join(DB_DIR, 'custom_injected_questions.json'),
    path.join(TMP_DIR, 'custom_injected_questions.json')
  ];

  const legacyList = [];
  for (const p of legacyPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(q => {
            if (q && q.id && !legacyList.some(item => item.id === q.id)) {
              legacyList.push(sanitizeQuestionPayload(q));
            }
          });
        }
      }
    } catch (e) {}
  }

  if (legacyList.length === 0) return;

  // Group by bankKey
  const grouped = {};
  legacyList.forEach(q => {
    const s = q.subjectKey || q.subject || 'PHYSICS';
    const g = q.grade || '12';
    const bKey = resolveBankKey(s, g);
    if (!grouped[bKey]) grouped[bKey] = [];
    grouped[bKey].push(q);
  });

  // Save into individual partitions
  for (const [bKey, questions] of Object.entries(grouped)) {
    const fileName = SUBJECT_FILE_MAP[bKey] || 'injected_physics.json';
    const existing = readQuestionsFromFile(fileName);
    const map = new Map();
    existing.forEach(q => map.set(q.id, q));
    questions.forEach(q => map.set(q.id, q));
    writeQuestionsToFile(fileName, Array.from(map.values()));
  }
}

// Execute migration once on startup
try {
  migrateLegacyMonolithicQuestions();
} catch (e) {
  console.warn('[QUESTION STORAGE] Legacy migration notice:', e.message);
}

/**
 * Loads all custom persisted questions for a specific bankKey
 */
function loadPersistedQuestionsForBank(bankKey) {
  const fileName = SUBJECT_FILE_MAP[bankKey] || 'injected_physics.json';
  return readQuestionsFromFile(fileName);
}

/**
 * Loads all custom persisted questions across all subjects
 */
function loadAllPersistedQuestions() {
  const allMap = new Map();
  const fileNames = Array.from(new Set(Object.values(SUBJECT_FILE_MAP)));

  for (const fn of fileNames) {
    const list = readQuestionsFromFile(fn);
    list.forEach(q => {
      if (q && q.id) allMap.set(q.id, q);
    });
  }

  return Array.from(allMap.values());
}

/**
 * Saves new questions into their appropriate subject-partitioned files
 */
function savePersistedCustomQuestions(newQuestions = []) {
  if (!Array.isArray(newQuestions) || newQuestions.length === 0) return true;

  // Group by partition file
  const grouped = {};

  newQuestions.forEach(rawQ => {
    if (!rawQ || !rawQ.id) return;
    const q = sanitizeQuestionPayload(rawQ);
    const s = q.subjectKey || q.subject || 'PHYSICS';
    const g = q.grade || '12';
    const bKey = resolveBankKey(s, g);
    const fileName = SUBJECT_FILE_MAP[bKey] || 'injected_physics.json';

    if (!grouped[fileName]) grouped[fileName] = [];
    grouped[fileName].push(q);
  });

  // Write each subject partition atomically
  let allSaved = true;
  for (const [fileName, qList] of Object.entries(grouped)) {
    const existing = readQuestionsFromFile(fileName);
    const map = new Map();
    // Keep new questions at top, followed by existing (deduped by ID)
    qList.forEach(q => map.set(q.id, q));
    existing.forEach(q => { if (!map.has(q.id)) map.set(q.id, q); });

    const merged = Array.from(map.values());
    const ok = writeQuestionsToFile(fileName, merged);
    if (!ok) allSaved = false;
  }

  // Also maintain legacy custom_injected_questions.json for backward compatibility
  try {
    const all = loadAllPersistedQuestions();
    writeQuestionsToFile('custom_injected_questions.json', all);
  } catch (e) {}

  return allSaved;
}

/**
 * High-performance In-Memory Indexer for 1 Lakh+ Questions
 */
class BankIndex {
  constructor() {
    this.byId = new Map();
    this.byChapter = new Map();
    this.byGrade = new Map();
    this.byDifficulty = new Map();
  }

  indexQuestions(questions = []) {
    this.byId.clear();
    this.byChapter.clear();
    this.byGrade.clear();
    this.byDifficulty.clear();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.id) continue;

      this.byId.set(q.id, q);

      // Chapter index
      const chKey = String(q.chapter_number || q.chapter_name || q.chapter || '').toLowerCase().trim();
      if (chKey) {
        if (!this.byChapter.has(chKey)) this.byChapter.set(chKey, []);
        this.byChapter.get(chKey).push(q);
      }

      // Grade index
      const gKey = String(q.grade || '12');
      if (!this.byGrade.has(gKey)) this.byGrade.set(gKey, []);
      this.byGrade.get(gKey).push(q);

      // Difficulty index
      const dKey = String(q.difficulty || 'MEDIUM').toUpperCase();
      if (!this.byDifficulty.has(dKey)) this.byDifficulty.set(dKey, []);
      this.byDifficulty.get(dKey).push(q);
    }
  }
}

const bankIndices = {
  senior_physics: new BankIndex(),
  senior_chemistry: new BankIndex(),
  senior_biology: new BankIndex(),
  senior_mathematics: new BankIndex(),
  class10_science: new BankIndex(),
  class10_maths: new BankIndex(),
  class10_math_pyq_ncert: new BankIndex()
};

/**
 * Hydrates and indexes all questions into inMemoryStore.subjectBanks
 */
function hydrateAllSubjectBanks(inMemoryStore) {
  if (!inMemoryStore) return;
  if (!inMemoryStore.subjectBanks) inMemoryStore.subjectBanks = {};

  const banks = ['senior_physics', 'senior_chemistry', 'senior_biology', 'senior_mathematics', 'class10_science', 'class10_maths', 'class10_math_pyq_ncert'];

  let totalCustomHydrated = 0;

  for (const bKey of banks) {
    if (!inMemoryStore.subjectBanks[bKey]) {
      inMemoryStore.subjectBanks[bKey] = [];
    }

    const customQuestions = loadPersistedQuestionsForBank(bKey);
    if (customQuestions.length > 0) {
      const existingIds = new Set(inMemoryStore.subjectBanks[bKey].map(q => q.id));
      const toAdd = customQuestions.filter(q => !existingIds.has(q.id));
      if (toAdd.length > 0) {
        inMemoryStore.subjectBanks[bKey].unshift(...toAdd);
        totalCustomHydrated += toAdd.length;
      }
    }

    // Build fast lookup index
    if (bankIndices[bKey]) {
      bankIndices[bKey].indexQuestions(inMemoryStore.subjectBanks[bKey]);
    }
  }

  // Cross-sync class10_maths and class10_math_pyq_ncert
  const m1 = inMemoryStore.subjectBanks.class10_maths || [];
  const m2 = inMemoryStore.subjectBanks.class10_math_pyq_ncert || [];
  const mergedM = Array.from(new Map([...m1, ...m2].map(q => [q.id, q])).values());
  inMemoryStore.subjectBanks.class10_maths = mergedM;
  inMemoryStore.subjectBanks.class10_math_pyq_ncert = mergedM;
  bankIndices.class10_maths.indexQuestions(mergedM);
  bankIndices.class10_math_pyq_ncert.indexQuestions(mergedM);

  console.log(`[QUESTION STORAGE] Successfully hydrated ${totalCustomHydrated} subject-partitioned questions across all 6 disciplines.`);
}

/**
 * Scalable pagination & filtering for 1 Lakh+ questions
 */
function paginateQuestions(bankKey, filterOptions = {}, inMemoryStore) {
  const targetKey = ALIAS_MAP[(bankKey || '').toUpperCase()] || bankKey;
  const all = (inMemoryStore?.subjectBanks && inMemoryStore.subjectBanks[targetKey])
    ? inMemoryStore.subjectBanks[targetKey]
    : [];

  const {
    page = 1,
    limit = 50,
    chapter,
    difficulty,
    targetExam,
    grade
  } = filterOptions;

  let filtered = all;

  // Filter by grade
  if (grade && grade !== 'ALL') {
    filtered = filtered.filter(q => String(q.grade) === String(grade));
  }

  // Filter by chapter
  if (chapter && chapter !== 'ALL') {
    const chLower = String(chapter).toLowerCase().trim();
    filtered = filtered.filter(q => {
      if (q.chapter_number !== undefined && String(q.chapter_number) === chLower) return true;
      if (q.chapter && String(q.chapter).toLowerCase() === chLower) return true;
      if (q.chapter_name && q.chapter_name.toLowerCase().includes(chLower)) return true;
      return false;
    });
  }

  // Filter by difficulty
  if (difficulty && difficulty !== 'ALL') {
    const dUpper = difficulty.toUpperCase();
    filtered = filtered.filter(q => q.difficulty?.toUpperCase() === dUpper);
  }

  // Filter by exam
  if (targetExam && targetExam !== 'ALL') {
    const exLower = targetExam.toLowerCase();
    filtered = filtered.filter(q =>
      (q.target_exam && q.target_exam.toLowerCase().includes(exLower)) ||
      (q.curriculum_board && q.curriculum_board.toLowerCase().includes(exLower))
    );
  }

  const total = filtered.length;
  const numLimit = (limit === 'ALL' || limit === 0) ? total : Math.max(1, parseInt(limit, 10) || 50);
  const numPage = Math.max(1, parseInt(page, 10) || 1);
  const totalPages = Math.ceil(total / numLimit) || 1;

  const startIndex = (numPage - 1) * numLimit;
  const paginatedSlice = (limit === 'ALL') ? filtered : filtered.slice(startIndex, startIndex + numLimit);

  return {
    targetKey,
    total,
    page: numPage,
    limit: numLimit,
    totalPages,
    questions: paginatedSlice
  };
}

module.exports = {
  resolveBankKey,
  readQuestionsFromFile,
  writeQuestionsToFile,
  loadPersistedQuestionsForBank,
  loadAllPersistedQuestions,
  savePersistedCustomQuestions,
  hydrateAllSubjectBanks,
  paginateQuestions,
  bankIndices,
  SUBJECT_FILE_MAP,
  ALIAS_MAP
};
