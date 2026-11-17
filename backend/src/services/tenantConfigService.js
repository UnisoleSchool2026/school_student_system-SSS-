// ============================================================================
// UNISOLE AI SCHOOL: MULTI-TENANT SCHOOL CONFIGURATION SERVICE
// Loads school profiles from src/registry/tenants/*.json and resolves, per
// request, which school is active and which mode / board / stream / features
// apply. Adding a school = adding one JSON file; no code changes.
//
// Tenant resolution order:
//   1. `x-school-id` request header
//   2. `schoolId` query / body parameter
//   3. Host subdomain matched against tenant.subdomains
//   4. DEFAULT_SCHOOL_ID environment variable
//   5. sch_unisole_001 (HAPS) / first loaded tenant
// ============================================================================

const fs = require('fs');
const path = require('path');
const examPatterns = require('./examPatternRegistry');

const TENANT_DIR = path.resolve(__dirname, '../registry/tenants');
const TABS_PATH = path.resolve(__dirname, '../registry/workspace_tabs.json');
const FALLBACK_SCHOOL_ID = 'sch_unisole_001';
const VALID_MODES = ['BOARD', 'COMPETITIVE'];

let tenantCache = null;
let tabsCache = null;

function validateTenant(t, fileName) {
  const errors = [];
  if (!t || typeof t !== 'object') errors.push('profile is not an object');
  if (!t.schoolId) errors.push('schoolId is required');
  if (!t.name) errors.push('name is required');
  if (!Array.isArray(t.activeModes) || t.activeModes.length === 0) {
    errors.push('activeModes must be a non-empty array');
  } else {
    t.activeModes.forEach(m => {
      if (!VALID_MODES.includes(m)) errors.push(`unknown mode "${m}"`);
    });
    if (!t.activeModes.includes(t.defaultMode)) errors.push('defaultMode must be one of activeModes');
    if (t.activeModes.includes('BOARD')) {
      const bc = t.boardConfig || {};
      if (!Array.isArray(bc.enabledBoards) || bc.enabledBoards.length === 0) errors.push('boardConfig.enabledBoards is required for BOARD mode');
      else if (!bc.enabledBoards.includes(bc.defaultBoard)) errors.push('boardConfig.defaultBoard must be in enabledBoards');
    }
    if (t.activeModes.includes('COMPETITIVE')) {
      const cc = t.competitiveConfig || {};
      if (!Array.isArray(cc.enabledStreams) || cc.enabledStreams.length === 0) errors.push('competitiveConfig.enabledStreams is required for COMPETITIVE mode');
      else if (!cc.enabledStreams.includes(cc.defaultStream)) errors.push('competitiveConfig.defaultStream must be in enabledStreams');
    }
  }
  if (errors.length) {
    throw new Error(`Invalid tenant profile ${fileName}: ${errors.join('; ')}`);
  }
}

function loadTenants(forceReload = false) {
  if (tenantCache && !forceReload) return tenantCache;
  const map = new Map();
  const files = fs.existsSync(TENANT_DIR) ? fs.readdirSync(TENANT_DIR).filter(f => f.endsWith('.json')).sort() : [];
  files.forEach(file => {
    const parsed = JSON.parse(fs.readFileSync(path.join(TENANT_DIR, file), 'utf8'));
    validateTenant(parsed, file);
    map.set(parsed.schoolId, Object.freeze(parsed));
  });
  if (map.size === 0) throw new Error(`No tenant profiles found in ${TENANT_DIR}`);
  tenantCache = map;
  return tenantCache;
}

function loadWorkspaceTabs(forceReload = false) {
  if (tabsCache && !forceReload) return tabsCache;
  tabsCache = JSON.parse(fs.readFileSync(TABS_PATH, 'utf8'));
  return tabsCache;
}

function listTenants() {
  return Array.from(loadTenants().values()).map(t => ({
    schoolId: t.schoolId,
    name: t.name,
    shortName: t.shortName || '',
    activeModes: t.activeModes
  }));
}

function getTenant(schoolId) {
  return loadTenants().get(String(schoolId || '')) || null;
}

function getDefaultTenant() {
  const tenants = loadTenants();
  return tenants.get(process.env.DEFAULT_SCHOOL_ID || '')
    || tenants.get(FALLBACK_SCHOOL_ID)
    || tenants.values().next().value;
}

function tenantFromHost(host) {
  if (!host) return null;
  const hostname = String(host).split(':')[0].toLowerCase();
  const firstLabel = hostname.split('.')[0];
  for (const t of loadTenants().values()) {
    if ((t.subdomains || []).map(s => s.toLowerCase()).includes(firstLabel)) return t;
  }
  return null;
}

// Returns { tenant, source } or { error } when an explicitly requested school is unknown.
function resolveTenantFromRequest(req) {
  const headerId = req.headers ? req.headers['x-school-id'] : undefined;
  const queryId = (req.query && req.query.schoolId) || (req.body && req.body.schoolId);
  const explicit = headerId || queryId;
  if (explicit) {
    const t = getTenant(explicit);
    if (!t) return { error: `Unknown schoolId "${explicit}"`, status: 404 };
    return { tenant: t, source: headerId ? 'header' : 'query' };
  }
  const fromHost = tenantFromHost(req.headers ? req.headers.host : '');
  if (fromHost) {
    return { tenant: fromHost, source: 'subdomain' };
  }
  return { tenant: getDefaultTenant(), source: 'default' };
}

function getModeConfig(tenant, mode) {
  if (!tenant) return null;
  if (mode === 'BOARD') return tenant.boardConfig || null;
  if (mode === 'COMPETITIVE') return tenant.competitiveConfig || null;
  return null;
}

