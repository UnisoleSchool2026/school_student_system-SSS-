// ============================================================================
// MODULE: DPP (Daily Practice Problems) + Chapter-wise PYQ Browser
// Competitive: 10-15 timed MCQs per day with streak tracking and NTA marking.
// Board (optional, per school): daily homework set without negative marking.
// The daily set is deterministic for (date, mode, track, subject, grade), so a
// whole class receives the same set and a restarted server rebuilds it exactly.
// ============================================================================

const crypto = require('crypto');
const { inMemoryStore } = require('../config/database');
const content = require('../services/canonicalContentService');
const examPatterns = require('../services/examPatternRegistry');
const tenants = require('../services/tenantConfigService');
const { resolveSubject, emptyPayload } = require('./shared');

const MODULE = {
  id: 'dpp',
  title: 'Daily Practice Problems',
  description: 'Deterministic daily practice set with streak tracking, plus chapter-wise PYQ browser.',
  featureFlag: 'dailyPracticeProblems',
  modes: ['BOARD', 'COMPETITIVE'],
  roles: ['teacher', 'student']
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? String(d) : todayIso();
}

function seededRandom(seedString) {
  const hash = crypto.createHash('sha256').update(seedString).digest();
  let a = hash.readUInt32LE(0);
  return function mulberry32() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, seedString) {
  const rand = seededRandom(seedString);
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function dppConfig(ctx) {
  const cfg = tenants.getModeConfig(ctx.tenant, ctx.mode) || {};
  const d = cfg.dpp || {};
  const min = Number(d.minQuestions) || 10;
  const max = Number(d.maxQuestions) || 15;
  const requested = Number(ctx.count) || Number(d.questionsPerDay) || 12;
  return {
    count: Math.max(min, Math.min(max, requested)),
    timeLimitMinutes: Number(d.timeLimitMinutes) || 20,
    min,
    max
  };
}

function markingFor(ctx) {
  const pattern = examPatterns.getPattern(ctx.patternId);
  if (ctx.mode === 'COMPETITIVE' && pattern && pattern.marking) {
    return { correct: Number(pattern.marking.correct) || 4, incorrect: Number(pattern.marking.incorrect) || 0, patternId: pattern.patternId };
  }
  return { correct: 1, incorrect: 0, patternId: pattern ? pattern.patternId : null };
}

function buildPool(ctx, subjectKey) {
  const subjectKeys = subjectKey === 'ALL'
    ? content.availableSubjects({ mode: ctx.mode, stream: ctx.stream, grade: ctx.grade, teacherSubjectKey: ctx.teacherSubjectKey }).map(s => s.key)
    : [subjectKey];
  return content.query({
    mode: ctx.mode,
    board: ctx.board,
    stream: ctx.stream,
    subjectKeys,
    grade: ctx.mode === 'BOARD' ? ctx.grade : null,
    objectiveOnly: true
  }).items;
}

function makeDppId(parts) {
  return 'dpp_' + crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);
}

// Chapter-wise DPP: chapter options (with objective-question counts) for the chosen subject.
function chapterOptions(pool) {
  const map = new Map();
  pool.forEach(r => {
    if (!r.chapter_code) return;
    if (!map.has(r.chapter_code)) map.set(r.chapter_code, { key: r.chapter_code, chapterName: r.chapter_name, grade: r.grade, count: 0 });
    map.get(r.chapter_code).count += 1;
  });
  return Array.from(map.values()).sort((a, b) => String(a.grade).localeCompare(String(b.grade)) || String(a.key).localeCompare(String(b.key)));
}

function generateSet(ctx, subjectKey, date) {
  const cfg = dppConfig(ctx);
  const fullPool = buildPool(ctx, subjectKey);
  const chapter = ctx.chapter && fullPool.some(r => r.chapter_code === ctx.chapter) ? ctx.chapter : null;
  const pool = chapter ? fullPool.filter(r => r.chapter_code === chapter) : fullPool;
  // The chapter joins the seed only when one is chosen, so whole-subject DPP ids stay unchanged.
  const seedParts = [date, ctx.schoolId, ctx.mode, ctx.track, subjectKey, ctx.grade || 'all'].concat(chapter ? [chapter] : []);
  const picked = seededShuffle(pool, seedParts.join('|')).slice(0, cfg.count);
  return {
    dppId: makeDppId(seedParts.concat([String(cfg.count)])),
    date,
    poolSize: pool.length,
    timeLimitMinutes: cfg.timeLimitMinutes,
    chapter,
    chapters: chapterOptions(fullPool),
    questions: picked
  };
}

function attemptsStore() {
  if (!Array.isArray(inMemoryStore.dppAttempts)) inMemoryStore.dppAttempts = [];
  return inMemoryStore.dppAttempts;
}

function computeStreak(studentId, schoolId, track, fromDate) {
  if (!studentId) return { current: 0, best: 0, completedDates: [] };
  const dates = new Set(attemptsStore()
    .filter(a => a.studentId === studentId && a.schoolId === schoolId && a.track === track)
    .map(a => a.date));
  const sorted = Array.from(dates).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  sorted.forEach(d => {
    const cur = new Date(`${d}T00:00:00Z`);
    run = prev && (cur - prev) === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  });
  // Current streak counts back from today (or yesterday, so an unfinished today does not reset it).
  let current = 0;
  const cursor = new Date(`${normalizeDate(fromDate)}T00:00:00Z`);
  if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { current, best, completedDates: sorted.slice(-30) };
}

