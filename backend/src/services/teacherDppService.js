// ============================================================================
// TEACHER-CREATED DPPs (Daily Practice Problems)
// A teacher builds a DPP for one of their classes, either by picking questions
// from the question bank (chapter-wise, objective only) or from their own
// questions (typed / PDF / photo, read by the question injection pipeline),
// assigns it to the class and sees each student's result.
//
// Isolation:
//   - A teacher can create / list / see results only for their own subject and
//     classes (services/subjectScope.js).
//   - A student sees only DPPs assigned to their own class, and never the
//     answers before submitting.
// Storage: in memory, persisted to src/database/teacher_dpps.json.
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { inMemoryStore } = require('../config/database');
const content = require('./canonicalContentService');
const subjectScope = require('./subjectScope');

const dataPaths = require('../config/dataPaths');
// Saved to backend/data/teacher_dpps.json (older versions wrote src/database/teacher_dpps.json; it is still read once if present).
const STORE_NAME = 'teacher_dpps.json';
const LEGACY_FILE = path.join(__dirname, '..', 'database', 'teacher_dpps.json');
const MIN_Q = 1;
const MAX_Q = 40;

function store() {
  if (!Array.isArray(inMemoryStore.teacherDpps)) inMemoryStore.teacherDpps = [];
  if (!Array.isArray(inMemoryStore.teacherDppAttempts)) inMemoryStore.teacherDppAttempts = [];
  return inMemoryStore;
}

function load() {
  store();
  try {
    const source = dataPaths.readPath(STORE_NAME, LEGACY_FILE);
    if (source) {
      const raw = JSON.parse(fs.readFileSync(source, 'utf8'));
      if (Array.isArray(raw.dpps)) inMemoryStore.teacherDpps = raw.dpps;
      if (Array.isArray(raw.attempts)) inMemoryStore.teacherDppAttempts = raw.attempts;
    }
  } catch (err) {
    console.warn('[TEACHER DPP] Could not read teacher_dpps.json:', err.message);
  }
}

function save() {
  try {
    dataPaths.writeJson(STORE_NAME, { dpps: inMemoryStore.teacherDpps, attempts: inMemoryStore.teacherDppAttempts }, true);
  } catch (err) {
    console.warn('[TEACHER DPP] Could not write teacher_dpps.json:', err.message);
  }
}

function fail(status, error) {
  const e = new Error(error);
  e.status = status;
  return e;
}

function sectionEq(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase();
}

function studentsOf(section) {
  return (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && sectionEq(u.section, section));
}

function gradeOfSection(section) {
  const cls = (inMemoryStore.classes || []).find(c => [c.id, c.key, c.section].some(v => sectionEq(v, section)));
  if (cls) return String(cls.grade);
  const m = String(section || '').match(/^(\d+)/);
  return m ? m[1] : '';
}

