// ============================================================================
// TEST: Multi-Tenant Dual-Mode Architecture (Board vs Competitive)
// Runs fully in-process (no running server, no Postgres, no Kafka needed):
// boots the tenant, content, modules, questions and assessments routers on an
// ephemeral port and checks registry loading, tab filtering, feature gating,
// canonical content classification, all five modules, DPP scoring/streaks and
// registry-driven negative marking.
//   node scripts/test_dual_mode_registry.js
// ============================================================================

const path = require('path');
const assert = require('assert');
const http = require('http');
const express = require('express');

process.chdir(path.resolve(__dirname, '..'));
const { initDatabase } = require('../src/config/database');
const tenants = require('../src/services/tenantConfigService');
const examPatterns = require('../src/services/examPatternRegistry');
const content = require('../src/services/canonicalContentService');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
}

async function main() {
  try { await initDatabase(); } catch (e) { /* in-memory fallback */ }

  const app = express();
  app.use(express.json());
  app.use('/api', require('../src/routes/tenant'));
  app.use('/api/content', require('../src/routes/content'));
  app.use('/api/modules', require('../src/routes/modules'));
  app.use('/api/questions', require('../src/routes/questions'));
  app.use('/api/assessments', require('../src/routes/assessments'));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async (url, headers = {}) => {
    const res = await fetch(base + url, { headers });
    return { status: res.status, body: await res.json() };
  };
  const post = async (url, body, headers = {}) => {
    const res = await fetch(base + url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };

  console.log('\n[1] Tenant registry & validation');
  await check('loads HAPS and the sample board-only tenant', () => {
    const ids = tenants.listTenants().map(t => t.schoolId);
    assert(ids.includes('sch_unisole_001'), 'HAPS tenant missing');
    assert(ids.includes('sch_demo_board_only'), 'demo tenant missing');
  });
  await check('rejects a profile whose defaultMode is not active', () => {
    assert.throws(() => tenants.validateTenant({ schoolId: 'x', name: 'X', activeModes: ['BOARD'], defaultMode: 'COMPETITIVE', boardConfig: { enabledBoards: ['CBSE'], defaultBoard: 'CBSE' } }, 'x.json'));
  });

  console.log('\n[2] GET /api/tenant/config (HAPS default)');
  const cfg = await get('/api/tenant/config');
  await check('resolves HAPS with BOARD + COMPETITIVE', () => {
    assert.strictEqual(cfg.status, 200);
    assert.strictEqual(cfg.body.tenant.schoolId, 'sch_unisole_001');
    assert.deepStrictEqual(cfg.body.tenant.activeModes, ['BOARD', 'COMPETITIVE']);
  });
  await check('Teacher tabs follow the mode design (2026-11-16 diagram)', () => {
    const boardTabs = cfg.body.tenant.modes.BOARD.tabs.teacher.map(t => t.id);
    const compTabs = cfg.body.tenant.modes.COMPETITIVE.tabs.teacher.map(t => t.id);
    // Board: Create Test, Class Progress, Question Bank (chapter-wise PYQ), Scan Sheets, NCERT (exercise, examples, exemplar)
    assert.deepStrictEqual(boardTabs, ['createTest', 'classProgress', 'questionBank', 'classDesk', 'studyBoard', 'scanSheets', 'ncertCore'], `board tabs: ${boardTabs}`);
    // Competitive: Create Test, Class Progress, Question Bank (chapter-wise PYQ), NCERT, Roadmap, chapter-wise DPP, Cheat Sheet. No Scan Sheets.
    assert.deepStrictEqual(compTabs, ['createTest', 'classProgress', 'questionBank', 'classDesk', 'studyBoard', 'ncertCore', 'roadmap', 'practiceDpp', 'cheatSheets'], `competitive tabs: ${compTabs}`);
    // The "at most 7 nav items" rule is kept by the frontend shell: js/appShell.js shows 7 tabs and puts the rest under "More".
    assert(boardTabs.length <= 7, 'board mode should fit the top bar without a More menu');
  });
  await check('ICSE is listed but flagged as having no content; CBSE/HP have content', () => {
    const tracks = cfg.body.tenant.modes.BOARD.tracks;
    const icse = tracks.find(t => t.id === 'ICSE');
    assert(icse && icse.hasContent === false && icse.contentStatusNote.length > 0, 'ICSE should be no-content');
    assert(tracks.find(t => t.id === 'CBSE').hasContent, 'CBSE should have content');
    assert(tracks.find(t => t.id === 'HP_BOARD').hasContent, 'HP Board should have content');
  });

  console.log('\n[3] Zero-code second tenant via x-school-id');
  const demo = await get('/api/tenant/config', { 'x-school-id': 'sch_demo_board_only' });
  await check('board-only school has no COMPETITIVE mode and its own feature flags', () => {
    assert.deepStrictEqual(demo.body.tenant.activeModes, ['BOARD']);
    const tabs = demo.body.tenant.modes.BOARD.tabs.teacher.map(t => t.id);
    assert(!tabs.includes('scanSheets'), 'scanSheets should be off for demo school');
    assert(tabs.includes('practiceDpp'), 'board homework DPP should be on for demo school');
    assert(!tabs.includes('cheatSheets'), 'cheat sheets should be off for demo school');
  });
  await check('unknown school id returns 404', async () => {
    const r = await get('/api/tenant/config', { 'x-school-id': 'sch_missing' });
    assert.strictEqual(r.status, 404);
  });

  console.log('\n[4] Exam pattern template registry');
  await check('competitive patterns carry -1 negative marking, board patterns 0', async () => {
    const r = await get('/api/templates/exam-patterns?mode=COMPETITIVE');
    const ids = r.body.patterns.map(p => p.patternId).sort();
    assert.deepStrictEqual(ids, ['JEE_MAIN', 'NEET_UG']);
    r.body.patterns.forEach(p => assert.strictEqual(p.marking.incorrect, -1));
    assert.strictEqual(examPatterns.getPattern('CBSE_BOARD').marking.incorrect, 0);
  });
  await check('assessment board strings resolve to patterns', () => {
    assert.strictEqual(examPatterns.resolvePatternForBoardString('JEE_ADVANCED').patternId, 'JEE_MAIN');
    assert.strictEqual(examPatterns.resolvePatternForBoardString('NEET').patternId, 'NEET_UG');
    assert.strictEqual(examPatterns.resolvePatternForBoardString('CBSE_CLASS_10').patternId, 'CBSE_BOARD');
    assert.strictEqual(examPatterns.resolvePatternForBoardString('HPBOSE').patternId, 'HP_BOARD');
  });
  await check('indicative percentile curve is monotonic and never reaches 100', () => {
    let prev = -1;
    for (let x = 0; x <= 100; x += 5) {
      const p = examPatterns.estimatePercentile('JEE_MAIN', x);
      assert(p >= prev, `curve decreased at ${x}`);
      prev = p;
    }
    assert(examPatterns.estimatePercentile('NEET_UG', 100) < 100);
  });

  console.log('\n[5] Canonical content (/api/content) & ?mode filter on /api/questions');
  await check('COMPETITIVE + NEET returns only NEET-targeted items without answers', async () => {
    const r = await get('/api/content?mode=COMPETITIVE&stream=NEET&limit=50');
    assert.strictEqual(r.status, 200);
    assert(r.body.totalCount > 0, 'no NEET content');
    r.body.items.forEach(i => {
      assert(i.competitive_targets.includes('NEET'), `${i.id} not NEET-targeted`);
      assert.strictEqual(i.correct_answer, undefined, 'answer leaked');
    });
  });
  await check('BOARD + ICSE returns zero items with an explanation', async () => {
    const r = await get('/api/content?mode=BOARD&board=ICSE');
    assert.strictEqual(r.body.totalCount, 0);
    assert(r.body.emptyReason.length > 0);
  });
  await check('HP Board receives NCERT-aligned CBSE content', async () => {
    const r = await get('/api/content?mode=BOARD&board=HP_BOARD&grade=10&limit=5');
    assert(r.body.totalCount > 400, `expected Class 10 content for HP Board, got ${r.body.totalCount}`);
  });
  await check('GET /api/questions?mode=COMPETITIVE&stream=JEE narrows the bank', async () => {
    const all = await get('/api/questions');
    const jee = await get('/api/questions?mode=COMPETITIVE&stream=JEE');
    assert(jee.body.totalCount > 0 && jee.body.totalCount < all.body.totalCount, `jee=${jee.body.totalCount} all=${all.body.totalCount}`);
  });
  await check('legacy /api/questions?board=CBSE behaviour is unchanged without mode', async () => {
    const r = await get('/api/questions?board=CBSE');
    assert(r.body.totalCount > 0);
  });

  console.log('\n[6] Workspace modules');
  const moduleCases = [
    ['dpp', 'mode=COMPETITIVE&stream=JEE&subjectKey=PHYSICS'],
    ['roadmap', 'mode=COMPETITIVE&stream=NEET&subjectKey=BIOLOGY'],
    ['cheatsheets', 'mode=COMPETITIVE&stream=JEE&subjectKey=PHYSICS'],
    ['ncert_core', 'mode=COMPETITIVE&stream=NEET&subjectKey=BIOLOGY'],
    ['ncert_core', 'mode=BOARD&board=CBSE&grade=12&subjectKey=PHYSICS']
  ];
  for (const [id, qs] of moduleCases) {
    await check(`${id} builds (${qs})`, async () => {
      const r = await get(`/api/modules/${id}?${qs}`);
      assert.strictEqual(r.status, 200, JSON.stringify(r.body).slice(0, 200));
      assert.strictEqual(r.body.module.empty, false, r.body.module.emptyReason);
    });
  }
  await check('Board-mode Roadmap / Cheat Sheet / Rank Analytics are feature-gated off for HAPS (403)', async () => {
    for (const qs of ['roadmap?mode=BOARD&board=CBSE&grade=12', 'cheatsheets?mode=BOARD&board=CBSE&grade=10', 'rank_analytics?mode=COMPETITIVE&stream=JEE']) {
      const r = await get(`/api/modules/${qs}`);
      assert.strictEqual(r.status, 403, qs);
      assert.strictEqual(r.body.code, 'FEATURE_DISABLED', qs);
    }
  });
  await check('Board NCERT module returns Exercise / Solved Example / Exemplar sets', async () => {
    const r = await get('/api/modules/ncert_core?mode=BOARD&board=CBSE&grade=12&subjectKey=PHYSICS');
    const sets = r.body.module.data.selectedChapter.ncertSets;
    assert(sets && ['exercise', 'example', 'exemplar'].every(k => typeof sets[k].count === 'number'), 'ncertSets missing');
    const total = r.body.module.data.chapters.reduce((s, c) => s + c.exerciseCount + c.exampleCount + c.exemplarCount, 0);
    assert(total > 0, 'no NCERT questions grouped for Physics 12');
  });
  await check('Chapter-wise DPP: chapter options, filtered set, and chapter-specific id', async () => {
    const all = await get('/api/modules/dpp?mode=COMPETITIVE&stream=JEE&subjectKey=PHYSICS');
    const chapters = all.body.module.data.chapters;
    assert(chapters.length > 1, 'no chapter options');
    const ch = chapters.find(c => c.count >= 3) || chapters[0];
    const one = await get(`/api/modules/dpp?mode=COMPETITIVE&stream=JEE&subjectKey=PHYSICS&chapter=${encodeURIComponent(ch.key)}`);
    assert.strictEqual(one.body.module.data.chapter, ch.key);
    assert(one.body.module.data.questions.every(q => q.chapter_code === ch.key), 'question outside chosen chapter');
    assert.notStrictEqual(one.body.module.data.dppId, all.body.module.data.dppId, 'chapter DPP should have its own id');
  });
  await check('rank_analytics is rejected in BOARD mode', async () => {
    const r = await get('/api/modules/rank_analytics?mode=BOARD');
    assert.strictEqual(r.status, 400);
  });
  await check('DPP is feature-gated off in HAPS BOARD mode (403) and on for the demo school', async () => {
    const off = await get('/api/modules/dpp?mode=BOARD&board=CBSE&grade=10');
    assert.strictEqual(off.status, 403);
    assert.strictEqual(off.body.code, 'FEATURE_DISABLED');
    const on = await get('/api/modules/dpp?mode=BOARD&board=CBSE&grade=10&subjectKey=CLASS10_MATHEMATICS', { 'x-school-id': 'sch_demo_board_only' });
    assert.strictEqual(on.status, 200, JSON.stringify(on.body).slice(0, 200));
  });
  await check('COMPETITIVE mode is refused for Class 10', async () => {
    const r = await get('/api/modules/roadmap?mode=COMPETITIVE&stream=JEE&grade=10');
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.body.errors[0].code, 'MODE_NOT_ELIGIBLE_FOR_GRADE');
  });
  await check('ICSE module request returns an explicit no-content state', async () => {
    const r = await get('/api/modules/ncert_core?mode=BOARD&board=ICSE&grade=12');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.module.empty, true);
  });
  await check('teacher subject isolation: Biology faculty cannot open JEE subjects', async () => {
    const jee = await get('/api/modules/dpp?mode=COMPETITIVE&stream=JEE&teacherSubjectKey=BIOLOGY');
    assert.strictEqual(jee.body.module.empty, true);
    const neet = await get('/api/modules/dpp?mode=COMPETITIVE&stream=NEET&teacherSubjectKey=BIOLOGY');
    assert.deepStrictEqual(neet.body.module.availableSubjects.map(s => s.key), ['BIOLOGY']);
  });

  console.log('\n[7] DPP determinism, scoring & streak');
  const dppQs = 'mode=COMPETITIVE&stream=JEE&subjectKey=PHYSICS&date=2026-11-16&studentId=test_student_01';
  const d1 = await get(`/api/modules/dpp?${dppQs}`);
  const d2 = await get(`/api/modules/dpp?${dppQs}`);
  await check('same date + context yields the same set (10-15 questions)', () => {
    const ids1 = d1.body.module.data.questions.map(q => q.id);
    const ids2 = d2.body.module.data.questions.map(q => q.id);
    assert.deepStrictEqual(ids1, ids2);
    assert(ids1.length >= 10 && ids1.length <= 15, `count ${ids1.length}`);
    d1.body.module.data.questions.forEach(q => assert.strictEqual(q.correct_answer, undefined, 'answer leaked'));
  });
  await check('all-correct submission scores +4 each and starts a streak', async () => {
    const answers = {};
    d1.body.module.data.questions.forEach(q => { answers[q.id] = content.getIndex().byId.get(q.id).correct_answer; });
    const r = await post('/api/modules/dpp/submit', { mode: 'COMPETITIVE', stream: 'JEE', subjectKey: 'PHYSICS', date: '2026-11-16', studentId: 'test_student_01', dppId: d1.body.module.data.dppId, answers });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body).slice(0, 200));
    assert.strictEqual(r.body.attempt.score, d1.body.module.data.questions.length * 4);
    assert.strictEqual(r.body.streak.current, 1);
  });
  await check('one wrong answer costs -1 (NTA marking)', async () => {
    const qs = d1.body.module.data.questions;
    const answers = {};
    const realKey = content.getIndex().byId.get(qs[0].id).correct_answer;
    answers[qs[0].id] = ['A', 'B', 'C', 'D'].find(k => k !== realKey);
    const r = await post('/api/modules/dpp/submit', { mode: 'COMPETITIVE', stream: 'JEE', subjectKey: 'PHYSICS', date: '2026-11-16', studentId: 'test_student_02', dppId: d1.body.module.data.dppId, answers });
    assert.strictEqual(r.body.attempt.score, -1);
  });
  await check('a mismatched dppId is rejected (409)', async () => {
    const r = await post('/api/modules/dpp/submit', { mode: 'COMPETITIVE', stream: 'JEE', subjectKey: 'PHYSICS', date: '2026-11-16', dppId: 'dpp_forged', answers: {} });
    assert.strictEqual(r.status, 409);
  });
  await check('consecutive days extend the streak', async () => {
    const qs2 = 'mode=COMPETITIVE&stream=JEE&subjectKey=PHYSICS&date=2026-11-17&studentId=test_student_01';
    const d = await get(`/api/modules/dpp?${qs2}`);
    await post('/api/modules/dpp/submit', { mode: 'COMPETITIVE', stream: 'JEE', subjectKey: 'PHYSICS', date: '2026-11-17', studentId: 'test_student_01', dppId: d.body.module.data.dppId, answers: {} });
    const s = await get('/api/modules/dpp/streak?mode=COMPETITIVE&stream=JEE&studentId=test_student_01&date=2026-11-17');
    assert.strictEqual(s.body.streak.current, 2);
  });

  console.log('\n[8] Registry-driven scoring in POST /api/assessments/:id/submit');
  await check('JEE assessment applies -1 from JEE_MAIN pattern', async () => {
    const r = await post('/api/assessments/asgn_12_phy_01/submit', { studentId: 'test_student_03', studentName: 'Registry Test', answers: [{ questionIndex: 1, selectedOption: 'Z' }] });
    assert.strictEqual(r.body.results.examPatternId, 'JEE_MAIN');
    assert.strictEqual(r.body.results.negativeMarkingApplied, 1);
  });
  await check('CBSE assessment applies no negative marking from CBSE_BOARD pattern', async () => {
    const r = await post('/api/assessments/asgn_10_math_01/submit', { studentId: 'test_student_03', studentName: 'Registry Test', answers: [{ questionIndex: 1, selectedOption: 'Z' }] });
    assert.strictEqual(r.body.results.examPatternId, 'CBSE_BOARD');
    assert.strictEqual(r.body.results.negativeMarkingApplied, 0);
  });

  server.close();
  console.log(`\nDual-mode registry tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
