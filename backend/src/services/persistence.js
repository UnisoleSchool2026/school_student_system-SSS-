// ============================================================================
// POSTGRESQL PERSISTENCE (2026-11-17)
// Every piece of school data that changes at runtime (students, classes, tests,
// submissions, DPPs and attempts, doubts, notices, mistake-notebook status,
// study-board progress, teacher-added questions, ...) is saved to PostgreSQL
// and loaded back when the server starts, so nothing is lost on a restart.
//
// How it works
//   - Routes keep reading and writing the in-process store (inMemoryStore),
//     which acts as the working copy.
//   - After every request that can change data (anything except GET), and
//     every 60 seconds, the changed records are written to PostgreSQL in one
//     transaction (only records whose content changed are sent).
//   - On start, records are loaded from PostgreSQL. The first start against an
//     empty database stores the built-in starting data.
//
// Storage: one table, one row per record.
//   school_records(collection TEXT, id TEXT, data JSONB, updated_at TIMESTAMPTZ)
// The syllabus / question banks that ship with the code are not stored here
// (they are content, not school data); questions added by teachers are.
//
// Limits: built for one backend instance writing to the database. Running
// several backend instances against the same database needs the routes to
// query PostgreSQL directly, which is a larger change.
// ============================================================================

const crypto = require('crypto');
const db = require('../config/database');

const TABLE = 'school_records';
const ORDER_COLLECTION = '__order__';
const OBJECT_COLLECTION = '__objects__';
const META_COLLECTION = '__meta__';
// Shipped content, rebuilt from code on every start.
const EXCLUDED_KEYS = new Set(['subjectBanks']);
const TELEMETRY_CAP = 20000;

const state = {
  mode: 'memory',          // 'postgresql' | 'memory' | 'memory-fallback'
  ready: false,
  lastFlushAt: null,
  lastError: null,
  recordsStored: 0,
  cache: new Map(),        // `${collection}\u0001${id}` -> JSON string as stored
  flushing: null,
  dirty: false,
  timer: null,
  interval: null
};

function pool() {
  return typeof db.getPool === 'function' ? db.getPool() : null;
}

function cacheKey(collection, id) {
  return `${collection}\u0001${id}`;
}

function recordKey(record, json) {
  if (record && typeof record === 'object') {
    const k = record.id || record.submissionId || record.key;
    if (k !== undefined && k !== null && String(k).length) return String(k).slice(0, 300);
  }
  return 'h_' + crypto.createHash('sha1').update(json).digest('hex').slice(0, 24);
}

function toJson(value) {
  // PostgreSQL JSONB cannot hold the NUL character.
  return JSON.stringify(value).replace(/\\u0000/g, '');
}

// Current content of the working store, as { key -> json } per collection.
function snapshot() {
  const store = db.inMemoryStore;
  const out = new Map();
  const order = {};
  Object.keys(store).forEach(name => {
    if (EXCLUDED_KEYS.has(name)) return;
    const value = store[name];
    if (Array.isArray(value)) {
      if (name === 'telemetry' && value.length > TELEMETRY_CAP) value.splice(0, value.length - TELEMETRY_CAP);
      const ids = [];
      const seen = new Set();
      value.forEach(record => {
        if (record === undefined || record === null) return;
        const json = toJson(record);
        let key = recordKey(record, json);
        let n = 1;
        while (seen.has(key)) { n += 1; key = `${recordKey(record, json)}#${n}`; }
        seen.add(key);
        ids.push(key);
        out.set(cacheKey(name, key), json);
      });
      order[name] = ids;
    } else if (value && typeof value === 'object') {
      out.set(cacheKey(OBJECT_COLLECTION, name), toJson(value));
    }
  });
  Object.keys(order).forEach(name => out.set(cacheKey(ORDER_COLLECTION, name), toJson(order[name])));
  return out;
}

