// ============================================================================
// ROUTES: Mistake notebook (student)
//   GET  /api/mistakes?studentId=      Wrong / skipped questions from tests, DPPs and Study Board practice
//   POST /api/mistakes/retry           { studentId, key, answer } or { studentId, key, reveal:true }
//   POST /api/mistakes/status          { studentId, key, status:'MASTERED'|'OPEN' }
// ============================================================================
const express = require('express');
const router = express.Router();
const desk = require('../services/classDeskService');
const handle = require('./_handle');

router.get('/', handle('MISTAKES', req => desk.listMistakes(req.query.studentId)));
router.post('/retry', handle('MISTAKES', req => ({ item: desk.retryMistake(req.body || {}) })));
router.post('/status', handle('MISTAKES', req => ({ item: desk.setMistakeStatus(req.body || {}) })));

module.exports = router;
