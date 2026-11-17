// ============================================================================
// ROUTES: Live voice teacher on the Study Board
//   POST /api/tutor/live-session
//        { studentId | teacherSubjectKey, subjectKey, chapterId, topicId,
//          topicTitle, language: en|hinglish|hi, voice: female|male, outline }
//        -> { wsUrl, setup }  (the browser opens wsUrl and sends { setup })
// ============================================================================
const express = require('express');
const router = express.Router();
const tutor = require('../services/tutorService');

router.post('/live-session', async (req, res) => {
  try {
    const out = await tutor.liveSession(req.body || {});
    res.setHeader('Cache-Control', 'no-store');
    res.json(Object.assign({ success: true }, out));
  } catch (err) {
    const status = err.status || 502;
    if (!err.status) console.error('[TUTOR LIVE ERROR]', err);
    // 503 (AI not configured) and 4xx are safe, useful messages; anything else is hidden.
    res.status(status).json({ success: false, error: status < 500 || status === 503 ? err.message : 'The voice teacher could not start. Please try again.' });
  }
});

module.exports = router;