async function ensureTable(client) {
  await client.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (collection, id)
  )`);
}

async function doFlush() {
  const p = pool();
  if (!p || state.mode !== 'postgresql') return { written: 0, removed: 0 };
  const next = snapshot();
  const upserts = [];
  next.forEach((json, key) => { if (state.cache.get(key) !== json) upserts.push([key, json]); });
  const removals = [];
  state.cache.forEach((_json, key) => { if (!next.has(key)) removals.push(key); });
  if (!upserts.length && !removals.length) { state.lastFlushAt = new Date().toISOString(); return { written: 0, removed: 0 }; }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < upserts.length; i += 200) {
      const batch = upserts.slice(i, i + 200);
      await client.query(
        `INSERT INTO ${TABLE} (collection, id, data, updated_at)
         SELECT c, i, d::jsonb, now() FROM unnest($1::text[], $2::text[], $3::text[]) AS t(c, i, d)
         ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [batch.map(b => b[0].split('\u0001')[0]), batch.map(b => b[0].split('\u0001')[1]), batch.map(b => b[1])]
      );
    }
    const byCollection = new Map();
    removals.forEach(key => {
      const [c, id] = key.split('\u0001');
      if (!byCollection.has(c)) byCollection.set(c, []);
      byCollection.get(c).push(id);
    });
    for (const [c, ids] of byCollection) {
      await client.query(`DELETE FROM ${TABLE} WHERE collection = $1 AND id = ANY($2::text[])`, [c, ids]);
    }
    await client.query('COMMIT');
    upserts.forEach(([key, json]) => state.cache.set(key, json));
    removals.forEach(key => state.cache.delete(key));
    state.recordsStored = state.cache.size;
    state.lastFlushAt = new Date().toISOString();
    state.lastError = null;
    return { written: upserts.length, removed: removals.length };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* connection already gone */ }
    state.lastError = err.message;
    console.error('[PERSISTENCE] Could not save to PostgreSQL (will retry):', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Serialised: one flush at a time; changes made during a flush trigger another pass.
function flush() {
  if (state.mode !== 'postgresql') return Promise.resolve({ written: 0, removed: 0 });
  if (state.flushing) { state.dirty = true; return state.flushing; }
  state.flushing = (async () => {
    let result = { written: 0, removed: 0 };
    do {
      state.dirty = false;
      const r = await doFlush();
      result = { written: result.written + r.written, removed: result.removed + r.removed };
    } while (state.dirty);
    return result;
  })().finally(() => { state.flushing = null; });
  return state.flushing;
}

function flushSoon() {
  if (state.mode !== 'postgresql' || state.timer) return;
  state.timer = setTimeout(() => {
    state.timer = null;
    flush().catch(() => { /* logged in doFlush; the 60 s interval retries */ });
  }, 40);
  if (state.timer.unref) state.timer.unref();
}

// Express middleware: save after every request that can change data.
function middleware(req, res, next) {
  if (state.mode === 'postgresql' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.on('finish', flushSoon);
  }
  next();
}

async function loadFromDatabase(client) {
  const { rows } = await client.query(`SELECT collection, id, data FROM ${TABLE}`);
  if (!rows.length) return rows;
  const store = db.inMemoryStore;
  const byCollection = new Map();
  let order = {};
  rows.forEach(r => {
    if (r.collection === ORDER_COLLECTION) { order[r.id] = r.data; return; }
    if (r.collection === META_COLLECTION) return;
    if (!byCollection.has(r.collection)) byCollection.set(r.collection, new Map());
    byCollection.get(r.collection).set(r.id, r.data);
  });
  // Arrays: only collections the database knows about replace the built-in starting data.
  Object.keys(order).forEach(name => {
    if (EXCLUDED_KEYS.has(name)) return;
    const records = byCollection.get(name) || new Map();
    const ids = Array.isArray(order[name]) ? order[name] : [];
    const list = ids.filter(id => records.has(id)).map(id => records.get(id));
    records.forEach((data, id) => { if (!ids.includes(id)) list.push(data); });
    if (Array.isArray(store[name])) { store[name].length = 0; list.forEach(x => store[name].push(x)); } else { store[name] = list; }
  });
  const objects = byCollection.get(OBJECT_COLLECTION);
  if (objects) objects.forEach((data, name) => { if (!EXCLUDED_KEYS.has(name)) store[name] = data; });
  // Teacher-added questions live inside the shipped banks at runtime.
  if (Array.isArray(store.injectedQuestions) && typeof db.hydrateInjectedQuestions === 'function') {
    db.hydrateInjectedQuestions(store.injectedQuestions);
  }
  return rows;
}

async function init() {
  const p = pool();
  if (!p) {
    state.mode = 'memory';
    state.ready = true;
    console.log('[PERSISTENCE] No DATABASE_URL: data is kept in memory only and is lost on restart.');
    return status();
  }
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const client = await p.connect();
      try {
        await ensureTable(client);
        const rows = await loadFromDatabase(client);
        state.mode = 'postgresql';
        // The cache mirrors exactly what the database holds, so the first flush
        // writes only what differs (everything, on a brand-new database).
        state.cache = new Map();
        rows.forEach(r => { if (r.collection !== META_COLLECTION) state.cache.set(cacheKey(r.collection, r.id), toJson(r.data)); });
      } finally {
        client.release();
      }
      if (typeof db.markConnected === 'function') db.markConnected(true);
      await client_meta();
      const r = await flush();
      state.ready = true;
      state.recordsStored = state.cache.size;
      console.log(`[PERSISTENCE] PostgreSQL connected. ${state.recordsStored} records in "${TABLE}" (${r.written} written, ${r.removed} removed on start).`);
      if (!state.interval) {
        state.interval = setInterval(() => flush().catch(() => {}), 60000);
        if (state.interval.unref) state.interval.unref();
      }
      return status();
    } catch (err) {
      lastErr = err;
      console.warn(`[PERSISTENCE] PostgreSQL attempt ${attempt}/3 failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
  state.lastError = lastErr ? lastErr.message : 'unknown error';
  if (String(process.env.DATABASE_REQUIRED || '').toLowerCase() === 'true') {
    throw new Error(`DATABASE_REQUIRED=true but PostgreSQL is unreachable: ${state.lastError}`);
  }
  state.mode = 'memory-fallback';
  state.ready = true;
  console.error('[PERSISTENCE] PostgreSQL is unreachable. RUNNING WITHOUT SAVED DATA: changes are lost on restart. Fix DATABASE_URL and restart. (Set DATABASE_REQUIRED=true to refuse to start instead.)');
  return status();
}

// Marker row so an operator can see when the store was first created.
async function client_meta() {
  const p = pool();
  await p.query(
    `INSERT INTO ${TABLE} (collection, id, data) VALUES ($1, 'store', $2::jsonb) ON CONFLICT (collection, id) DO NOTHING`,
    [META_COLLECTION, JSON.stringify({ createdAt: new Date().toISOString(), format: 1 })]
  );
}

function status() {
  return {
    mode: state.mode,
    durable: state.mode === 'postgresql',
    ready: state.ready,
    recordsStored: state.recordsStored,
    lastSavedAt: state.lastFlushAt,
    lastError: state.lastError
  };
}

async function shutdown() {
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }
  if (state.interval) { clearInterval(state.interval); state.interval = null; }
  if (state.mode === 'postgresql') {
    try { await flush(); } catch (e) { /* logged */ }
  }
  const p = pool();
  if (p) { try { await p.end(); } catch (e) { /* ignore */ } }
}

module.exports = { init, flush, flushSoon, middleware, status, shutdown, TABLE };