function isFeatureEnabled(tenant, mode, flag) {
  if (!flag) return true;
  const cfg = getModeConfig(tenant, mode);
  return Boolean(cfg && cfg.features && cfg.features[flag] === true);
}

function normalizeGrade(grade) {
  if (grade === undefined || grade === null || grade === '' || String(grade).toUpperCase() === 'ALL') return null;
  const m = String(grade).match(/\d+/);
  return m ? m[0] : null;
}

// Validates and defaults the requested mode context against the tenant profile.
function resolveModeContext(tenant, input = {}) {
  const errors = [];
  let mode = examPatterns.normalizeKey(input.mode) || tenant.defaultMode;
  if (!tenant.activeModes.includes(mode)) {
    errors.push({ code: 'MODE_NOT_ACTIVE', message: `Mode "${mode}" is not enabled for ${tenant.name}` });
    mode = tenant.defaultMode;
  }
  const cfg = getModeConfig(tenant, mode) || {};
  const grade = normalizeGrade(input.grade);

  let board = null;
  let stream = null;
  if (mode === 'BOARD') {
    board = examPatterns.normalizeKey(input.board) || cfg.defaultBoard;
    if (!cfg.enabledBoards.includes(board)) {
      errors.push({ code: 'BOARD_NOT_ENABLED', message: `Board "${board}" is not enabled for ${tenant.name}` });
      board = cfg.defaultBoard;
    }
  } else {
    stream = examPatterns.normalizeKey(input.stream) || cfg.defaultStream;
    if (!cfg.enabledStreams.includes(stream)) {
      errors.push({ code: 'STREAM_NOT_ENABLED', message: `Stream "${stream}" is not enabled for ${tenant.name}` });
      stream = cfg.defaultStream;
    }
  }

  const eligibleGrades = Array.isArray(cfg.eligibleGrades) ? cfg.eligibleGrades : [];
  const gradeEligible = !grade || eligibleGrades.length === 0 || eligibleGrades.includes(grade);
  if (!gradeEligible) {
    errors.push({ code: 'MODE_NOT_ELIGIBLE_FOR_GRADE', message: `${cfg.label || mode} is not available for Class ${grade}` });
  }

  const pattern = examPatterns.getPatternForContext({ mode, board, stream });
  return {
    schoolId: tenant.schoolId,
    mode,
    board,
    stream,
    track: board || stream,
    grade,
    gradeEligible,
    patternId: pattern ? pattern.patternId : null,
    contentStatus: pattern ? pattern.contentStatus || 'AVAILABLE' : 'AVAILABLE',
    contentStatusNote: pattern ? pattern.contentStatusNote || '' : '',
    features: Object.assign({}, cfg.features || {}),
    errors
  };
}

function getWorkspaceTabs(tenant, mode, role = 'teacher') {
  const registry = loadWorkspaceTabs();
  const list = registry[role === 'student' ? 'student' : 'teacher'] || [];
  return list
    .filter(tab => tab.modes.includes(mode) && isFeatureEnabled(tenant, mode, tab.featureFlag))
    .map(tab => ({
      id: tab.id,
      target: tab.target,
      icon: tab.icon,
      tone: tab.tone,
      featureFlag: tab.featureFlag,
      label: (tab.labels && tab.labels[mode]) || { title: tab.id, subtitle: '', badge: '' }
    }));
}

// Full public profile handed to the frontend at login / boot.
function buildPublicTenantView(tenant, contentStats) {
  const modes = {};
  tenant.activeModes.forEach(mode => {
    const cfg = getModeConfig(tenant, mode) || {};
    const tracks = mode === 'BOARD' ? cfg.enabledBoards : cfg.enabledStreams;
    const trackDetails = (tracks || []).map(track => {
      const pattern = examPatterns.getPatternForContext({
        mode,
        board: mode === 'BOARD' ? track : null,
        stream: mode === 'COMPETITIVE' ? track : null
      });
      const contentCount = contentStats && contentStats.byTrack ? contentStats.byTrack[`${mode}:${track}`] || 0 : null;
      const hasContent = pattern && pattern.contentStatus === 'NO_CONTENT' ? false : (contentCount === null ? true : contentCount > 0);
      return {
        id: track,
        label: pattern ? pattern.label : track,
        patternId: pattern ? pattern.patternId : null,
        contentCount,
        hasContent,
        contentStatusNote: hasContent ? '' : (pattern && pattern.contentStatusNote) || `No ${track} content has been loaded yet.`
      };
    });
    modes[mode] = {
      label: cfg.label || mode,
      eligibleGrades: cfg.eligibleGrades || [],
      defaultTrack: mode === 'BOARD' ? cfg.defaultBoard : cfg.defaultStream,
      tracks: trackDetails,
      features: cfg.features || {},
      dpp: cfg.dpp || null,
      tabs: {
        teacher: getWorkspaceTabs(tenant, mode, 'teacher'),
        student: getWorkspaceTabs(tenant, mode, 'student')
      }
    };
  });
  return {
    schoolId: tenant.schoolId,
    name: tenant.name,
    shortName: tenant.shortName || '',
    activeModes: tenant.activeModes,
    defaultMode: tenant.defaultMode,
    modes
  };
}

module.exports = {
  VALID_MODES,
  validateTenant,
  loadTenants,
  loadWorkspaceTabs,
  listTenants,
  getTenant,
  getDefaultTenant,
  resolveTenantFromRequest,
  getModeConfig,
  isFeatureEnabled,
  resolveModeContext,
  getWorkspaceTabs,
  buildPublicTenantView,
  normalizeGrade
};
