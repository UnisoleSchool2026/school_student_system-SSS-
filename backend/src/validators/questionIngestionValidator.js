// ============================================================================
// QUESTION INGESTION REQUEST VALIDATOR (Zod Schema Validation)
// Boundary enforcement for Mode, Track, Discipline & Ingestion Payloads
// ============================================================================

const { z } = require('zod');
const examPatterns = require('../services/examPatternRegistry');
const tenants = require('../services/tenantConfigService');

const VALID_MODES = ['BOARD', 'COMPETITIVE'];
const VALID_BOARD_TRACKS = ['CBSE', 'HP_BOARD', 'ICSE'];
const VALID_COMPETITIVE_TRACKS = ['JEE', 'NEET', 'JEE_MAIN', 'JEE_ADVANCED'];

const IngestionRequestSchema = z.object({
  mode: z.enum(['BOARD', 'COMPETITIVE'], {
    errorMap: () => ({ message: 'Mode must be strictly either "BOARD" or "COMPETITIVE".' })
  }),
  track: z.string({
    required_error: 'Track (board or stream) is required.'
  }).min(1, 'Track cannot be empty.'),
  subject: z.string().min(1, 'Subject is required.'),
  classLevel: z.union([z.string(), z.number()]).optional(),
  grade: z.union([z.string(), z.number()]).optional(),
  sourceType: z.enum(['text', 'image', 'pdf']).optional(),
  payload: z.string().optional(),
  rawText: z.string().optional(),
  mediaData: z.string().optional(),
  // Several photos of the same paper (data URLs), read together.
  mediaList: z.array(z.string()).max(6, 'Upload at most 6 photos at a time.').optional(),
  mimeType: z.string().optional(),
  category: z.string().optional(),
  paperMeta: z.object({
    year: z.union([z.string(), z.number()]).optional(),
    paperName: z.string().optional(),
    totalMarks: z.union([z.string(), z.number()]).optional()
  }).optional(),
  teacher: z.any().optional(),
  structuredQuestion: z.any().optional(),
  questions: z.array(z.any()).optional()
}).superRefine((data, ctx) => {
  const normTrack = examPatterns.normalizeKey(data.track);
  if (data.mode === 'BOARD') {
    if (!VALID_BOARD_TRACKS.includes(normTrack)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['track'],
        message: `Invalid board track "${data.track}". Supported board tracks: ${VALID_BOARD_TRACKS.join(', ')}.`
      });
    }
  } else if (data.mode === 'COMPETITIVE') {
    if (!VALID_COMPETITIVE_TRACKS.includes(normTrack)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['track'],
        message: `Invalid competitive track "${data.track}". Supported competitive tracks: JEE, NEET.`
      });
    }
  }

  // Require either text or media payload
  const hasText = Boolean((data.payload && data.payload.trim()) || (data.rawText && data.rawText.trim()));
  const hasMedia = Boolean(data.mediaData && data.mediaData.trim());
  const hasStructured = Boolean(data.structuredQuestion || (Array.isArray(data.questions) && data.questions.length > 0));

  if (!hasText && !hasMedia && !hasStructured) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['payload'],
      message: 'Question payload missing: provide rawText, payload, mediaData, or structuredQuestion.'
    });
  }
});

/**
 * Validates request input body and returns normalized data or throws 400 error
 */
function validateIngestionPayload(body = {}) {
  // Support legacy parameter aliases. Optional fields sent as null (e.g. mediaData in
  // "Paste Text" mode) are treated as not sent, instead of failing validation.
  const cleaned = {};
  Object.keys(body || {}).forEach(k => { if (body[k] !== null) cleaned[k] = body[k]; });
  body = cleaned;
  const adapted = {
    ...body,
    mode: body.mode ? String(body.mode).trim().toUpperCase() : undefined,
    track: body.track ? examPatterns.normalizeKey(body.track) : (body.board || body.stream ? examPatterns.normalizeKey(body.board || body.stream) : undefined),
    subject: body.subject || body.targetSubject || body.targetSubjectKey || 'Physics',
    grade: body.classLevel || body.grade || '12',
    sourceType: body.sourceType || body.mode_source || ((body.mediaData || (Array.isArray(body.mediaList) && body.mediaList.length)) ? (body.mimeType?.includes('pdf') ? 'pdf' : 'image') : 'text')
  };

  const result = IngestionRequestSchema.safeParse(adapted);
  if (!result.success) {
    const issue = result.error.issues[0];
    const err = new Error(issue.message);
    err.status = 400;
    err.code = 'INVALID_INPUT';
    err.details = result.error.issues;
    throw err;
  }

  return {
    ...result.data,
    track: examPatterns.normalizeKey(result.data.track),
    grade: String(result.data.grade || result.data.classLevel || '12')
  };
}

/**
 * Enforces tenant-level mode/track enablement and user authorization
 */
function authorizeIngestionContext({ tenant, user, mode, track }) {
  if (!tenant) {
    throw Object.assign(new Error('Tenant context missing from request.'), { status: 400, code: 'TENANT_REQUIRED' });
  }

  // 1. Role authorization: Teacher, Faculty, or Admin allowed
  const role = (user?.role || (user?.subjectKey || user?.department ? 'TEACHER' : '')).toUpperCase();
  if (role !== 'TEACHER' && role !== 'FACULTY' && role !== 'ADMIN') {
    throw Object.assign(new Error('Access Denied: Only authenticated Faculty or Admin members can inject questions.'), {
      status: 403,
      code: 'FORBIDDEN_ROLE'
    });
  }

  // 2. Tenant mode enablement check
  const activeModes = Array.isArray(tenant.activeModes) ? tenant.activeModes : [];
  if (!activeModes.includes(mode)) {
    throw Object.assign(
      new Error(`Mode "${mode}" is disabled for school "${tenant.name}". Enabled modes: ${activeModes.join(', ')}.`),
      { status: 403, code: 'MODE_DISABLED' }
    );
  }

  // 3. Tenant track enablement check
  const normTrack = examPatterns.normalizeKey(track);
  if (mode === 'BOARD') {
    const enabledBoards = tenant.boardConfig?.enabledBoards || [];
    if (!enabledBoards.includes(normTrack)) {
      throw Object.assign(
        new Error(`Board "${normTrack}" is not enabled for school "${tenant.name}". Enabled boards: ${enabledBoards.join(', ')}.`),
        { status: 403, code: 'BOARD_DISABLED' }
      );
    }
  } else if (mode === 'COMPETITIVE') {
    const enabledStreams = tenant.competitiveConfig?.enabledStreams || [];
    const streamKey = normTrack.startsWith('JEE') ? 'JEE' : normTrack;
    if (!enabledStreams.includes(streamKey)) {
      throw Object.assign(
        new Error(`Stream "${streamKey}" is not enabled for school "${tenant.name}". Enabled streams: ${enabledStreams.join(', ')}.`),
        { status: 403, code: 'STREAM_DISABLED' }
      );
    }
  }

  return true;
}

module.exports = {
  validateIngestionPayload,
  authorizeIngestionContext,
  VALID_MODES,
  VALID_BOARD_TRACKS,
  VALID_COMPETITIVE_TRACKS
};