function summarizePyqChapters(ctx, subjectKey) {
  const items = content.query({
    mode: ctx.mode,
    board: ctx.board,
    stream: ctx.stream,
    subjectKey,
    grade: ctx.mode === 'BOARD' ? ctx.grade : null,
    contentType: 'PYQ'
  }).items;
  const map = new Map();
  items.forEach(r => {
    if (!map.has(r.chapter_code)) {
      map.set(r.chapter_code, {
        chapterCode: r.chapter_code,
        chapterName: r.chapter_name,
        grade: r.grade,
        count: 0,
        years: new Set(),
        difficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
        nativeCompetitive: 0
      });
    }
    const c = map.get(r.chapter_code);
    c.count += 1;
    r.year_tags.forEach(y => c.years.add(y));
    if (c.difficulty[r.difficulty_level] !== undefined) c.difficulty[r.difficulty_level] += 1;
    if (r.competitive_source === 'NATIVE') c.nativeCompetitive += 1;
  });
  return Array.from(map.values())
    .map(c => Object.assign(c, { years: Array.from(c.years).sort().reverse().slice(0, 6) }))
    .sort((a, b) => b.count - a.count);
}

function build(ctx) {
  const { subjects, subjectKey } = resolveSubject(ctx);
  if (!subjectKey) return emptyPayload(MODULE, ctx, 'No subject is available for this class and mode.', { availableSubjects: subjects });
  const chosenSubject = String(ctx.subjectKey || '').toUpperCase() === 'ALL' && !ctx.teacherSubjectKey ? 'ALL' : subjectKey;
  const date = normalizeDate(ctx.date);
  const set = generateSet(ctx, chosenSubject, date);
  const marking = markingFor(ctx);
  const subjectOptions = (ctx.teacherSubjectKey ? [] : [{ key: 'ALL', label: 'All subjects (mixed)' }]).concat(subjects);

  if (!set.questions.length) {
    return emptyPayload(MODULE, ctx, 'No objective practice questions match this subject and track yet.', {
      availableSubjects: subjectOptions,
      subjectKey: chosenSubject
    });
  }

  return {
    moduleId: MODULE.id,
    title: ctx.mode === 'COMPETITIVE' ? 'Chapter-wise DPP' : 'Board Homework Set',
    mode: ctx.mode,
    track: ctx.track,
    empty: false,
    availableSubjects: subjectOptions,
    subjectKey: chosenSubject,
    data: {
      dppId: set.dppId,
      date: set.date,
      chapter: set.chapter,
      chapters: set.chapters,
      timeLimitMinutes: set.timeLimitMinutes,
      marking,
      poolSize: set.poolSize,
      questionCount: set.questions.length,
      questions: set.questions.map((r, i) => Object.assign(content.toPublic(r), { index: i + 1 })),
      streak: computeStreak(ctx.studentId, ctx.schoolId, ctx.track, date),
      poolWarning: set.questions.length < dppConfig(ctx).min
        ? `Only ${set.questions.length} objective question(s) are available for this subject and track, below the daily target of ${dppConfig(ctx).min}. Add more ${ctx.track} questions through Question Injection, or pick "All subjects (mixed)".`
        : '',
      pyqChapters: summarizePyqChapters(ctx, chosenSubject === 'ALL' ? null : chosenSubject),
      sourceNote: 'Class 11/12 board MCQs are included as competitive practice where native JEE/NEET questions are limited.'
    }
  };
}

// Scores a submitted set. The set is regenerated from the same context, so the
// client cannot tamper with which questions or answers count.
function submit(ctx, { dppId, answers = {}, timeTakenSeconds }) {
  const { subjectKey } = resolveSubject(ctx);
  const chosenSubject = String(ctx.subjectKey || '').toUpperCase() === 'ALL' && !ctx.teacherSubjectKey ? 'ALL' : subjectKey;
  const date = normalizeDate(ctx.date);
  const set = generateSet(ctx, chosenSubject, date);
  if (!dppId || dppId !== set.dppId) {
    return { error: 'DPP set does not match today\'s set for this context. Reload the DPP and try again.', status: 409 };
  }
  const marking = markingFor(ctx);
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  const results = set.questions.map((r, i) => {
    const selected = answers[r.id] ? String(answers[r.id]).trim().toUpperCase() : null;
    const isCorrect = Boolean(selected && selected === r.correct_answer);
    const marks = isCorrect ? marking.correct : (selected ? marking.incorrect : 0);
    score += marks;
    if (isCorrect) correctCount += 1; else if (selected) wrongCount += 1;
    const chosen = (r.mcq_options || []).find(o => o.key === selected);
    return {
      index: i + 1,
      questionId: r.id,
      selected,
      correctAnswer: r.correct_answer,
      isCorrect,
      marks,
      trap: !isCorrect && chosen ? chosen.trap || null : null,
      solutionLatex: r.solution_latex || ''
    };
  });
  const maxScore = set.questions.length * marking.correct;
  const attempt = {
    id: `dppa_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    dppId: set.dppId,
    schoolId: ctx.schoolId,
    studentId: ctx.studentId || 'anonymous',
    mode: ctx.mode,
    track: ctx.track,
    subjectKey: chosenSubject,
    chapter: set.chapter,
    date,
    score,
    maxScore,
    correctCount,
    wrongCount,
    unattempted: set.questions.length - correctCount - wrongCount,
    timeTakenSeconds: Number(timeTakenSeconds) || null,
    completedAt: new Date().toISOString()
  };
  attemptsStore().push(attempt);
  return {
    attempt,
    results,
    streak: computeStreak(attempt.studentId, ctx.schoolId, ctx.track, date)
  };
}

module.exports = Object.assign(MODULE, { build, submit, computeStreak, generateSet });
