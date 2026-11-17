// ============================================================================
// ROUTES: Workspace Module Registry
//   GET  /api/modules?mode=&board=&stream=&grade=     Registered modules + availability
//   GET  /api/modules/dpp/streak?studentId=&stream=    DPP streak
//   POST /api/modules/dpp/submit                       Score a DPP set
//   GET  /api/modules/:moduleId?mode=&board=&stream=&grade=&subjectKey=&chapter=
// Common context params: schoolId (or x-school-id header), mode, board, stream,
// grade, subjectKey, teacherSubjectKey (subject isolation), studentId, date,
// chapter, weeks, count, role.
// ============================================================================

const express = require('express');
const router = express.Router();
const tenants = require('../services/tenantConfigService');
const registry = require('../modules');
const { withTenant } = require('./tenant');

function readContext(req) {
  const src = Object.assign({}, req.query || {}, req.body || {});
  const ctx = tenants.resolveModeContext(req.tenant, src);
  return Object.assign(ctx, {
    tenant: req.tenant,
    role: src.role === 'student' ? 'student' : 'teacher',
    subjectKey: src.subjectKey || null,
    teacherSubjectKey: src.teacherSubjectKey || null,
    studentId: src.studentId || null,
    date: src.date || null,
    chapter: src.chapter || null,
    weeks: src.weeks || null,
    count: src.count || null
  });
}

function publicContext(ctx) {
  const { tenant, ...rest } = ctx;
  return rest;
}

// Shared gate: tenant mode/track validity, grade eligibility, feature flag, role.
function gate(ctx, mod) {
  const blocking = ctx.errors.filter(e => e.code !== 'MODE_NOT_ELIGIBLE_FOR_GRADE');
  if (blocking.length) return { status: 400, body: { success: false, errors: blocking } };
  if (!ctx.gradeEligible) {
    return { status: 400, body: { success: false, errors: ctx.errors.filter(e => e.code === 'MODE_NOT_ELIGIBLE_FOR_GRADE') } };
  }
  if (!mod.modes.includes(ctx.mode)) {
    return { status: 400, body: { success: false, error: `Module "${mod.id}" is not available in ${ctx.mode} mode` } };
  }
  if (!tenants.isFeatureEnabled(ctx.tenant, ctx.mode, mod.featureFlag)) {
    return { status: 403, body: { success: false, code: 'FEATURE_DISABLED', error: `${mod.title} is turned off for ${ctx.tenant.name} in ${ctx.mode} mode` } };
  }
  if (!mod.roles.includes(ctx.role)) {
    return { status: 403, body: { success: false, code: 'ROLE_NOT_ALLOWED', error: `${mod.title} is not available for the ${ctx.role} portal` } };
  }
  return null;
}

router.get('/', withTenant, (req, res) => {
  try {
    const ctx = readContext(req);
    const modules = registry.listModules().map(m => Object.assign({}, m, {
      enabled: m.modes.includes(ctx.mode) && tenants.isFeatureEnabled(req.tenant, ctx.mode, m.featureFlag)
    }));
    res.json({ success: true, context: publicContext(ctx), modules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/dpp/streak', withTenant, (req, res) => {
  try {
    const ctx = readContext(req);
    const dpp = registry.getModule('dpp');
    res.json({ success: true, context: publicContext(ctx), streak: dpp.computeStreak(ctx.studentId, ctx.schoolId, ctx.track, ctx.date) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/dpp/submit', withTenant, (req, res) => {
  try {
    const ctx = readContext(req);
    const dpp = registry.getModule('dpp');
    const blocked = gate(ctx, dpp);
    if (blocked) return res.status(blocked.status).json(blocked.body);
    if (ctx.contentStatus === 'NO_CONTENT') return res.status(400).json({ success: false, error: ctx.contentStatusNote || 'No content for this track.' });
    const answers = req.body && typeof req.body.answers === 'object' && req.body.answers ? req.body.answers : {};
    const out = dpp.submit(ctx, { dppId: req.body.dppId, answers, timeTakenSeconds: req.body.timeTakenSeconds });
    if (out.error) return res.status(out.status || 400).json({ success: false, error: out.error });
    return res.status(201).json(Object.assign({ success: true }, out));
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:moduleId', withTenant, (req, res) => {
  try {
    const mod = registry.getModule(req.params.moduleId);
    if (!mod) return res.status(404).json({ success: false, error: `Unknown module "${req.params.moduleId}"` });
    const ctx = readContext(req);
    const blocked = gate(ctx, mod);
    if (blocked) return res.status(blocked.status).json(blocked.body);

    if (ctx.contentStatus === 'NO_CONTENT') {
      return res.json({
        success: true,
        context: publicContext(ctx),
        module: {
          moduleId: mod.id,
          title: mod.title,
          mode: ctx.mode,
          track: ctx.track,
          empty: true,
          emptyReason: ctx.contentStatusNote || `No ${ctx.track} content has been loaded yet.`,
          data: null
        }
      });
    }
    const payload = mod.build(ctx);
    return res.json({ success: true, context: publicContext(ctx), module: payload });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
