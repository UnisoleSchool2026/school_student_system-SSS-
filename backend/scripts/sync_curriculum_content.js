// ============================================================================
// SYNC: tenant profiles + canonical curriculum content -> PostgreSQL
// Upserts every src/registry/tenants/*.json into `schools` and every subject
// bank question (projected by canonicalContentService) into
// `curriculum_content`. Safe to re-run.
//
//   node scripts/sync_curriculum_content.js            (needs DATABASE_URL)
//   node scripts/sync_curriculum_content.js --dry-run  (no database; prints counts)
// ============================================================================

const path = require('path');
process.chdir(path.resolve(__dirname, '..'));
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  // Load banks into the in-memory store without opening the app's own pool.
  const savedUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const { initDatabase } = require('../src/config/database');
  try { await initDatabase(); } catch (e) { /* in-memory */ }
  process.env.DATABASE_URL = savedUrl;

  const tenants = require('../src/services/tenantConfigService');
  const content = require('../src/services/canonicalContentService');
  const schoolRows = Array.from(tenants.loadTenants().values());
  const records = content.getIndex().records;
  const stats = content.getStats();

  console.log(`[SYNC] ${schoolRows.length} school profile(s), ${records.length} canonical content rows`);
  console.log(`[SYNC] by track: ${JSON.stringify(stats.byTrack)}`);
  if (DRY_RUN) {
    console.log('[SYNC] --dry-run: no database writes.');
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error('[SYNC] DATABASE_URL is not set. Use --dry-run to preview.');
    process.exit(1);
  }

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of schoolRows) {
      await client.query(
        `INSERT INTO schools (id, name, short_name, active_modes, default_mode, profile)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name,
           active_modes = EXCLUDED.active_modes, default_mode = EXCLUDED.default_mode, profile = EXCLUDED.profile`,
        [t.schoolId, t.name, t.shortName || null, t.activeModes, t.defaultMode, JSON.stringify(t)]
      );
    }
    const allowedDifficulty = new Set(['EASY', 'MEDIUM', 'HARD', 'CHALLENGER']);
    for (const r of records) {
      await client.query(
        `INSERT INTO curriculum_content (
           id, school_id, subject, subject_key, grade, chapter_code, chapter_name, topic,
           target_modes, board_targets, competitive_targets, competitive_source,
           content_type, question_format, question_latex, solution_latex, rubric_steps, mcq_options,
           correct_answer, difficulty_level, year_tag, year_tags, marks, benchmark_time_seconds)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
         ON CONFLICT (id) DO UPDATE SET
           target_modes = EXCLUDED.target_modes, board_targets = EXCLUDED.board_targets,
           competitive_targets = EXCLUDED.competitive_targets, competitive_source = EXCLUDED.competitive_source,
           content_type = EXCLUDED.content_type, question_latex = EXCLUDED.question_latex,
           solution_latex = EXCLUDED.solution_latex, rubric_steps = EXCLUDED.rubric_steps,
           mcq_options = EXCLUDED.mcq_options, correct_answer = EXCLUDED.correct_answer,
           difficulty_level = EXCLUDED.difficulty_level, year_tag = EXCLUDED.year_tag, year_tags = EXCLUDED.year_tags`,
        [
          String(r.id).slice(0, 64), String(r.subject).slice(0, 32), r.subject_key, r.grade,
          r.chapter_code.slice(0, 64), String(r.chapter_name || '').slice(0, 255), String(r.topic || '').slice(0, 255),
          r.target_modes, r.board_targets, r.competitive_targets, r.competitive_source,
          r.content_type, r.question_format, r.question_latex, r.solution_latex,
          r.rubric_steps ? JSON.stringify(r.rubric_steps) : null,
          r.mcq_options ? JSON.stringify(r.mcq_options) : null,
          r.correct_answer ? String(r.correct_answer).slice(0, 255) : null,
          allowedDifficulty.has(r.difficulty_level) ? r.difficulty_level : 'MEDIUM',
          r.year_tag, r.year_tags, r.marks, r.benchmark_time_seconds
        ]
      );
    }
    await client.query('COMMIT');
    const check = await client.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE 'COMPETITIVE' = ANY(target_modes))::int AS competitive,
              count(*) FILTER (WHERE 'ICSE' = ANY(board_targets))::int AS icse
         FROM curriculum_content`
    );
    console.log(`[SYNC] curriculum_content now holds ${JSON.stringify(check.rows[0])}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('[SYNC] failed:', err.message);
  process.exit(1);
});
