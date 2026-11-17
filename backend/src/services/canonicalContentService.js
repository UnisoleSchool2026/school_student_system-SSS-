// ============================================================================
// UNISOLE AI SCHOOL: CANONICAL CURRICULUM CONTENT ADAPTER
// Projects every existing subject-bank question onto the unified
// `curriculum_content` model (backend/database/schema.sql) so both modes share
// one content library instead of duplicated endpoints:
//
//   target_modes        ['BOARD'] | ['COMPETITIVE'] | ['BOARD','COMPETITIVE']
//   board_targets       ['CBSE','HP_BOARD', ...]
//   competitive_targets ['JEE_MAIN','JEE_ADVANCED','NEET']
//
// Classification rules (documented so content teams can tag deliberately):
//   1. Explicit tags in target_exam / curriculum_board / pyq_appearance /
//      question_source win (e.g. "CBSE Class 12 Board 2023 & NEET 2022").
//   2. CBSE content also serves HP_BOARD (NCERT-aligned) via
//      exam_patterns.json -> boardContentAliases. ICSE is never inferred.
//   3. Class 11/12 objective questions (MCQ with 4 options and one correct key)
//      are also offered to COMPETITIVE practice for the streams that test that
//      subject (Physics/Chemistry -> JEE+NEET, Maths -> JEE, Biology -> NEET).
//      These carry competitive_source = 'DERIVED_BOARD_MCQ'.
// ============================================================================

const { inMemoryStore } = require('../config/database');
const examPatterns = require('./examPatternRegistry');

const BANK_SUBJECT_KEYS = {
  class10_math_pyq_ncert: 'CLASS10_MATHEMATICS',
  class10_maths: 'CLASS10_MATHEMATICS',
  class10_science: 'CLASS10_SCIENCE',
  senior_physics: 'PHYSICS',
  senior_chemistry: 'CHEMISTRY',
  senior_mathematics: 'MATHEMATICS',
  senior_biology: 'BIOLOGY'
};

const SUBJECT_COMPETITIVE_TARGETS = {
  PHYSICS: ['JEE_MAIN', 'NEET'],
  CHEMISTRY: ['JEE_MAIN', 'NEET'],
  MATHEMATICS: ['JEE_MAIN'],
  BIOLOGY: ['NEET']
};

const STREAM_TARGETS = {
  JEE: ['JEE_MAIN', 'JEE_ADVANCED'],
  NEET: ['NEET']
};

const STREAM_SUBJECTS = {
  JEE: ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'],
  NEET: ['PHYSICS', 'CHEMISTRY', 'BIOLOGY']
};

const SUBJECT_LABELS = {
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  MATHEMATICS: 'Mathematics',
  BIOLOGY: 'Biology',
  CLASS10_MATHEMATICS: 'Class 10 Mathematics',
  CLASS10_SCIENCE: 'Class 10 Science'
};

const OBJECTIVE_FORMATS = new Set(['MCQ_SINGLE', 'ASSERTION_REASON']);

let indexCache = { signature: null, records: [], byId: new Map() };

function slugify(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'GENERAL';
}

function getOptions(q) {
  const src = Array.isArray(q.options_latex) && q.options_latex.length ? q.options_latex : (Array.isArray(q.options) ? q.options : []);
  return src
    .filter(o => o && o.key)
    .map(o => ({
      key: String(o.key).trim().toUpperCase(),
      latex: o.latex || o.text || '',
      isCorrect: Boolean(o.is_correct || o.isCorrect),
      trap: o.distractor_trap || o.trap || null
    }));
}

function getCorrectKey(q, options) {
  const flagged = options.filter(o => o.isCorrect);
  if (flagged.length === 1) return flagged[0].key;
  const direct = String(q.correct_answer || '').trim().toUpperCase();
  if (/^[A-D]$/.test(direct)) return direct;
  return null;
}

