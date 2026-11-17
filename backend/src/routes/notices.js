// ============================================================================
// ROUTES: Notice board & homework
//   POST   /api/notices                    { author:{role:'TEACHER'|'PRINCIPAL',name,id,subjectKey,subjectName}, type:'NOTICE'|'HOMEWORK', title, body, section|'ALL', dueDate }
//   GET    /api/notices?studentId=         Notices for the student's class + school-wide
//   GET    /api/notices?teacherSubjectKey= Teacher's own notices + principal notices for their classes
//   GET    /api/notices?role=principal     Everything
//   POST   /api/notices/:id/done           { studentId, done }
//   DELETE /api/notices/:id?teacherSubjectKey=|role=principal
// ============================================================================
const express = require('express');
const router = express.Router();
const desk = require('../services/classDeskService');
const handle = require('./_handle');

router.post('/', handle('NOTICES', req => ({ notice: desk.createNotice(req.body || {}) })));
router.get('/', handle('NOTICES', req => desk.listNotices(req.query)));
router.post('/:id/done', handle('NOTICES', req => ({ notice: desk.markNoticeDone(req.params.id, req.body || {}) })));
router.delete('/:id', handle('NOTICES', req => desk.removeNotice(req.params.id, req.query)));

module.exports = router;
