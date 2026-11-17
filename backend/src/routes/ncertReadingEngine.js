// ============================================================================
// ROUTES: NCERT Reading Engine REST Endpoints
// Reference: https://github.com/moktagithub005/Ncert_reading_engine
// Complete API implementation matching OpenAPI spec:
//   POST /api/v1/admin/auth/login
//   POST /api/v1/admin/auth/refresh
//   GET  /api/v1/admin/auth/me
//   POST /api/v1/admin/books/upload
//   GET  /api/v1/admin/books/recent
//   GET  /api/v1/admin/books
//   GET  /api/v1/admin/books/:bookId/tree
//   GET  /api/v1/admin/jobs/:jobId
//   GET  /api/v1/admin/jobs/:jobId/report
//   GET  /api/v1/admin/topics/:topicId
//   PATCH /api/v1/admin/topics/:topicId
//   PATCH /api/v1/admin/chapters/:chapterId
//   GET  /api/v1/public/content/classes/:class_no/subjects/:subject/books
// ============================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ncertService = require('../services/ncertReadingEngineService');
const aiStudyService = require('../services/ncertAiStudyService');

// Use memory storage for uploaded PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Middleware to extract/verify token
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    req.user = ncertService.verifyToken(authHeader);
    return next();
  } catch (err) {
    return res.status(401).json({ detail: 'Authentication required' });
  }
}

// ----------------------------------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------------------------------
router.post('/admin/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = ncertService.login(email, password);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 400).json({ detail: err.message || 'Login failed' });
  }
});

router.post('/admin/auth/refresh', (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    const user = ncertService.verifyToken(refresh_token);
    const result = ncertService.login(user.email, 'Admin@12345678');
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid refresh token' });
  }
});

router.get('/admin/auth/me', requireAuth, (req, res) => {
  return res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  });
});

// ----------------------------------------------------------------------------
// BOOK UPLOAD & INGESTION
// ----------------------------------------------------------------------------
router.post('/admin/books/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(422).json({ detail: 'Choose a PDF file first.' });
    }

    const {
      class_no,
      subject,
      language = 'en',
      edition = '2026',
      reprocess
    } = req.body;

    const result = await ncertService.uploadBook({
      fileBuffer: file.buffer,
      originalName: file.originalname,
      class_no: parseInt(class_no, 10) || 10,
      subject: subject || 'Science',
      language,
      edition,
      reprocess: reprocess === 'true' || reprocess === true
    });

    return res.status(202).json(result);
  } catch (err) {
    console.error('[NCERT UPLOAD ROUTE ERROR]', err);
    return res.status(err.status || 500).json({ detail: err.message });
  }
});

// ----------------------------------------------------------------------------
// JOBS & MONITORING
// ----------------------------------------------------------------------------
router.get('/admin/jobs/:jobId', (req, res) => {
  try {
    const job = ncertService.getJob(req.params.jobId);
    return res.json(job);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

router.get('/admin/jobs/:jobId/report', (req, res) => {
  try {
    const report = ncertService.getJobReport(req.params.jobId);
    return res.json(report);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

// ----------------------------------------------------------------------------
// BOOKS & CHAPTER / TOPIC TREE
// ----------------------------------------------------------------------------
router.get('/admin/books/recent', (req, res) => {
  try {
    const recent = ncertService.getRecentBook();
    return res.json(recent);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

router.get('/admin/books', (req, res) => {
  try {
    const books = ncertService.listBooks();
    return res.json(books);
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

router.get('/admin/books/:bookId/tree', (req, res) => {
  try {
    const includeFlags = req.query.include_flags === 'true';
    const tree = ncertService.getBookTree(req.params.bookId, includeFlags);
    return res.json(tree);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

// ----------------------------------------------------------------------------
// TOPIC & CHAPTER INSPECTION & EDITING
// ----------------------------------------------------------------------------
router.get('/admin/topics/:topicId', (req, res) => {
  try {
    const topic = ncertService.getTopic(req.params.topicId);
    return res.json(topic);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

// ----------------------------------------------------------------------------
// TOPIC AI STUDY AIDS: Short Notes, Important Bullets, and Quick Quiz
// Features Two-Tier Persistent Disk & RAM Caching for Zero-Token Replay
// ----------------------------------------------------------------------------
router.get('/admin/topics/:topicId/ai-study', async (req, res) => {
  try {
    const topic = ncertService.getTopic(req.params.topicId);
    const forceRefresh = req.query.force_refresh === 'true' || req.query.refresh === 'true';
    const studyAid = await aiStudyService.getTopicAiStudy(topic, forceRefresh);
    res.set('X-Cache', studyAid.cached ? 'HIT' : 'MISS');
    res.set('X-Tokens-Used', studyAid.cached ? '0' : String(studyAid.token_usage?.total_tokens || 0));
    return res.json(studyAid);
  } catch (err) {
    return res.status(err.status || 500).json({ detail: err.message });
  }
});

router.patch('/admin/topics/:topicId', requireAuth, (req, res) => {
  try {
    const updated = ncertService.updateTopic(req.params.topicId, req.body);
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

router.patch('/admin/chapters/:chapterId', requireAuth, (req, res) => {
  try {
    const updated = ncertService.updateChapter(req.params.chapterId, req.body);
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 404).json({ detail: err.message });
  }
});

// ----------------------------------------------------------------------------
// PUBLIC CONTENT DELIVERY API
// ----------------------------------------------------------------------------
router.get('/public/content/classes/:class_no/subjects/:subject/books', (req, res) => {
  try {
    const classNo = parseInt(req.params.class_no, 10);
    const subject = req.params.subject.toLowerCase();
    const books = ncertService.listBooks().filter(b =>
      b.class_no === classNo && b.subject.toLowerCase().includes(subject)
    );
    res.set('Cache-Control', 'public, max-age=300');
    return res.json({ success: true, count: books.length, books });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
});

module.exports = router;