function extractTags(q) {
  const text = [q.target_exam, q.curriculum_board, q.pyq_appearance, q.question_source, q.source_category]
    .filter(Boolean).join(' | ').toUpperCase();
  const boards = new Set();
  const competitive = new Set();
  if (/CBSE/.test(text)) boards.add('CBSE');
  if (/HP[\s_-]?BOARD|HPBOSE/.test(text)) boards.add('HP_BOARD');
  if (/ICSE/.test(text)) boards.add('ICSE');
  if (/JEE[\s_-]*ADV/.test(text)) competitive.add('JEE_ADVANCED');
  if (/JEE[\s_-]*MAIN/.test(text) || /\bJEE\b(?![\s_-]*ADV)/.test(text)) competitive.add('JEE_MAIN');
  if (/NEET/.test(text)) competitive.add('NEET');
  return { boards: Array.from(boards), competitive: Array.from(competitive) };
}

function extractYearTags(q) {
  const text = String(q.pyq_appearance || '').toUpperCase();
  const tags = [];
  const re = /(CBSE|NEET|JEE[\s_-]*MAIN|JEE[\s_-]*ADVANCED|JEE)[^0-9&]{0,40}(20\d\d)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tags.push(`${m[1].replace(/[\s-]+/g, '_')}_${m[2]}`);
  }
  return tags;
}

function classifyContentType(q, yearTags) {
  const src = String(q.question_source || q.source_category || '').toUpperCase();
  const appearance = String(q.pyq_appearance || '').toUpperCase();
  if (yearTags.length || /PYQ/.test(src) || /PYQ|PREVIOUS YEAR/.test(appearance)) return 'PYQ';
  if (/NCERT/.test(src)) return 'NCERT';
  if (/SAMPLE|PATTERN/.test(src) || /PATTERN/.test(appearance)) return 'SAMPLE_PATTERN';
  return 'PRACTICE';
}

function toCanonical(q, bankKey) {
  const subjectKey = BANK_SUBJECT_KEYS[bankKey] || slugify(q.subjectKey || q.subject);
  const grade = String(q.grade || (subjectKey.startsWith('CLASS10') ? '10' : '12'));
  const options = getOptions(q);
  const correctKey = getCorrectKey(q, options);
  const format = String(q.question_format || '').toUpperCase();
  const isObjective = OBJECTIVE_FORMATS.has(format) && options.length === 4 && Boolean(correctKey);

  const tags = extractTags(q);
  let boardTargets = tags.boards.slice();
  if (boardTargets.length === 0 && tags.competitive.length === 0) boardTargets = ['CBSE'];
  boardTargets = examPatterns.expandBoardTargets(boardTargets);

  let competitiveTargets = tags.competitive.slice();
  let competitiveSource = competitiveTargets.length ? 'NATIVE' : null;
  if (!competitiveTargets.length && isObjective && (grade === '11' || grade === '12') && SUBJECT_COMPETITIVE_TARGETS[subjectKey]) {
    competitiveTargets = SUBJECT_COMPETITIVE_TARGETS[subjectKey].slice();
    competitiveSource = 'DERIVED_BOARD_MCQ';
  }

  const targetModes = [];
  if (boardTargets.length) targetModes.push('BOARD');
  if (competitiveTargets.length) targetModes.push('COMPETITIVE');

  const yearTags = extractYearTags(q);
  const chapterNumber = Number(q.chapter_number);
  const chapterName = q.chapter_name || q.chapter || q.topic || 'General';
  const chapterCode = Number.isFinite(chapterNumber) && chapterNumber > 0
    ? `${subjectKey}_G${grade}_CH${String(chapterNumber).padStart(2, '0')}`
    : `${subjectKey}_G${grade}_${slugify(chapterName)}`;

  return {
    id: q.id,
    subject: q.subject || SUBJECT_LABELS[subjectKey] || subjectKey,
    subject_key: subjectKey,
    grade,
    chapter_code: chapterCode,
    chapter_number: Number.isFinite(chapterNumber) ? chapterNumber : null,
    chapter_name: chapterName,
    topic: q.topic || chapterName,
    subtopic: q.subtopic || '',
    target_modes: targetModes,
    board_targets: boardTargets,
    competitive_targets: competitiveTargets,
    competitive_source: competitiveSource,
    content_type: classifyContentType(q, yearTags),
    is_ncert: /NCERT/.test(String(q.question_source || q.source_category || '').toUpperCase()) || /NCERT|EXEMPLAR/.test(String(q.pyq_appearance || '').toUpperCase()),
    content_hash: q.contentHash || q.content_hash || null,
    status: q.status || 'APPROVED',
    question_format: format || 'UNSPECIFIED',
    is_objective: isObjective,
    question_latex: q.question_latex || '',
    solution_latex: q.solution_latex || '',
    rubric_steps: Array.isArray(q.step_rubric) && q.step_rubric.length ? q.step_rubric : null,
    mcq_options: options.length ? options : null,
    correct_answer: correctKey || (q.correct_answer_latex ? String(q.correct_answer_latex) : null),
    difficulty_level: String(q.difficulty || 'MEDIUM').toUpperCase(),
    year_tag: yearTags[0] || null,
    year_tags: yearTags,
    marks: Number(q.marks || q.marks_weightage) || null,
    benchmark_time_seconds: Number(q.benchmark_time_seconds) || null,
    pyq_appearance: q.pyq_appearance || '',
    source_raw: String(q.question_source || q.source_category || '').toUpperCase(),
    source_bank: bankKey
  };
}

