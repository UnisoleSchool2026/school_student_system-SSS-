// ============================================================================
// ROUTES: Teacher-created DPPs
//   POST   /api/dpp                         Teacher creates + assigns a DPP
//   GET    /api/dpp?teacherSubjectKey=&section=   Teacher's DPPs with result summary
//   GET    /api/dpp/assigned?studentId=      Student's assigned DPPs
//   GET    /api/dpp/:id?teacherSubjectKey=   Teacher: questions + full results
//   GET    /api/dpp/:id?studentId=           Student: questions (answers after submit)
//   POST   /api/dpp/:id/submit               Student submits answers
//   DELETE /api/dpp/:id?teacherSubjectKey=   Teacher removes a DPP
// ============================================================================

const express = require('express');
const router = express.Router();
const dpp = require('../services/teacherDppService');

function handle(res, fn) {
  try {
    res.json(Object.assign({ success: true }, fn()));
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('[TEACHER DPP ERROR]', err);
    res.status(status).json({ success: false, error: err.message || 'DPP request failed.' });
  }
}

router.post('/', (req, res) => handle(res, () => ({ dpp: dpp.create(req.body || {}) })));

router.get('/', (req, res) => handle(res, () => ({ dpps: dpp.listForTeacher(String(req.query.teacherSubjectKey || '').toUpperCase(), req.query.section) })));

router.get('/assigned', (req, res) => handle(res, () => ({ dpps: dpp.listForStudent(req.query.studentId) })));

router.get('/:id', (req, res) => handle(res, () => {
  if (req.query.studentId) return { dpp: dpp.studentDetail(req.params.id, req.query.studentId) };
  return { dpp: dpp.teacherDetail(req.params.id, String(req.query.teacherSubjectKey || '').toUpperCase()) };
}));

router.post('/:id/submit', (req, res) => handle(res, () => ({ dpp: dpp.submit(req.params.id, req.body || {}) })));

router.delete('/:id', (req, res) => handle(res, () => dpp.remove(req.params.id, String(req.query.teacherSubjectKey || '').toUpperCase())));

module.exports = router;
