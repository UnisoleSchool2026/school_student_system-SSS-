// ============================================================================
// ROUTES: Study Board (classroom whiteboard)
//   GET  /api/study-board/catalog?studentId=|teacherSubjectKey=
//   GET  /api/study-board/lesson?subjectKey=&chapterId=&topicId=&studentId=|teacherSubjectKey=
//   GET  /api/study-board/practice?subjectKey=&chapterId=&topicId=&exclude=id,id
//   POST /api/study-board/practice/hint   { questionId, level, studentId|teacherSubjectKey }
//   POST /api/study-board/practice/check  { questionId, answer, attempt, reveal, studentId|teacherSubjectKey }
//   POST /api/study-board/doubt           { text, imageData, subjectKey, studentId|teacherSubjectKey }
//   POST /api/study-board/progress        { studentId, subjectKey, chapterId, topicId, understood }
// ============================================================================
const express = require('express');
const router = express.Router();
const board = require('../services/studyBoardService');
const handle = require('./_handle');

router.get('/catalog', handle('STUDY BOARD', req => board.catalog(req.query)));
router.get('/lesson', handle('STUDY BOARD', async req => ({ lesson: await board.lesson(req.query) })));
router.get('/practice', handle('STUDY BOARD', req => board.practiceNext(req.query)));
router.post('/practice/hint', handle('STUDY BOARD', req => board.hint(req.body || {})));
router.post('/practice/check', handle('STUDY BOARD', req => board.check(req.body || {})));
router.post('/doubt', handle('STUDY BOARD', async req => ({ result: await board.doubt(req.body || {}) })));
router.post('/progress', handle('STUDY BOARD', req => board.setProgress(req.body || {})));

module.exports = router;
