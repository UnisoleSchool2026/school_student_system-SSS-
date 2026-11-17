/**
 * Shows what is saved in the PostgreSQL database (table `school_records`).
 *
 *   npm run db:status
 *
 * Read-only. Uses DATABASE_URL from backend/.env.
 */
require('dotenv').config();
const { Pool } = require('pg');

// Same rule as src/config/database.js: `sslmode=` in the URL decides, else DATABASE_SSL, else on in production.
function poolConfig(url) {
  const cfg = { connectionString: url, connectionTimeoutMillis: 8000 };
  if (/[?&]sslmode=/.test(url)) return cfg;
  const flag = String(process.env.DATABASE_SSL || '').toLowerCase();
  const wantSsl = flag === 'true' || (flag !== 'false' && process.env.NODE_ENV === 'production');
  cfg.ssl = wantSsl ? { rejectUnauthorized: false } : false;
  return cfg;
}

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('DATABASE_URL is not set in backend/.env. The server keeps data in memory only.');
    process.exit(1);
  }
  const pool = new Pool(poolConfig(url));
  try {
    const host = (() => { try { const u = new URL(url); return `${u.hostname}:${u.port || 5432}${u.pathname}`; } catch (e) { return '(unreadable URL)'; } })();
    console.log(`Database: ${host}`);
    const exists = await pool.query("SELECT to_regclass('public.school_records') AS t");
    if (!exists.rows[0].t) {
      console.log('Connected. Table school_records does not exist yet; it is created when the server starts.');
      return;
    }
    const rows = await pool.query(`SELECT collection, COUNT(*)::int AS records, MAX(updated_at) AS last_saved
                                   FROM school_records GROUP BY collection ORDER BY collection`);
    if (!rows.rows.length) { console.log('Connected. Nothing saved yet.'); return; }
    const width = Math.max(...rows.rows.map(r => r.collection.length), 10);
    console.log(`${'Collection'.padEnd(width)}  Records  Last saved`);
    rows.rows.forEach(r => console.log(`${r.collection.padEnd(width)}  ${String(r.records).padStart(7)}  ${r.last_saved ? new Date(r.last_saved).toISOString() : '-'}`));
    console.log(`Total: ${rows.rows.reduce((s, r) => s + r.records, 0)} records`);
  } catch (err) {
    console.error(`Could not read the database: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
})();
