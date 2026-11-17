// ============================================================================
// CLASS DESK: doubts, notices & homework, mistake notebook
//
// Doubts   - a student asks their subject teacher about a question or topic;
//            the teacher replies from an inbox; the student marks it resolved.
// Notices  - a teacher posts a notice or homework to one of their classes;
//            the principal posts to one class or the whole school; students
//            tick homework as done.
// Mistakes - every question a student got wrong or skipped in tests, teacher
//            DPPs and Study Board practice, for revision and re-attempt.
//
// Isolation (same rules as the rest of the API, services/subjectScope.js):
//   teacher  -> only their subject and the classes that study it
//   student  -> only their own records and their own class
//   principal-> school-wide, read + notices
// Data lives in the store collections doubts / notices / mistakeStates /
// practiceMistakes, which services/persistence.js saves to PostgreSQL.
// ============================================================================

const crypto = require('crypto');
const { inMemoryStore } = require('../config/database');
const subjectScope = require('./subjectScope');

const MAX_IMAGE_CHARS = 2200000; // about 1.6 MB of image data as a data URL

function coll(name) {
  if (!Array.isArray(inMemoryStore[name])) inMemoryStore[name] = [];
  return inMemoryStore[name];
}
function fail(status, error) { const e = new Error(error); e.status = status; return e; }
function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`; }
function now() { return new Date().toISOString(); }
function eq(a, b) { return String(a || '').toLowerCase() === String(b || '').toLowerCase(); }
function clean(text, max) { return String(text || '').replace(/\u0000/g, '').trim().slice(0, max); }

function student(studentId) {
  const s = (inMemoryStore.users || []).find(u => u.role === 'STUDENT' && u.id === studentId);
  if (!s) throw fail(404, 'Student not found.');
  return s;
}
function classOf(section) {
  return (inMemoryStore.classes || []).find(c => [c.id, c.key, c.section].some(v => eq(v, section))) || null;
}
function classSubjects(section) {
  const cls = classOf(section);
  return cls ? (cls.subjects || []).map(s => (typeof s === 'string' ? { key: s.toUpperCase(), name: s } : { key: String(s.key || s.name).toUpperCase(), name: s.name || s.key })) : [];
}
function studentsOf(section) {
  return (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && eq(u.section, section));
}
function teacherKey(value) {
  const key = String(value || '').toUpperCase().trim();
  if (!key) throw fail(400, 'teacherSubjectKey is required.');
  return key;
}
function inTeacherScope(key, record) {
  return subjectScope.assessmentInScope(key, { subjectKey: record.subjectKey, subject: record.subject, section: record.section, grade: record.grade });
}
function validImage(data) {
  if (!data) return null;
  const s = String(data);
  if (!/^data:image\/(png|jpe?g|webp);base64,/.test(s)) throw fail(400, 'The attachment must be a PNG, JPG or WEBP image.');
  if (s.length > MAX_IMAGE_CHARS) throw fail(413, 'The image is too large. Please use a photo under 1.5 MB.');
  return s;
}

// ==================================================================== DOUBTS
function publicDoubt(d, { withImage = true } = {}) {
  const out = Object.assign({}, d);
  if (!withImage) { out.hasImage = Boolean(d.imageData); delete out.imageData; }
  return out;
}

function createDoubt(body = {}) {
  const s = student(body.studentId);
  const subjects = classSubjects(s.section);
  const subjectKey = String(body.subjectKey || '').toUpperCase();
  const subject = subjects.find(x => x.key === subjectKey);
  if (!subject) throw fail(400, 'Choose one of your class subjects.');
  const text = clean(body.text, 2000);
  const imageData = validImage(body.imageData);
  if (text.length < 5 && !imageData) throw fail(400, 'Write your doubt (at least a few words) or attach a photo.');
  const ctx = body.context && typeof body.context === 'object' ? body.context : {};
  const doubt = {
    id: uid('dbt'),
    studentId: s.id,
    studentName: s.full_name,
    rollNumber: s.roll_number || '',
    section: s.section,
    grade: String(s.grade || ''),
    subjectKey,
    subject: subject.name,
    text,
    imageData,
    context: {
      type: clean(ctx.type, 30) || 'GENERAL',
      title: clean(ctx.title, 200),
      questionLatex: clean(ctx.questionLatex, 3000),
      chapterName: clean(ctx.chapterName, 200)
    },
    status: 'OPEN',
    replies: [],
    createdAt: now(),
    updatedAt: now()
  };
  coll('doubts').unshift(doubt);
  return doubt;
}

function listDoubts({ studentId, teacherSubjectKey, status } = {}) {
  let list;
  if (studentId) {
    student(studentId);
    list = coll('doubts').filter(d => d.studentId === studentId);
  } else {
    const key = teacherKey(teacherSubjectKey);
    list = coll('doubts').filter(d => inTeacherScope(key, d));
  }
  if (status && status !== 'ALL') list = list.filter(d => d.status === String(status).toUpperCase());
  const counts = { OPEN: 0, ANSWERED: 0, RESOLVED: 0 };
  (studentId ? coll('doubts').filter(d => d.studentId === studentId) : coll('doubts').filter(d => inTeacherScope(teacherKey(teacherSubjectKey), d)))
    .forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
  return { doubts: list.map(d => publicDoubt(d)), counts };
}

function findDoubt(id) {
  const d = coll('doubts').find(x => x.id === id);
  if (!d) throw fail(404, 'Doubt not found.');
  return d;
}

function replyDoubt(id, body = {}) {
  const d = findDoubt(id);
  const text = clean(body.text, 3000);
  if (text.length < 2) throw fail(400, 'Write a reply first.');
  if (body.studentId) {
    if (d.studentId !== body.studentId) throw fail(403, 'This is not your doubt.');
    d.replies.push({ by: 'STUDENT', name: d.studentName, text, at: now() });
    d.status = 'OPEN';
  } else {
    const key = teacherKey(body.teacherSubjectKey);
    if (!inTeacherScope(key, d)) throw fail(403, 'This doubt belongs to another subject or class.');
    d.replies.push({ by: 'TEACHER', name: clean(body.teacherName, 80) || 'Teacher', text, at: now() });
    d.status = 'ANSWERED';
  }
  d.updatedAt = now();
  return d;
}

function resolveDoubt(id, body = {}) {
  const d = findDoubt(id);
  if (d.studentId !== body.studentId) throw fail(403, 'Only the student who asked can close this doubt.');
  d.status = body.reopen ? 'OPEN' : 'RESOLVED';
  d.updatedAt = now();
  return d;
}

// =================================================================== NOTICES
function createNotice(body = {}) {
  const author = body.author || {};
  const role = String(author.role || '').toUpperCase();
  const type = String(body.type || 'NOTICE').toUpperCase() === 'HOMEWORK' ? 'HOMEWORK' : 'NOTICE';
  const title = clean(body.title, 140);
  const text = clean(body.body, 3000);
  if (title.length < 3) throw fail(400, 'Give the notice a short title.');
  const section = String(body.section || '').trim();
  let subjectKey = '';
  let subject = '';
  if (role === 'TEACHER') {
    subjectKey = teacherKey(author.subjectKey);
    if (!section || section.toUpperCase() === 'ALL') throw fail(400, 'Choose one of your classes.');
    const err = subjectScope.checkTeacherWrite(subjectKey, { subjectKey, section, grade: (classOf(section) || {}).grade });
    if (err) throw fail(err.status, err.error);
    if (!subjectScope.classTeachesSubject(section, subjectKey)) throw fail(400, `Class ${section} does not study ${subjectKey}.`);
    subject = clean(author.subjectName, 60) || subjectKey;
  } else if (role === 'PRINCIPAL') {
    if (type === 'HOMEWORK') throw fail(400, 'Homework is set by subject teachers.');
    if (section && section.toUpperCase() !== 'ALL' && !classOf(section)) throw fail(400, 'Unknown class.');
  } else {
    throw fail(403, 'Only teachers and the principal can post notices.');
  }
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate || '')) ? body.dueDate : null;
  if (type === 'HOMEWORK' && !dueDate) throw fail(400, 'Homework needs a due date.');
  const notice = {
    id: uid('ntc'),
    type,
    title,
    body: text,
    section: !section || section.toUpperCase() === 'ALL' ? 'ALL' : (classOf(section) || {}).section || section,
    subjectKey,
    subject,
    dueDate,
    author: { role, name: clean(author.name, 80) || (role === 'PRINCIPAL' ? 'Principal' : 'Teacher'), id: clean(author.id, 80) },
    doneBy: [],
    createdAt: now()
  };
  coll('notices').unshift(notice);
  return notice;
}

function noticeView(n, { studentId, withProgress } = {}) {
  const out = { id: n.id, type: n.type, title: n.title, body: n.body, section: n.section, subjectKey: n.subjectKey, subject: n.subject, dueDate: n.dueDate, author: n.author, createdAt: n.createdAt };
  if (studentId) out.done = (n.doneBy || []).includes(studentId);
  if (withProgress && n.type === 'HOMEWORK') {
    const roster = studentsOf(n.section).map(s => s.id);
    out.doneCount = (n.doneBy || []).filter(id => roster.includes(id)).length;
    out.classSize = roster.length;
  }
  return out;
}

function listNotices({ studentId, teacherSubjectKey, role } = {}) {
  const all = coll('notices');
  if (studentId) {
    const s = student(studentId);
    return { notices: all.filter(n => n.section === 'ALL' || eq(n.section, s.section)).map(n => noticeView(n, { studentId })) };
  }
  if (String(role || '').toLowerCase() === 'principal') {
    return { notices: all.map(n => noticeView(n, { withProgress: true })) };
  }
  const key = teacherKey(teacherSubjectKey);
  return {
    notices: all
      .filter(n => n.author.role === 'PRINCIPAL'
        ? (n.section === 'ALL' || subjectScope.sectionAllowed(key, n.section))
        : (n.subjectKey === key))
      .map(n => Object.assign(noticeView(n, { withProgress: true }), { mine: n.author.role === 'TEACHER' && n.subjectKey === key }))
  };
}

function removeNotice(id, { teacherSubjectKey, role } = {}) {
  const list = coll('notices');
  const n = list.find(x => x.id === id);
  if (!n) throw fail(404, 'Notice not found.');
  const isPrincipal = String(role || '').toLowerCase() === 'principal';
  if (!isPrincipal) {
    const key = teacherKey(teacherSubjectKey);
    if (n.author.role !== 'TEACHER' || n.subjectKey !== key) throw fail(403, 'You can delete only notices posted for your subject.');
  }
  list.splice(list.indexOf(n), 1);
  return { removed: id };
}

function markNoticeDone(id, { studentId, done } = {}) {
  const s = student(studentId);
  const n = coll('notices').find(x => x.id === id);
  if (!n) throw fail(404, 'Notice not found.');
  if (!(n.section === 'ALL' || eq(n.section, s.section))) throw fail(403, 'This is not for your class.');
  if (!Array.isArray(n.doneBy)) n.doneBy = [];
  const at = n.doneBy.indexOf(s.id);
  if (done === false) { if (at !== -1) n.doneBy.splice(at, 1); } else if (at === -1) n.doneBy.push(s.id);
  return noticeView(n, { studentId });
}

// ========================================================= MISTAKE NOTEBOOK
function optionList(q) {
  const raw = q.options_latex || q.options || q.mcq_options || [];
  return (Array.isArray(raw) ? raw : []).map(o => ({ key: String(o.key || '').toUpperCase(), latex: String(o.latex || o.text || '') })).filter(o => o.key);
}

function collectMistakes(studentId) {
  const items = [];
  // 1. Tests
  (inMemoryStore.submissions || []).filter(s => s.studentId === studentId).forEach(sub => {
    const test = (inMemoryStore.assessments || []).find(a => a.id === sub.assessmentId);
    (sub.questionBreakdown || []).forEach(qb => {
      if (qb.isCorrect) return;
      const q = test ? (test.questions || []).find(x => x.id === qb.questionId) : null;
      if (!q) return;
      items.push({
        key: `TEST:${sub.assessmentId}:${qb.questionId}`,
        source: 'TEST',
        sourceTitle: sub.assessmentTitle || (test && test.title) || 'Test',
        subject: (test && test.subject) || '',
        topic: qb.topic || q.topic || '',
        subtopic: qb.subtopic || q.subtopic || '',
        date: sub.submittedAt || null,
        questionLatex: q.question_latex || q.questionLatex || '',
        options: optionList(q),
        yourAnswer: qb.selectedOption || null,
        correctAnswer: String(q.correct_answer || qb.correctAnswer || '').toUpperCase(),
        solutionLatex: q.solution_latex || '',
        reason: qb.mistakeClassification && qb.mistakeClassification.type !== 'NONE' ? (qb.mistakeClassification.label || '') : ''
      });
    });
  });
  // 2. Teacher DPPs
  (inMemoryStore.teacherDppAttempts || []).filter(a => a.studentId === studentId).forEach(att => {
    const dpp = (inMemoryStore.teacherDpps || []).find(d => d.id === att.dppId);
    if (!dpp) return;
    dpp.questions.forEach(q => {
      const sel = (att.answers || {})[q.id] || null;
      if (sel === q.correctAnswer) return;
      items.push({
        key: `DPP:${dpp.id}:${q.id}`,
        source: 'DPP',
        sourceTitle: dpp.title,
        subject: dpp.subject || '',
        topic: q.chapterName || dpp.chapterName || '',
        subtopic: q.topic || '',
        date: att.submittedAt || null,
        questionLatex: q.questionLatex,
        options: q.options.map(o => ({ key: o.key, latex: o.latex })),
        yourAnswer: sel,
        correctAnswer: q.correctAnswer,
        solutionLatex: q.solutionLatex || '',
        reason: ''
      });
    });
  });
  // 3. Study Board practice (wrong first tries, recorded with the question)
  coll('practiceMistakes').filter(p => p.studentId === studentId).forEach(p => {
    items.push({
      key: `BOARD:${p.questionId}`,
      source: 'PRACTICE',
      sourceTitle: 'Study Board practice',
      subject: p.subject || '',
      topic: p.chapterName || '',
      subtopic: p.topic || '',
      date: p.at,
      questionLatex: p.questionLatex,
      options: p.options || [],
      yourAnswer: p.yourAnswer || null,
      correctAnswer: p.correctAnswer,
      solutionLatex: p.solutionLatex || '',
      reason: ''
    });
  });
  // Same question wrong in several places: keep the most recent.
  const seen = new Map();
  items.sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).forEach(it => { if (!seen.has(it.key)) seen.set(it.key, it); });
  return Array.from(seen.values());
}

function stateOf(studentId, key) {
  return coll('mistakeStates').find(s => s.id === `${studentId}|${key}`) || null;
}
function setState(studentId, key, patch) {
  let st = stateOf(studentId, key);
  if (!st) { st = { id: `${studentId}|${key}`, studentId, key, status: 'OPEN', retries: 0, revealed: false }; coll('mistakeStates').push(st); }
  Object.assign(st, patch, { updatedAt: now() });
  return st;
}

function mistakeView(studentId, it) {
  const st = stateOf(studentId, it.key);
  const status = st ? st.status : 'OPEN';
  const isMcq = it.options.length >= 2 && it.options.some(o => o.key === it.correctAnswer);
  const reveal = !isMcq || status === 'MASTERED' || (st && st.revealed);
  const out = {
    key: it.key, source: it.source, sourceTitle: it.sourceTitle, subject: it.subject, topic: it.topic, subtopic: it.subtopic,
    date: it.date, questionLatex: it.questionLatex, options: it.options, yourAnswer: it.yourAnswer, reason: it.reason,
    isMcq, status, retries: st ? st.retries : 0, skipped: !it.yourAnswer
  };
  if (reveal) { out.correctAnswer = it.correctAnswer; out.solutionLatex = it.solutionLatex; }
  return out;
}

function listMistakes(studentId) {
  student(studentId);
  const items = collectMistakes(studentId).map(it => mistakeView(studentId, it));
  const open = items.filter(i => i.status !== 'MASTERED');
  const byTopic = new Map();
  open.forEach(i => { const k = `${i.subject}||${i.topic || 'Other'}`; byTopic.set(k, (byTopic.get(k) || 0) + 1); });
  return {
    summary: {
      total: items.length,
      open: open.length,
      mastered: items.length - open.length,
      topics: Array.from(byTopic.entries()).map(([k, n]) => ({ subject: k.split('||')[0], topic: k.split('||')[1], count: n })).sort((a, b) => b.count - a.count).slice(0, 6)
    },
    items
  };
}

function retryMistake({ studentId, key, answer, reveal } = {}) {
  student(studentId);
  const it = collectMistakes(studentId).find(x => x.key === key);
  if (!it) throw fail(404, 'That question is not in your notebook.');
  const st = stateOf(studentId, key) || setState(studentId, key, {});
  if (reveal) {
    setState(studentId, key, { revealed: true });
  } else {
    const sel = String(answer || '').toUpperCase().trim();
    if (!sel) throw fail(400, 'Choose an option.');
    const correct = sel === it.correctAnswer;
    setState(studentId, key, { retries: (st.retries || 0) + 1, revealed: true, status: correct ? 'MASTERED' : 'OPEN', lastAnswer: sel });
    return Object.assign(mistakeView(studentId, it), { correct, yourRetry: sel });
  }
  return mistakeView(studentId, it);
}

function setMistakeStatus({ studentId, key, status } = {}) {
  student(studentId);
  const it = collectMistakes(studentId).find(x => x.key === key);
  if (!it) throw fail(404, 'That question is not in your notebook.');
  setState(studentId, key, { status: String(status).toUpperCase() === 'MASTERED' ? 'MASTERED' : 'OPEN', revealed: true });
  return mistakeView(studentId, it);
}

// Called by the Study Board when a practice question is answered wrongly on the first try.
function recordPracticeMistake(entry) {
  const list = coll('practiceMistakes');
  const at = list.findIndex(p => p.studentId === entry.studentId && p.questionId === entry.questionId);
  const rec = Object.assign({ id: `${entry.studentId}|${entry.questionId}`, at: now() }, entry);
  if (at === -1) list.unshift(rec); else list[at] = rec;
  const st = stateOf(entry.studentId, `BOARD:${entry.questionId}`);
  if (st) Object.assign(st, { status: 'OPEN', revealed: false, updatedAt: now() });
  if (list.length > 5000) list.length = 5000;
}

module.exports = {
  createDoubt, listDoubts, replyDoubt, resolveDoubt,
  createNotice, listNotices, removeNotice, markNoticeDone,
  listMistakes, retryMistake, setMistakeStatus, recordPracticeMistake,
  classSubjects, student
};
