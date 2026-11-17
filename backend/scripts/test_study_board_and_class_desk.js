// ============================================================================
// TEST: Study Board, doubts, notices & homework, mistake notebook
// Runs in-process on an ephemeral port with the in-memory store (no database,
// no AI key needed).   node scripts/test_study_board_and_class_desk.js
// ============================================================================
const path = require('path');
const assert = require('assert');
const http = require('http');
const express = require('express');

process.chdir(path.resolve(__dirname, '..'));
process.env.DATABASE_URL = '';      // never touch a real database from this test
process.env.GEMINI_API_KEY = '';    // bank-only path
const { inMemoryStore } = require('../src/config/database');

let passed = 0; let failed = 0;
async function check(name, fn) {
  try { await fn(); passed += 1; console.log(`  PASS  ${name}`); } catch (err) { failed += 1; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}
const ARYAN = 'b0000000-0000-0000-0000-000000000001';   // 12-NonMed
const ANANYA = 'b0000000-0000-0000-0000-000000000011';  // 12-Med

async function main() {
  ['doubts', 'notices', 'mistakeStates', 'practiceMistakes', 'studyProgress', 'lessonNotes'].forEach(k => { inMemoryStore[k] = []; });
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/study-board', require('../src/routes/studyBoard'));
  app.use('/api/doubts', require('../src/routes/doubts'));
  app.use('/api/notices', require('../src/routes/notices'));
  app.use('/api/mistakes', require('../src/routes/mistakes'));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body) => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };

  console.log('\nStudy Board');
  let chapter; let topic; let practiceQ;
  await check('Catalog: student gets only their class subjects and grade; teacher only their subject', async () => {
    const s = await call('GET', `/api/study-board/catalog?studentId=${ARYAN}`);
    assert.deepStrictEqual(s.body.subjects.map(x => x.key).sort(), ['CHEMISTRY', 'MATHEMATICS', 'PHYSICS']);
    assert(s.body.subjects.every(x => x.chapters.every(c => !c.grade || c.grade === '12')), 'other grade leaked');
    const t = await call('GET', '/api/study-board/catalog?teacherSubjectKey=BIOLOGY');
    assert.deepStrictEqual(t.body.subjects.map(x => x.key), ['BIOLOGY']);
    const phy = s.body.subjects.find(x => x.key === 'PHYSICS');
    chapter = phy.chapters[0]; topic = chapter.topics[chapter.topics.length - 1];
  });
  await check('Lesson: frames for intro, ideas/derivations, worked example, check-yourself without answers', async () => {
    const r = await call('GET', `/api/study-board/lesson?studentId=${ARYAN}&subjectKey=PHYSICS&chapterId=${chapter.id}&topicId=${topic.id}`);
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    const kinds = r.body.lesson.frames.map(f => f.kind);
    assert(kinds[0] === 'intro' && kinds.includes('example') && kinds.includes('check'), kinds.join(','));
    const checkFrame = r.body.lesson.frames.find(f => f.kind === 'check');
    assert(checkFrame.questions.length >= 1 && !JSON.stringify(checkFrame).includes('correct_answer') && !JSON.stringify(checkFrame).includes('correctAnswer'));
  });
  await check('Lesson isolation: a Non-Medical student cannot open Biology; a Class 12 student cannot open a Class 11 chapter', async () => {
    const a = await call('GET', `/api/study-board/lesson?studentId=${ARYAN}&subjectKey=BIOLOGY&chapterId=x&topicId=y`);
    assert.strictEqual(a.status, 403);
    const t = await call('GET', '/api/study-board/catalog?teacherSubjectKey=PHYSICS');
    const ch11 = t.body.subjects[0].chapters.find(c => c.grade === '11');
    const b = await call('GET', `/api/study-board/lesson?studentId=${ARYAN}&subjectKey=PHYSICS&chapterId=${ch11.id}&topicId=${ch11.topics[0].id}`);
    assert.strictEqual(b.status, 403);
  });
  await check('Practice: question has no answer; hints come one level at a time; the last solution line is held back', async () => {
    const r = await call('GET', `/api/study-board/practice?studentId=${ARYAN}&subjectKey=PHYSICS&chapterId=${chapter.id}`);
    practiceQ = r.body.question;
    assert(practiceQ && practiceQ.kind === 'MCQ' && practiceQ.options.length >= 2);
    assert(!('correctAnswer' in practiceQ) && !('solutionLatex' in practiceQ));
    const h1 = await call('POST', '/api/study-board/practice/hint', { studentId: ARYAN, questionId: practiceQ.id, level: 1 });
    assert.strictEqual(h1.body.hints.length, 1);
    const hAll = await call('POST', '/api/study-board/practice/hint', { studentId: ARYAN, questionId: practiceQ.id, level: 99 });
    assert.strictEqual(hAll.body.hints.length, hAll.body.total);
  });
  await check('Practice check: wrong first try hides the answer and lands in the mistake notebook; reveal shows the solution', async () => {
    const opts = practiceQ.options.map(o => o.key);
    const full = await call('POST', '/api/study-board/practice/check', { teacherSubjectKey: 'PHYSICS', questionId: practiceQ.id, reveal: true });
    const right = full.body.correctAnswer;
    const wrong = opts.find(k => k !== right);
    const w = await call('POST', '/api/study-board/practice/check', { studentId: ARYAN, questionId: practiceQ.id, answer: wrong, attempt: 1 });
    assert.strictEqual(w.body.correct, false);
    assert(!('correctAnswer' in w.body), 'answer leaked on a wrong try');
    const ok = await call('POST', '/api/study-board/practice/check', { studentId: ARYAN, questionId: practiceQ.id, answer: right, attempt: 2 });
    assert.strictEqual(ok.body.correct, true);
    const nb = await call('GET', `/api/mistakes?studentId=${ARYAN}`);
    assert(nb.body.items.some(i => i.key === `BOARD:${practiceQ.id}` && i.status === 'OPEN'));
  });
  await check('Doubt: a typed question finds a similar solved question; nonsense finds none; a Biology teacher cannot use a Physics question', async () => {
    const a = await call('POST', '/api/study-board/doubt', { studentId: ARYAN, subjectKey: 'PHYSICS', text: 'force between two charges in air is 40 N and in a liquid medium it is 8 N, find the dielectric constant of the liquid' });
    assert.strictEqual(a.body.result.mode, 'similar');
    assert(a.body.result.match.lines.length >= 1);
    const b = await call('POST', '/api/study-board/doubt', { studentId: ARYAN, subjectKey: 'PHYSICS', text: 'zxqv plomb wertyu asdfgh qazwsx' });
    assert.strictEqual(b.body.result.mode, 'none');
    const c = await call('POST', '/api/study-board/practice/hint', { teacherSubjectKey: 'BIOLOGY', questionId: practiceQ.id, level: 1 });
    assert.strictEqual(c.status, 403);
  });
  await check('Progress: marking a topic understood shows up in the catalog', async () => {
    await call('POST', '/api/study-board/progress', { studentId: ARYAN, subjectKey: 'PHYSICS', chapterId: chapter.id, topicId: topic.id, understood: true });
    const s = await call('GET', `/api/study-board/catalog?studentId=${ARYAN}`);
    assert(s.body.understood.includes(topic.id));
  });

  console.log('\nAsk-teacher doubts');
  let doubtId;
  await check('Student asks own-class subject only', async () => {
    const bad = await call('POST', '/api/doubts', { studentId: ARYAN, subjectKey: 'BIOLOGY', text: 'What is a codon?' });
    assert.strictEqual(bad.status, 400);
    const ok = await call('POST', '/api/doubts', { studentId: ARYAN, subjectKey: 'PHYSICS', text: 'Why is flux through one face q/6e0?', context: { type: 'TOPIC', title: "Gauss's Law" } });
    assert.strictEqual(ok.status, 200, JSON.stringify(ok.body));
    doubtId = ok.body.doubt.id;
  });
  await check('Teacher inbox is scoped: Physics sees it, Chemistry and Biology do not, and cannot reply', async () => {
    const phy = await call('GET', '/api/doubts?teacherSubjectKey=PHYSICS');
    const chem = await call('GET', '/api/doubts?teacherSubjectKey=CHEMISTRY');
    assert.strictEqual(phy.body.doubts.length, 1);
    assert.strictEqual(chem.body.doubts.length, 0);
    const r = await call('POST', `/api/doubts/${doubtId}/reply`, { teacherSubjectKey: 'BIOLOGY', teacherName: 'X', text: 'hello' });
    assert.strictEqual(r.status, 403);
  });
  await check('Reply marks it answered; only the asking student can resolve', async () => {
    const r = await call('POST', `/api/doubts/${doubtId}/reply`, { teacherSubjectKey: 'PHYSICS', teacherName: 'Dr. Vikram Sharma', text: 'By symmetry each of the 6 faces gets equal flux.' });
    assert.strictEqual(r.body.doubt.status, 'ANSWERED');
    const other = await call('POST', `/api/doubts/${doubtId}/resolve`, { studentId: ANANYA });
    assert.strictEqual(other.status, 403);
    const mine = await call('POST', `/api/doubts/${doubtId}/resolve`, { studentId: ARYAN });
    assert.strictEqual(mine.body.doubt.status, 'RESOLVED');
    const list = await call('GET', `/api/doubts?studentId=${ANANYA}`);
    assert.strictEqual(list.body.doubts.length, 0);
  });

  console.log('\nNotices & homework');
  let hwId;
  await check('Teacher posts homework to own class only; due date required', async () => {
    const author = { role: 'TEACHER', name: 'Dr. Vikram Sharma', id: 'fac_phy_01', subjectKey: 'PHYSICS', subjectName: 'Physics' };
    const bad = await call('POST', '/api/notices', { author, type: 'HOMEWORK', title: 'NCERT Ex 1.1 to 1.10', section: '10-Science-A', dueDate: '2026-11-20' });
    assert.strictEqual(bad.status, 403);
    const noDue = await call('POST', '/api/notices', { author, type: 'HOMEWORK', title: 'NCERT Ex 1.1 to 1.10', section: '12-NonMed' });
    assert.strictEqual(noDue.status, 400);
    const ok = await call('POST', '/api/notices', { author, type: 'HOMEWORK', title: 'NCERT Ex 1.1 to 1.10', body: 'In the class notebook.', section: '12-NonMed', dueDate: '2026-11-20' });
    assert.strictEqual(ok.status, 200, JSON.stringify(ok.body));
    hwId = ok.body.notice.id;
  });
  await check('Principal posts school-wide; students see own-class + school notices only', async () => {
    const p = await call('POST', '/api/notices', { author: { role: 'PRINCIPAL', name: 'Dr. Anita Chandel' }, title: 'Parent-teacher meeting on Saturday', section: 'ALL' });
    assert.strictEqual(p.status, 200);
    const stranger = await call('POST', '/api/notices', { author: { role: 'STUDENT' }, title: 'Holiday tomorrow', section: 'ALL' });
    assert.strictEqual(stranger.status, 403);
    const a = await call('GET', `/api/notices?studentId=${ARYAN}`);
    const b = await call('GET', `/api/notices?studentId=${ANANYA}`);
    assert.strictEqual(a.body.notices.length, 2);
    assert.strictEqual(b.body.notices.length, 1);
  });
  await check('Homework done: student ticks it, teacher sees 1 of 8; another subject cannot delete it', async () => {
    const d = await call('POST', `/api/notices/${hwId}/done`, { studentId: ARYAN, done: true });
    assert.strictEqual(d.body.notice.done, true);
    const other = await call('POST', `/api/notices/${hwId}/done`, { studentId: ANANYA, done: true });
    assert.strictEqual(other.status, 403);
    const t = await call('GET', '/api/notices?teacherSubjectKey=PHYSICS');
    const hw = t.body.notices.find(n => n.id === hwId);
    assert.strictEqual(hw.doneCount, 1);
    assert.strictEqual(hw.classSize, 8);
    const del = await call('DELETE', `/api/notices/${hwId}?teacherSubjectKey=CHEMISTRY`);
    assert.strictEqual(del.status, 403);
  });

  console.log('\nMistake notebook');
  await check('Collects wrong test answers with the question; answer hidden until retried; correct retry marks it mastered', async () => {
    const sub = inMemoryStore.submissions.find(s => (s.questionBreakdown || []).some(q => !q.isCorrect));
    const nb = await call('GET', `/api/mistakes?studentId=${sub.studentId}`);
    const item = nb.body.items.find(i => i.source === 'TEST' && i.isMcq);
    assert(item, 'no test mistake found');
    assert(!('correctAnswer' in item), 'answer shown before retry');
    const test = inMemoryStore.assessments.find(a => a.id === item.key.split(':')[1]);
    const q = test.questions.find(x => x.id === item.key.split(':')[2]);
    const wrongKey = item.options.map(o => o.key).find(k => k !== String(q.correct_answer).toUpperCase());
    const w = await call('POST', '/api/mistakes/retry', { studentId: sub.studentId, key: item.key, answer: wrongKey });
    assert.strictEqual(w.body.item.correct, false);
    assert.strictEqual(w.body.item.status, 'OPEN');
    const r = await call('POST', '/api/mistakes/retry', { studentId: sub.studentId, key: item.key, answer: String(q.correct_answer).toUpperCase() });
    assert.strictEqual(r.body.item.correct, true);
    assert.strictEqual(r.body.item.status, 'MASTERED');
    const other = await call('POST', '/api/mistakes/retry', { studentId: ARYAN, key: item.key, answer: 'A' });
    assert.strictEqual(other.status, sub.studentId === ARYAN ? 200 : 404);
  });

  server.close();
  console.log(`\nStudy Board + Class Desk tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch(err => { console.error(err); process.exit(1); });
