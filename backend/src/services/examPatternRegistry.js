// ============================================================================
// UNISOLE AI SCHOOL: EXAM PATTERN TEMPLATE REGISTRY
// Loads src/registry/templates/exam_patterns.json and answers:
//   - which pattern applies to a board / stream / assessment
//   - how that pattern scores (positive, negative, step marking)
//   - indicative percentile estimates for competitive practice analytics
// ============================================================================

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.resolve(__dirname, '../registry/templates/exam_patterns.json');

let cache = null;

function loadRegistry(forceReload = false) {
  if (cache && !forceReload) return cache;
  const raw = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed.patterns !== 'object') {
    throw new Error('exam_patterns.json is missing a "patterns" object');
  }
  cache = parsed;
  return cache;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function getPattern(patternId) {
  const reg = loadRegistry();
  return reg.patterns[normalizeKey(patternId)] || null;
}

function listPatterns({ mode } = {}) {
  const reg = loadRegistry();
  const all = Object.values(reg.patterns);
  if (!mode) return all;
  const m = normalizeKey(mode);
  return all.filter(p => p.mode === m);
}

function getPatternForContext({ mode, board, stream } = {}) {
  const reg = loadRegistry();
  const m = normalizeKey(mode);
  if (m === 'COMPETITIVE') {
    const id = reg.streamPatternMap[normalizeKey(stream)];
    return id ? reg.patterns[id] || null : null;
  }
  if (m === 'BOARD') {
    const id = reg.boardPatternMap[normalizeKey(board)];
    return id ? reg.patterns[id] || null : null;
  }
  return null;
}

// Maps free-form assessment.board strings ("CBSE", "JEE_MAIN", "NEET", "HP Board") to a pattern.
function resolvePatternForBoardString(boardString) {
  const reg = loadRegistry();
  const key = normalizeKey(boardString);
  if (!key) return null;
  if (reg.assessmentBoardAliases[key]) {
    return reg.patterns[reg.assessmentBoardAliases[key]] || null;
  }
  // Fuzzy fallback for compound strings like "CBSE_CLASS_12_PHYSICS" or "JEE MAIN 2024"
  if (key.includes('NEET')) return reg.patterns.NEET_UG || null;
  if (key.includes('JEE')) return reg.patterns.JEE_MAIN || null;
  if (key.includes('ICSE')) return reg.patterns.ICSE_BOARD || null;
  if (key.includes('HP') || key.includes('HPBOSE')) return reg.patterns.HP_BOARD || null;
  if (key.includes('CBSE')) return reg.patterns.CBSE_BOARD || null;
  return null;
}

function resolvePatternForAssessment(assessment) {
  if (!assessment) return null;
  if (assessment.examPatternId) {
    const explicit = getPattern(assessment.examPatternId);
    if (explicit) return explicit;
  }
  return resolvePatternForBoardString(assessment.board || assessment.curriculum_board || assessment.targetExam || '');
}

// Returns the absolute negative penalty for a wrong answer, or null when unknown.
function getNegativePenalty(pattern) {
  if (!pattern || !pattern.marking) return null;
  return Math.abs(Number(pattern.marking.incorrect) || 0);
}

// Boards that a piece of content tagged with `board` should also be served to.
function expandBoardTargets(boards) {
  const reg = loadRegistry();
  const aliases = reg.boardContentAliases || {};
  const out = new Set();
  (boards || []).forEach(b => {
    const k = normalizeKey(b);
    out.add(k);
    (aliases[k] || []).forEach(a => out.add(normalizeKey(a)));
  });
  return Array.from(out);
}

// Linear interpolation over the pattern's indicative rank curve.
function estimatePercentile(patternOrId, scorePercent) {
  const pattern = typeof patternOrId === 'string' ? getPattern(patternOrId) : patternOrId;
  if (!pattern || !pattern.rankModel || !Array.isArray(pattern.rankModel.curve)) return null;
  const curve = pattern.rankModel.curve.slice().sort((a, b) => a[0] - b[0]);
  const x = Math.max(0, Math.min(100, Number(scorePercent) || 0));
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (x <= x1) {
      if (x1 === x0) return y1;
      return Number((y0 + ((x - x0) * (y1 - y0)) / (x1 - x0)).toFixed(2));
    }
  }
  return curve[curve.length - 1][1];
}

function estimateRank(patternOrId, percentile) {
  const pattern = typeof patternOrId === 'string' ? getPattern(patternOrId) : patternOrId;
  if (!pattern || !pattern.rankModel || percentile === null || percentile === undefined) return null;
  const pool = Number(pattern.rankModel.approxCandidatePool) || 0;
  if (!pool) return null;
  return Math.max(1, Math.round(pool * (1 - Number(percentile) / 100)));
}

module.exports = {
  loadRegistry,
  getPattern,
  listPatterns,
  getPatternForContext,
  resolvePatternForBoardString,
  resolvePatternForAssessment,
  getNegativePenalty,
  expandBoardTargets,
  estimatePercentile,
  estimateRank,
  normalizeKey
};
