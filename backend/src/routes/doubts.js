// ============================================================================
// ROUTES: Ask-teacher doubts
//   POST /api/doubts                      Student asks { studentId, subjectKey, text, imageData?, context? }
//   GET  /api/doubts?studentId=           Student's own doubts
//   GET  /api/doubts?teacherSubjectKey=   Teacher inbox (own subject + classes), optional &status=
//   POST /api/doubts/:id/reply            { teacherSubjectKey, teacherName, text } or { studentId, text }
//   POST /api/doubts/:id/resolve          { studentId, reopen? }
// ============================================================================
const express = require('express');
const router = express.Router();
const desk = require('../services/classDeskService');
const handle = require('./_handle');

router.post('/', handle('DOUBTS', req => ({ doubt: desk.createDoubt(req.body || {}) })));
router.get('/', handle('DOUBTS', req => desk.listDoubts(req.query)));
router.post('/:id/reply', handle('DOUBTS', req => ({ doubt: desk.replyDoubt(req.params.id, req.body || {}) })));
router.post('/:id/resolve', handle('DOUBTS', req => ({ doubt: desk.resolveDoubt(req.params.id, req.body || {}) })));

module.exports = router;
