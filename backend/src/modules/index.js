// ============================================================================
// UNISOLE AI SCHOOL: MODULE REGISTRY
// Workspace tools are registered here once and turned on/off per school and
// per mode by tenant feature flags (src/registry/tenants/*.json).
//
// Each module exports:
//   id, title, featureFlag, modes[], roles[], description
//   build(ctx) -> plain JSON payload rendered by the frontend Module Workspace
// ============================================================================

const dpp = require('./dpp');
const roadmap = require('./roadmap');
const cheatsheets = require('./cheatsheets');
const ncertCore = require('./ncertCore');
const rankAnalytics = require('./rankAnalytics');

const MODULES = new Map();

function registerModule(mod) {
  ['id', 'title', 'featureFlag', 'modes', 'roles', 'build'].forEach(field => {
    if (mod[field] === undefined) throw new Error(`Module is missing required field "${field}"`);
  });
  if (MODULES.has(mod.id)) throw new Error(`Module "${mod.id}" is already registered`);
  MODULES.set(mod.id, mod);
}

[dpp, roadmap, cheatsheets, ncertCore, rankAnalytics].forEach(registerModule);

function getModule(id) {
  return MODULES.get(String(id || '')) || null;
}

function listModules() {
  return Array.from(MODULES.values()).map(m => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    featureFlag: m.featureFlag,
    modes: m.modes,
    roles: m.roles
  }));
}

module.exports = { registerModule, getModule, listModules };
