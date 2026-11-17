// ============================================================================
// TEST: PostgreSQL persistence across a real server restart.
// Needs a throw-away PostgreSQL database in TEST_DATABASE_URL (the test DROPS
// the school_records table in it). It never uses DATABASE_URL.
//   TEST_DATABASE_URL=postgresql://user@localhost:5432/unisole_test node scripts/test_postgres_persistence.js
// Without TEST_DATABASE_URL the test is skipped (exit 0).
// ============================================================================
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const url = process.env.TEST_DATABASE_URL;
if (!url) { console.log('SKIPPED: set TEST_DATABASE_URL to a throw-away PostgreSQL database to run this test.'); process.exit(0); }
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (process.env.DATABASE_URL && process.env.DATABASE_URL === url) { console.error('REFUSED: TEST_DATABASE_URL is the same as DATABASE_URL. Use a separate test database.'); process.exit(1); }

const PORT = 5600 + Math.floor(Math.random() * 300);
const base = `http://127.0.0.1:${PORT}`;
const ARYAN = 'b0000000-0000-0000-0000-000000000001';
let passed = 0; let failed = 0;
async function check(name, fn) {
  try { await fn(); passed += 1; console.log(`  PASS  ${name}`); } catch (err) { failed += 1; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}
async function call(method, p, body) {
  const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
}
function startServer() {
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: Object.assign({}, process.env, { PORT: String(PORT), DATABASE_URL: url, DATABASE_SSL: process.env.TEST_DATABASE_SSL || 'false', KAFKA_ENABLED: 'false', GEMINI_API_KEY: '', GROQ_API_KEY: '', NODE_ENV: 'test' }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  child.stdout.on('data', d => { log += d; });
  child.stderr.on('data', d => { log += d; });
  return { child, log: () => log };
}
async function waitUp() {
  for (let i = 0; i < 80; i += 1) {
    try { const r = await fetch(base + '/api/health'); if (r.ok) return (await r.json()); } catch (e) { /* not up yet */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('server did not start');
}
function stop(proc) {
  return new Promise(resolve => { proc.child.on('exit', resolve); proc.child.kill('SIGTERM'); });
}

async function main() {
  const { Pool } = require('pg');
  const admin = new Pool({ connectionString: url, ssl: process.env.TEST_DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });
  await admin.query('DROP TABLE IF EXISTS school_records');

  let proc = startServer();
  let health = await waitUp();
  let noticeId; let doubtId; let dppId; let studentCount;
  await check('First start on an empty database stores the starting data', async () => {
    assert.strictEqual(health.storage.mode, 'postgresql');
    assert.strictEqual(health.storage.durable, true);
    const { rows } = await admin.query("SELECT count(*)::int AS n FROM school_records WHERE collection = 'users'");
    assert(rows[0].n > 20, `users stored: ${rows[0].n}`);
    studentCount = rows[0].n;
  });
  await check('Changes are written to PostgreSQL right after the request', async () => {
    const n = await call('POST', '/api/notices', { author: { role: 'PRINCIPAL', name: 'Principal' }, title: 'Persistence test notice', section: 'ALL' });
    noticeId = n.body.notice.id;
    const d = await call('POST', '/api/doubts', { studentId: ARYAN, subjectKey: 'PHYSICS', text: 'Persistence test doubt about flux' });
    doubtId = d.body.doubt.id;
    const p = await call('POST', '/api/dpp', { teacher: { id: 'fac_phy_01', name: 'Dr. Vikram Sharma', subjectKey: 'PHYSICS', subjectName: 'Physics' }, section: '12-NonMed', source: 'BANK', count: 3, title: 'Persistence DPP' });
    dppId = p.body.dpp.id;
    await new Promise(r => setTimeout(r, 400));
    const { rows } = await admin.query('SELECT collection, id FROM school_records WHERE id = ANY($1::text[])', [[noticeId, doubtId, dppId]]);
    assert.strictEqual(rows.length, 3, JSON.stringify(rows));
  });
  await stop(proc);

  proc = startServer();
  health = await waitUp();
  await check('After a restart the data is still there (loaded from PostgreSQL)', async () => {
    const n = await call('GET', '/api/notices?role=principal');
    assert(n.body.notices.some(x => x.id === noticeId), 'notice lost');
    const d = await call('GET', `/api/doubts?studentId=${ARYAN}`);
    assert(d.body.doubts.some(x => x.id === doubtId), 'doubt lost');
    const p = await call('GET', '/api/dpp?teacherSubjectKey=PHYSICS');
    assert(p.body.dpps.some(x => x.id === dppId), 'DPP lost');
  });
  await check('Deleting is saved too, and nothing is duplicated on restart', async () => {
    await call('DELETE', `/api/notices/${noticeId}?role=principal`);
    await call('DELETE', `/api/dpp/${dppId}?teacherSubjectKey=PHYSICS`);
    await new Promise(r => setTimeout(r, 400));
    const { rows } = await admin.query('SELECT id FROM school_records WHERE id = ANY($1::text[])', [[noticeId, dppId]]);
    assert.strictEqual(rows.length, 0);
    const u = await admin.query("SELECT count(*)::int AS n FROM school_records WHERE collection = 'users'");
    assert.strictEqual(u.rows[0].n, studentCount);
  });
  await stop(proc);

  proc = startServer();
  await waitUp();
  await check('Third start: deleted records stay deleted, the doubt is still there', async () => {
    const n = await call('GET', '/api/notices?role=principal');
    assert(!n.body.notices.some(x => x.id === noticeId));
    const d = await call('GET', `/api/doubts?studentId=${ARYAN}`);
    assert(d.body.doubts.some(x => x.id === doubtId));
  });
  await stop(proc);
  await admin.query('DROP TABLE IF EXISTS school_records');
  await admin.end();
  console.log(`\nPostgreSQL persistence tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch(err => { console.error(err); process.exit(1); });
