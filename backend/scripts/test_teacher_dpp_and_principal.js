// ============================================================================
// TEST: Teacher-created DPPs + Principal overview + balanced bank answer keys
// Runs in-process on an ephemeral port (no running server needed). Uses a
// temporary copy of the DPP store so the real teacher_dpps.json is untouched.
//   node scripts/test_teacher_dpp_and_principal.js
// ============================================================================

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const http = require('http');
const express = require('express');

process.chdir(path.resolve(__dirname, '..'));
const { initDatabase, inMemoryStore } = require('../src/config/database');
const content = require('../src/services/canonicalContentService');
const dppService = require('../src/services/teacherDppService');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try { await fn(); passed += 1; console.log(`  PASS  ${name}`); } catch (err) { failed += 1; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const PHY = { id: 'fac_phy_01', name: 'Dr. Vikram Sharma', subjectKey: 'PHYSICS', subjectName: 'Physics' };
const ARYAN = 'b0000000-0000-0000-0000-000000000001';   // 12-NonMed
const ANANYA = 'b0000000-0000-0000-0000-000000000011';  // 12-Med

async function main() {
  try { await initDatabase(); } catch (e) { /* in-memory fallback */ }
  // Work on an empty in-memory DPP store and restore the file afterwards.
  const backup = fs.existsSync(dppService.STORE_FILE) ? fs.readFileSync(dppService.STORE_FILE) : null;
  inMemoryStore.teacherDpps = [];
  inMemoryStore.teacherDppAttempts = [];

  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/dpp', require('../src/routes/dpp'));
  app.use('/api/analytics', require('../src/routes/analytics'));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body) => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };

  console.log('\nBank answer keys');
  await check('Physics bank MCQs are not all keyed "A" (balanced option order)', () => {
    const items = content.query({ subjectKey: 'PHYSICS', objectiveOnly: true }).items;
    const keys = new Set(items.map(r => r.correct_answer));
    assert(items.length > 100, 'pool too small');
    assert(keys.size >= 3, `only keys ${Array.from(keys)}`);
    const shareA = items.filter(r => r.correct_answer === 'A').length / items.length;
    assert(shareA < 0.5, `A is correct for ${Math.round(shareA * 100)}%`);
  });

  console.log('\nTeacher DPPs');
  let bankId = null;
  let customId = null;
  await check('Teacher creates a DPP from the bank for own class', async () => {
    const r = await call('POST', '/api/dpp', { teacher: PHY, section: '12-NonMed', source: 'BANK', count: 6, title: 'Bank set' });
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.strictEqual(r.body.dpp.questions.length, 6);
    bankId = r.body.dpp.id;
  });
  await check('Teacher creates a DPP from own questions; subjective / unkeyed ones are dropped', async () => {
    const qs = [
      { question_latex: 'Unit of flux?', options_latex: [{ key: 'A', latex: 'N m^2/C' }, { key: 'B', latex: 'N/C' }], correct_answer: 'A' },
      { question_latex: 'No key', options_latex: [{ key: 'A', latex: '1' }, { key: 'B', latex: '2' }] },
      { question_latex: 'State Gauss law.', options_latex: [] }
    ];
    const r = await call('POST', '/api/dpp', { teacher: PHY, section: '12-NonMed', source: 'CUSTOM', questions: qs });
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.strictEqual(r.body.dpp.questions.length, 1);
    customId = r.body.dpp.id;
  });
  await check('Isolation: Physics teacher cannot assign to Class 10; Biology cannot assign to 12 Non-Medical', async () => {
    const a = await call('POST', '/api/dpp', { teacher: PHY, section: '10-Science-A', source: 'BANK' });
    const b = await call('POST', '/api/dpp', { teacher: { subjectKey: 'BIOLOGY' }, section: '12-NonMed', source: 'BANK' });
    assert.strictEqual(a.status, 403);
    assert.strictEqual(b.status, 403);
  });
  await check('Teacher list is scoped to the subject (Chemistry sees none of Physics DPPs)', async () => {
    const phy = await call('GET', '/api/dpp?teacherSubjectKey=PHYSICS');
    const chem = await call('GET', '/api/dpp?teacherSubjectKey=CHEMISTRY');
    assert.strictEqual(phy.body.dpps.length, 2);
    assert.strictEqual(chem.body.dpps.length, 0);
    const detail = await call('GET', `/api/dpp/${bankId}?teacherSubjectKey=CHEMISTRY`);
    assert.strictEqual(detail.status, 403);
  });
  await check('Student sees only own-class DPPs and no answers before submitting', async () => {
    const mine = await call('GET', `/api/dpp/assigned?studentId=${ARYAN}`);
    const other = await call('GET', `/api/dpp/assigned?studentId=${ANANYA}`);
    assert.strictEqual(mine.body.dpps.length, 2);
    assert.strictEqual(other.body.dpps.length, 0);
    const d = await call('GET', `/api/dpp/${bankId}?studentId=${ARYAN}`);
    assert(d.body.dpp.questions.every(q => q.correctAnswer === undefined && q.solutionLatex === undefined));
    const blocked = await call('GET', `/api/dpp/${bankId}?studentId=${ANANYA}`);
    assert.strictEqual(blocked.status, 403);
  });
  await check('Student submits once; scoring uses the DPP marking; second submit is refused', async () => {
    const r = await call('POST', `/api/dpp/${customId}/submit`, { studentId: ARYAN, answers: { [inMemoryStore.teacherDpps.find(x => x.id === customId).questions[0].id]: 'A' }, timeTakenSeconds: 60 });
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    assert.strictEqual(r.body.dpp.attempt.score, 4);
    assert.strictEqual(r.body.dpp.attempt.percent, 100);
    assert(r.body.dpp.questions[0].correctAnswer, 'answers shown after submit');
    const again = await call('POST', `/api/dpp/${customId}/submit`, { studentId: ARYAN, answers: {} });
    assert.strictEqual(again.status, 409);
  });
  await check('Teacher results: roster of 8, 1 submitted, per-question accuracy', async () => {
    const r = await call('GET', `/api/dpp/${customId}?teacherSubjectKey=PHYSICS`);
    assert.strictEqual(r.body.dpp.results.enrolled, 8);
    assert.strictEqual(r.body.dpp.results.submitted, 1);
    assert.strictEqual(r.body.dpp.results.perQuestion[0].accuracy, 100);
  });

  console.log('\nPrincipal overview');
  await check('Overview totals come from live data (students, teachers, tests, DPPs)', async () => {
    const r = await call('GET', '/api/analytics/principal-overview');
    const t = r.body.totals;
    assert.strictEqual(t.students, inMemoryStore.users.filter(u => u.role === 'STUDENT').length);
    assert.strictEqual(t.teachers, inMemoryStore.users.filter(u => u.role === 'TEACHER').length);
    assert.strictEqual(t.dppsCreated, 2);
    assert.strictEqual(t.dppAttempts, 1);
    assert(r.body.classes.length >= 5 && r.body.teachers.length === t.teachers);
    const vikram = r.body.teachers.find(x => x.id === 'fac_phy_01');
    assert.strictEqual(vikram.dppsCreated, 2);
    assert(r.body.tests.every(x => x.enrolled >= x.submitted));
  });
  await check('Every published test is attributed to a real teacher', async () => {
    const r = await call('GET', '/api/analytics/principal-overview');
    const names = new Set(inMemoryStore.users.filter(u => u.role === 'TEACHER').map(u => u.full_name));
    r.body.tests.forEach(x => assert(names.has(x.teacherName), `${x.title}: ${x.teacherName}`));
  });

  server.close();
  // Restore the real store file.
  if (backup) fs.writeFileSync(dppService.STORE_FILE, backup); else if (fs.existsSync(dppService.STORE_FILE)) fs.unlinkSync(dppService.STORE_FILE);
  console.log(`\nTeacher DPP + principal tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
