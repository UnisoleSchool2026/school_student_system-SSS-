// ============================================================================
// ROUTES: Multi-Tenant School Configuration & Exam Pattern Templates
// Mounted at /api (see server.js):
//   GET /api/tenant/config                 School profile + per-mode tracks, features, tabs
//   GET /api/tenant/workspace?mode=&role=  Workspace tabs for one mode and role
//   GET /api/tenant/list                   Registered schools
//   GET /api/templates/exam-patterns       Exam pattern template registry (?mode=)
//   GET /api/templates/exam-patterns/:id   One pattern
// ============================================================================

const express = require('express');
const router = express.Router();
const tenants = require('../services/tenantConfigService');
const examPatterns = require('../services/examPatternRegistry');
const content = require('../services/canonicalContentService');

function withTenant(req, res, next) {
  try {
    const resolved = tenants.resolveTenantFromRequest(req);
    if (resolved.error) return res.status(resolved.status || 400).json({ success: false, error: resolved.error });
    req.tenant = resolved.tenant;
    req.tenantSource = resolved.source;
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

router.get('/tenant/config', withTenant, (req, res) => {
  try {
    const view = tenants.buildPublicTenantView(req.tenant, content.getStats());
    res.json({ success: true, resolvedFrom: req.tenantSource, tenant: view });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenant/workspace', withTenant, (req, res) => {
  try {
    const ctx = tenants.resolveModeContext(req.tenant, req.query);
    const role = req.query.role === 'student' ? 'student' : 'teacher';
    res.json({
      success: true,
      context: ctx,
      role,
      tabs: tenants.getWorkspaceTabs(req.tenant, ctx.mode, role)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tenant/list', (req, res) => {
  try {
    res.json({ success: true, schools: tenants.listTenants() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/templates/exam-patterns', (req, res) => {
  try {
    const patterns = examPatterns.listPatterns({ mode: req.query.mode });
    res.json({ success: true, count: patterns.length, patterns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/templates/exam-patterns/:patternId', (req, res) => {
  const pattern = examPatterns.getPattern(req.params.patternId);
  if (!pattern) return res.status(404).json({ success: false, error: `Unknown exam pattern "${req.params.patternId}"` });
  return res.json({ success: true, pattern });
});

module.exports = router;
module.exports.withTenant = withTenant;