function shuffle(list, seed) {
  const arr = list.slice();
  let h = crypto.createHash('sha256').update(seed).digest().readUInt32LE(0);
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Normalise a bank record or an extracted (typed / PDF / photo) question into the DPP shape.
function fromBankRecord(r) {
  return {
    id: r.id,
    source: 'BANK',
    questionLatex: r.question_latex,
    options: (r.mcq_options || []).map(o => ({ key: o.key, latex: o.latex })),
    correctAnswer: r.correct_answer,
    solutionLatex: r.solution_latex || '',
    chapterName: r.chapter_name || '',
    topic: r.topic || '',
    difficulty: r.difficulty_level || 'MEDIUM'
  };
}

function fromCustom(q, i) {
  const options = (q.options_latex || q.options || []).map(o => ({ key: String(o.key || '').toUpperCase(), latex: String(o.latex || o.text || ''), isCorrect: Boolean(o.is_correct || o.isCorrect) }));
  const keyed = options.find(o => o.isCorrect);
  const correct = String(q.correct_answer || q.correctAnswer || (keyed ? keyed.key : '') || '').toUpperCase();
  return {
    id: `tq_${Date.now().toString(36)}_${i}_${crypto.randomBytes(2).toString('hex')}`,
    source: 'TEACHER',
    questionLatex: String(q.question_latex || q.questionLatex || '').trim(),
    options: options.map(o => ({ key: o.key, latex: o.latex })),
    correctAnswer: correct,
    solutionLatex: String(q.solution_latex || q.solutionLatex || ''),
    chapterName: q.chapter_name || q.chapterName || '',
    topic: q.topic || '',
    difficulty: String(q.difficulty || 'MEDIUM').toUpperCase()
  };
}

function validQuestion(q) {
  return q.questionLatex && q.options.length >= 2 && q.options.some(o => o.key === q.correctAnswer);
}

// ---------------------------------------------------------------- create --
function create(body = {}) {
  store();
  const teacher = body.teacher || {};
  const teacherSubjectKey = String(teacher.subjectKey || body.teacherSubjectKey || '').toUpperCase();
  const subjectKey = String(body.subjectKey || teacherSubjectKey).toUpperCase();
  const section = String(body.section || body.classId || '').trim();
  if (!teacherSubjectKey) throw fail(400, 'teacher.subjectKey is required.');
  if (!section) throw fail(400, 'Choose the class to assign this DPP to.');
  const grade = gradeOfSection(section);
  const scopeErr = subjectScope.checkTeacherWrite(teacherSubjectKey, { subjectKey, section, grade });
  if (scopeErr) throw fail(scopeErr.status, scopeErr.error);
  if (!subjectScope.classTeachesSubject(section, subjectKey)) throw fail(400, `Class ${section} does not study ${subjectKey}.`);

  const source = String(body.source || 'BANK').toUpperCase();
  let questions = [];
  if (source === 'BANK') {
    const count = Math.max(MIN_Q, Math.min(MAX_Q, Number(body.count) || 10));
    const pool = content.query({
      subjectKey,
      grade,
      chapter: body.chapterCode || null,
      objectiveOnly: true
    }).items;
    if (!pool.length) throw fail(400, 'No objective questions with answers exist for this chapter yet. Add your own questions instead.');
    questions = shuffle(pool, `${section}|${body.chapterCode || 'all'}|${Date.now()}`).slice(0, count).map(fromBankRecord);
  } else if (source === 'CUSTOM') {
    const raw = Array.isArray(body.questions) ? body.questions : [];
    const all = raw.map(fromCustom);
    questions = all.filter(validQuestion);
    if (!questions.length) throw fail(400, 'Add at least one multiple-choice question with its correct option.');
    if (questions.length > MAX_Q) questions = questions.slice(0, MAX_Q);
  } else {
    throw fail(400, 'source must be BANK or CUSTOM.');
  }

  const now = new Date().toISOString();
  const dpp = {
    id: `tdpp_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    title: String(body.title || '').trim() || `DPP: ${questions[0].chapterName || subjectKey}`,
    subjectKey,
    subject: body.subjectName || teacher.subjectName || teacher.subject || subjectKey,
    section,
    grade,
    chapterCode: body.chapterCode || null,
    chapterName: body.chapterName || (questions[0] && questions[0].chapterName) || '',
    mode: body.mode || null,
    track: body.track || null,
    source,
    teacherId: teacher.id || null,
    teacherName: teacher.name || teacher.full_name || '',
    timeLimitMinutes: Math.max(5, Math.min(180, Number(body.timeLimitMinutes) || 20)),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate || '')) ? body.dueDate : null,
    marking: { correct: Number(body.correctMarks) || 4, incorrect: body.incorrectMarks === undefined ? -1 : Number(body.incorrectMarks) },
    questions,
    createdAt: now
  };
  inMemoryStore.teacherDpps.unshift(dpp);
  save();
  return dpp;
}

// ------------------------------------------------------------ teacher view --
function inTeacherScope(teacherSubjectKey, dpp) {
  return subjectScope.assessmentInScope(teacherSubjectKey, { subjectKey: dpp.subjectKey, subject: dpp.subject, section: dpp.section, grade: dpp.grade });
}

function resultsFor(dpp) {
  const attempts = store().teacherDppAttempts.filter(a => a.dppId === dpp.id);
  const roster = studentsOf(dpp.section);
  const maxScore = dpp.questions.length * dpp.marking.correct;
  const latestByStudent = new Map();
  attempts.forEach(a => { latestByStudent.set(a.studentId, a); });
  const students = roster.map(s => {
    const a = latestByStudent.get(s.id);
    return {
      studentId: s.id,
      name: s.full_name,
      roll: s.roll_number,
      status: a ? 'SUBMITTED' : 'PENDING',
      score: a ? a.score : null,
      maxScore,
      percent: a ? a.percent : null,
      correct: a ? a.correctCount : null,
      wrong: a ? a.wrongCount : null,
      skipped: a ? a.unattempted : null,
      timeTakenSeconds: a ? a.timeTakenSeconds : null,
      submittedAt: a ? a.submittedAt : null
    };
  });
  const done = students.filter(s => s.status === 'SUBMITTED');
  const perQuestion = dpp.questions.map((q, i) => {
    const answered = Array.from(latestByStudent.values()).map(a => a.answers[q.id]).filter(Boolean);
    const correct = answered.filter(k => k === q.correctAnswer).length;
    return {
      index: i + 1,
      questionId: q.id,
      questionLatex: q.questionLatex,
      correctAnswer: q.correctAnswer,
      answered: answered.length,
      correct,
      accuracy: answered.length ? Math.round((correct / answered.length) * 1000) / 10 : null
    };
  });
  return {
    submitted: done.length,
    enrolled: roster.length,
    avgPercent: done.length ? Math.round((done.reduce((s, x) => s + x.percent, 0) / done.length) * 10) / 10 : null,
    maxScore,
    students,
    perQuestion
  };
}

function summary(dpp) {
  const r = resultsFor(dpp);
  return {
    id: dpp.id, title: dpp.title, subject: dpp.subject, subjectKey: dpp.subjectKey, section: dpp.section, grade: dpp.grade,
    chapterName: dpp.chapterName, source: dpp.source, questionCount: dpp.questions.length, timeLimitMinutes: dpp.timeLimitMinutes,
    dueDate: dpp.dueDate, createdAt: dpp.createdAt, teacherName: dpp.teacherName,
    submitted: r.submitted, enrolled: r.enrolled, avgPercent: r.avgPercent
  };
}

function listForTeacher(teacherSubjectKey, section) {
  if (!teacherSubjectKey) throw fail(400, 'teacherSubjectKey is required.');
  return store().teacherDpps
    .filter(d => inTeacherScope(teacherSubjectKey, d))
    .filter(d => !section || sectionEq(d.section, section))
    .map(summary);
}

function teacherDetail(id, teacherSubjectKey) {
  const dpp = store().teacherDpps.find(d => d.id === id);
  if (!dpp) throw fail(404, 'DPP not found.');
  if (!teacherSubjectKey || !inTeacherScope(teacherSubjectKey, dpp)) throw fail(403, 'This DPP belongs to another subject or class.');
  return Object.assign(summary(dpp), { questions: dpp.questions, marking: dpp.marking, results: resultsFor(dpp) });
}

function remove(id, teacherSubjectKey) {
  const s = store();
  const dpp = s.teacherDpps.find(d => d.id === id);
  if (!dpp) throw fail(404, 'DPP not found.');
  if (!teacherSubjectKey || !inTeacherScope(teacherSubjectKey, dpp)) throw fail(403, 'This DPP belongs to another subject or class.');
  s.teacherDpps = s.teacherDpps.filter(d => d.id !== id);
  s.teacherDppAttempts = s.teacherDppAttempts.filter(a => a.dppId !== id);
  save();
  return { removed: id };
}

// ------------------------------------------------------------ student view --
function studentById(studentId) {
  return (inMemoryStore.users || []).find(u => u.role === 'STUDENT' && u.id === studentId) || null;
}

function listForStudent(studentId) {
  const student = studentById(studentId);
  if (!student) throw fail(404, 'Student not found.');
  return store().teacherDpps
    .filter(d => sectionEq(d.section, student.section))
    .map(d => {
      const a = store().teacherDppAttempts.filter(x => x.dppId === d.id && x.studentId === student.id).pop();
      return {
        id: d.id, title: d.title, subject: d.subject, chapterName: d.chapterName, questionCount: d.questions.length,
        timeLimitMinutes: d.timeLimitMinutes, dueDate: d.dueDate, createdAt: d.createdAt, teacherName: d.teacherName,
        status: a ? 'SUBMITTED' : 'PENDING', score: a ? a.score : null, maxScore: d.questions.length * d.marking.correct, percent: a ? a.percent : null
      };
    });
}

function studentDetail(id, studentId) {
  const student = studentById(studentId);
  const dpp = store().teacherDpps.find(d => d.id === id);
  if (!dpp) throw fail(404, 'DPP not found.');
  if (!student || !sectionEq(student.section, dpp.section)) throw fail(403, 'This DPP is not assigned to your class.');
  const attempt = store().teacherDppAttempts.filter(a => a.dppId === id && a.studentId === studentId).pop() || null;
  return {
    id: dpp.id, title: dpp.title, subject: dpp.subject, chapterName: dpp.chapterName, timeLimitMinutes: dpp.timeLimitMinutes,
    marking: dpp.marking, dueDate: dpp.dueDate,
    // Answers and solutions only after the student has submitted.
    questions: dpp.questions.map((q, i) => Object.assign(
      { index: i + 1, id: q.id, questionLatex: q.questionLatex, options: q.options, difficulty: q.difficulty, chapterName: q.chapterName },
      attempt ? { correctAnswer: q.correctAnswer, solutionLatex: q.solutionLatex, selected: attempt.answers[q.id] || null } : {}
    )),
    attempt: attempt ? { score: attempt.score, maxScore: attempt.maxScore, percent: attempt.percent, correct: attempt.correctCount, wrong: attempt.wrongCount, skipped: attempt.unattempted, submittedAt: attempt.submittedAt } : null
  };
}

function submit(id, { studentId, answers = {}, timeTakenSeconds } = {}) {
  const student = studentById(studentId);
  const dpp = store().teacherDpps.find(d => d.id === id);
  if (!dpp) throw fail(404, 'DPP not found.');
  if (!student || !sectionEq(student.section, dpp.section)) throw fail(403, 'This DPP is not assigned to your class.');
  if (store().teacherDppAttempts.some(a => a.dppId === id && a.studentId === studentId)) throw fail(409, 'You have already submitted this DPP.');
  const clean = {};
  let score = 0; let correctCount = 0; let wrongCount = 0;
  dpp.questions.forEach(q => {
    const sel = answers[q.id] ? String(answers[q.id]).trim().toUpperCase() : null;
    if (!sel) return;
    clean[q.id] = sel;
    if (sel === q.correctAnswer) { score += dpp.marking.correct; correctCount += 1; } else { score += dpp.marking.incorrect; wrongCount += 1; }
  });
  const maxScore = dpp.questions.length * dpp.marking.correct;
  const attempt = {
    id: `tdppa_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`,
    dppId: id,
    studentId: student.id,
    studentName: student.full_name,
    section: student.section,
    answers: clean,
    score,
    maxScore,
    percent: maxScore ? Math.round((Math.max(0, score) / maxScore) * 1000) / 10 : 0,
    correctCount,
    wrongCount,
    unattempted: dpp.questions.length - correctCount - wrongCount,
    timeTakenSeconds: Number(timeTakenSeconds) || null,
    submittedAt: new Date().toISOString()
  };
  store().teacherDppAttempts.push(attempt);
  save();
  return studentDetail(id, studentId);
}

load();

module.exports = { create, listForTeacher, teacherDetail, remove, listForStudent, studentDetail, submit, STORE_FILE: dataPaths.runtimePath(STORE_NAME) };
