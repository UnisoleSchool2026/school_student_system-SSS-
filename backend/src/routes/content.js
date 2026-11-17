// ============================================================================
// ROUTES: Canonical Curriculum Content (dual-mode library)
//   GET /api/content?mode=BOARD&board=CBSE&subjectKey=PHYSICS&contentType=PYQ
//   GET /api/content?mode=COMPETITIVE&stream=JEE&chapter=...&includeSolutions=true
//   GET /api/content/stats
// Board/stream are validated against the active school's profile.
// ============================================================================

const express = require('express');
const router = express.Router();
const tenants = require('../services/tenantConfigService');
const content = require('../services/canonicalContentService');
const { withTenant } = require('./tenant');

router.get('/stats', (req, res) => {
  try {
    res.json({ success: true, stats: content.getStats() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', withTenant, (req, res) => {
  try {
    const ctx = tenants.resolveModeContext(req.tenant, req.query);
    const blocking = ctx.errors.filter(e => e.code !== 'MODE_NOT_ELIGIBLE_FOR_GRADE');
    if (blocking.length) return res.status(400).json({ success: false, errors: blocking, context: ctx });

    const includeSolutions = String(req.query.includeSolutions || '').toLowerCase() === 'true';
    const result = ctx.contentStatus === 'NO_CONTENT'
      ? { total: 0, items: [] }
      : content.query({
        mode: ctx.mode,
        board: ctx.board,
        stream: ctx.stream,
        subjectKey: req.query.subjectKey,
        grade: ctx.grade,
        chapter: req.query.chapter,
        contentType: req.query.contentType,
        difficulty: req.query.difficulty,
        yearTag: req.query.yearTag,
        search: req.query.search,
        objectiveOnly: String(req.query.objectiveOnly || '') === 'true',
        ncertOnly: String(req.query.ncertOnly || '') === 'true',
        limit: req.query.limit === undefined ? 50 : req.query.limit,
        offset: req.query.offset
      });

    res.json({
      success: true,
      context: ctx,
      totalCount: result.total,
      count: result.items.length,
      emptyReason: result.total === 0 ? (ctx.contentStatusNote || 'No content matches these filters yet.') : '',
      items: result.items.map(r => content.toPublic(r, { includeSolutions }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