function computeSignature() {
  const banks = inMemoryStore.subjectBanks || {};
  const parts = Object.keys(banks).sort().map(k => `${k}:${(banks[k] || []).length}`);
  return parts.join('|');
}

function getIndex() {
  const signature = computeSignature();
  if (indexCache.signature === signature) return indexCache;
  const banks = inMemoryStore.subjectBanks || {};
  const records = [];
  const byId = new Map();
  // class10_math_pyq_ncert is listed first so it wins over the duplicate class10_maths copy.
  const bankOrder = Object.keys(BANK_SUBJECT_KEYS).filter(k => banks[k]).concat(Object.keys(banks).filter(k => !BANK_SUBJECT_KEYS[k]));
  bankOrder.forEach(bankKey => {
    (banks[bankKey] || []).forEach(q => {
      if (!q || !q.id || byId.has(q.id)) return;
      const rec = toCanonical(q, bankKey);
      byId.set(rec.id, rec);
      records.push(rec);
    });
  });
  indexCache = { signature, records, byId };
  return indexCache;
}

function classifyQuestion(q, bankKeyHint) {
  if (!q || !q.id) return null;
  const idx = getIndex();
  return idx.byId.get(q.id) || toCanonical(q, bankKeyHint || '');
}

// True when a canonical record belongs to the requested mode / board / stream.
function matchesModeContext(rec, { mode, board, stream } = {}) {
  if (!rec) return false;
  const m = examPatterns.normalizeKey(mode);
  if (!m) return true;
  if (!rec.target_modes.includes(m)) return false;
  if (m === 'BOARD' && board) return rec.board_targets.includes(examPatterns.normalizeKey(board));
  if (m === 'COMPETITIVE' && stream) {
    const targets = STREAM_TARGETS[examPatterns.normalizeKey(stream)] || [];
    return rec.competitive_targets.some(t => targets.includes(t));
  }
  return true;
}

