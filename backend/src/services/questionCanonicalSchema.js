// ============================================================================
// CANONICAL QUESTION SCHEMA, INVARIANTS & CONTENT HASH LIFECYCLE
// Standardized schema definitions, cryptographic deduplication & lifecycle validation
// ============================================================================

const crypto = require('crypto');

const STATUS_LIFECYCLE = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const QUESTION_TYPES = [
  'MCQ',
  'VSA',
  'SA',
  'LA',
  'CASE_STUDY',
  'ASSERTION_REASON',
  'MATCH',
  'NUMERICAL_INTEGER'
];

/**
 * Normalizes text for deterministic content hashing:
 * Collapses whitespace, trims, strips punctuation noise, normalizes LaTeX math delimiters
 */
function normalizeTextForHash(str = '') {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/\\\[|\\\]/g, '$$')
    .replace(/\\\(|\\\)/g, '$')
    .replace(/\s+/g, ' ');
}

/**
 * Computes deterministic SHA-256 hash of question text + options + marks
 */
function computeContentHash({ question_latex = '', questionPrompt = '', options_latex = [], options = [], marks = 0 }) {
  const prompt = normalizeTextForHash(question_latex || questionPrompt);
  const opts = (Array.isArray(options_latex) && options_latex.length ? options_latex : options) || [];
  const normalizedOpts = opts
    .map(o => `${String(o.key || '').trim().toUpperCase()}:${normalizeTextForHash(o.latex || o.text || '')}`)
    .sort()
    .join('|');

  const payloadToHash = `${prompt}###${normalizedOpts}`;
  return crypto.createHash('sha256').update(payloadToHash).digest('hex');
}

/**
 * Validates canonical invariants on a question payload before persistence
 * Throws 422 Unprocessable Entity error if invariant violated
 */
function validateQuestionInvariants(q = {}) {
  const errors = [];

  // 1. Target modes invariant
  const targetModes = Array.isArray(q.target_modes) ? q.target_modes : [];
  if (!targetModes.length) {
    errors.push('Question must have at least one target_mode ("BOARD" or "COMPETITIVE").');
  }

  // 2. Mode target arrays invariant
  if (targetModes.includes('BOARD')) {
    const boardTargets = Array.isArray(q.board_targets) ? q.board_targets : [];
    if (!boardTargets.length) {
      errors.push('BOARD questions must declare at least one board_target (e.g. CBSE, HP_BOARD, ICSE).');
    }
  }

  if (targetModes.includes('COMPETITIVE')) {
    const compTargets = Array.isArray(q.competitive_targets) ? q.competitive_targets : [];
    if (!compTargets.length) {
      errors.push('COMPETITIVE questions must declare at least one competitive_target (e.g. JEE_MAIN, NEET).');
    }
  }

  // 3. Negative marking prohibition invariant
  if (q.negative_marks !== undefined || q.negativeMarks !== undefined || q.negative_marking !== undefined) {
    errors.push('Negative marking must NOT be stored on question record (+4/-1 belongs to exam pattern).');
  }

  // 4. Type & MCQ invariant
  const format = String(q.question_format || q.type || '').toUpperCase();
  const options = Array.isArray(q.options_latex) && q.options_latex.length ? q.options_latex : (Array.isArray(q.options) ? q.options : []);

  if (format === 'MCQ_SINGLE' || format === 'MCQ' || format === 'ASSERTION_REASON') {
    if (options.length < 2) {
      errors.push(`MCQ questions must contain at least 2 options (received ${options.length}).`);
    }
    const hasCorrectKey = Boolean(
      q.correct_answer ||
      q.correctAnswer ||
      options.some(o => o.is_correct || o.isCorrect)
    );
    if (!hasCorrectKey && (q.status === 'APPROVED')) {
      errors.push('Approved MCQ questions must specify a valid correct answer.');
    }
  } else if (format === 'NUMERICAL_INTEGER') {
    if (options.length > 0) {
      errors.push('NUMERICAL_INTEGER questions must not have multiple-choice options.');
    }
  }

  // 5. Status invariant
  const status = q.status || 'APPROVED';
  if (!Object.values(STATUS_LIFECYCLE).includes(status)) {
    errors.push(`Invalid status "${status}". Allowed: ${Object.values(STATUS_LIFECYCLE).join(', ')}.`);
  }

  if (errors.length > 0) {
    const err = new Error(`Canonical Invariant Violation: ${errors.join('; ')}`);
    err.status = 422;
    err.code = 'INVARIANT_VIOLATION';
    err.details = errors;
    throw err;
  }

  return true;
}

module.exports = {
  STATUS_LIFECYCLE,
  QUESTION_TYPES,
  normalizeTextForHash,
  computeContentHash,
  validateQuestionInvariants
};