function query(filters = {}) {
  const {
    mode, board, stream, subjectKey, subjectKeys, grade, chapter, contentType, difficulty,
    yearTag, search, objectiveOnly, ncertOnly, limit, offset, status = 'APPROVED'
  } = filters;
  let results = getIndex().records.filter(r => matchesModeContext(r, { mode, board, stream }));

  // Non-negotiable lifecycle invariant: Only APPROVED questions are returned by default
  if (status && status !== 'ALL') {
    results = results.filter(r => (r.status || 'APPROVED') === status);
  }

  if (subjectKey && subjectKey !== 'ALL') {
    const sk = examPatterns.normalizeKey(subjectKey);
    results = results.filter(r => r.subject_key === sk);
  }
  if (Array.isArray(subjectKeys) && subjectKeys.length) {
    const set = new Set(subjectKeys.map(examPatterns.normalizeKey));
    results = results.filter(r => set.has(r.subject_key));
  }
  if (grade && grade !== 'ALL') results = results.filter(r => r.grade === String(grade));
  if (chapter && chapter !== 'ALL') {
    const c = String(chapter).toLowerCase();
    results = results.filter(r => r.chapter_code.toLowerCase() === c || r.chapter_name.toLowerCase().includes(c));
  }
  if (contentType && contentType !== 'ALL') {
    const ct = examPatterns.normalizeKey(contentType);
    results = results.filter(r => r.content_type === ct);
  }
  if (difficulty && difficulty !== 'ALL') {
    const d = examPatterns.normalizeKey(difficulty);
    results = results.filter(r => r.difficulty_level === d);
  }
  if (yearTag) {
    const y = examPatterns.normalizeKey(yearTag);
    results = results.filter(r => r.year_tags.some(t => t.includes(y)));
  }
  if (objectiveOnly) results = results.filter(r => r.is_objective);
  if (ncertOnly) results = results.filter(r => r.is_ncert || r.content_type === 'NCERT');
  if (search && String(search).trim()) {
    const s = String(search).toLowerCase();
    results = results.filter(r =>
      r.question_latex.toLowerCase().includes(s) ||
      r.topic.toLowerCase().includes(s) ||
      r.chapter_name.toLowerCase().includes(s) ||
      r.subtopic.toLowerCase().includes(s));
  }

  const total = results.length;
  const lim = limit === undefined ? total : Math.max(1, Math.min(500, Number(limit) || 50));
  const off = Math.max(0, Number(offset) || 0);
  return { total, items: results.slice(off, off + lim) };
}

// Strips answers / traps unless explicitly requested (student practice views).
function toPublic(rec, { includeSolutions = false } = {}) {
  const out = Object.assign({}, rec);
  if (!includeSolutions) {
    delete out.correct_answer;
    delete out.solution_latex;
    delete out.rubric_steps;
    if (Array.isArray(out.mcq_options)) {
      out.mcq_options = out.mcq_options.map(o => ({ key: o.key, latex: o.latex }));
    }
  }
  return out;
}

function getStats() {
  const recs = getIndex().records;
  const byTrack = {};
  const bySubject = {};
  const byContentType = {};
  const inc = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
  recs.forEach(r => {
    r.board_targets.forEach(b => inc(byTrack, `BOARD:${b}`));
    const streams = new Set();
    r.competitive_targets.forEach(t => {
      if (STREAM_TARGETS.JEE.includes(t)) streams.add('JEE');
      if (STREAM_TARGETS.NEET.includes(t)) streams.add('NEET');
    });
    streams.forEach(s => inc(byTrack, `COMPETITIVE:${s}`));
    inc(bySubject, r.subject_key);
    inc(byContentType, r.content_type);
  });
  const nativeCompetitive = recs.filter(r => r.competitive_source === 'NATIVE').length;
  const derivedCompetitive = recs.filter(r => r.competitive_source === 'DERIVED_BOARD_MCQ').length;
  return { total: recs.length, byTrack, bySubject, byContentType, nativeCompetitive, derivedCompetitive };
}

// Subjects a mode/track/grade can draw from, narrowed by teacher subject isolation.
function availableSubjects({ mode, stream, grade, teacherSubjectKey } = {}) {
  let list;
  if (examPatterns.normalizeKey(mode) === 'COMPETITIVE') {
    list = STREAM_SUBJECTS[examPatterns.normalizeKey(stream)] || STREAM_SUBJECTS.JEE;
  } else if (String(grade) === '10') {
    list = ['CLASS10_MATHEMATICS', 'CLASS10_SCIENCE'];
  } else if (grade === '11' || grade === '12') {
    list = ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'BIOLOGY'];
  } else {
    list = ['CLASS10_MATHEMATICS', 'CLASS10_SCIENCE', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'BIOLOGY'];
  }
  if (teacherSubjectKey) {
    const tk = examPatterns.normalizeKey(teacherSubjectKey);
    list = list.filter(s => s === tk);
  }
  return list.map(key => ({ key, label: SUBJECT_LABELS[key] || key }));
}

module.exports = {
  BANK_SUBJECT_KEYS,
  STREAM_TARGETS,
  STREAM_SUBJECTS,
  SUBJECT_LABELS,
  toCanonical,
  classifyQuestion,
  matchesModeContext,
  query,
  toPublic,
  getStats,
  getIndex,
  availableSubjects
};
