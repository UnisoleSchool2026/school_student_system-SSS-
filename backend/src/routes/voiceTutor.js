const express = require('express');
const router = express.Router();
const { inMemoryStore } = require('../config/database');
const {
  generateHinglishAudioBrief,
  answerStudentInterruption,
  synthesizeNeuralAudio,
  generateSmartboardTeachingPlan,
  NEURAL_VOICES
} = require('../services/aiVoiceTutorService');

const { GoogleGenAI } = require('@google/genai');

/**
 * POST & GET /api/voice-tutor/gemini-live-token
 * Issues ephemeral auth token for direct browser WebSocket connection to Gemini Multimodal Live API
 */
router.all('/gemini-live-token', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on server'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const token = await ai.authTokens.create({
      config: {
        uses: 5,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 120 * 1000).toISOString()
      }
    });

    const rawModel = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-latest';
    const model = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.name)}`;

    res.json({
      success: true,
      token: token.name,
      model,
      wsUrl
    });
  } catch (err) {
    console.error('[GEMINI LIVE TOKEN ERROR]', err);
    res.status(502).json({
      success: false,
      error: err.message || 'Unable to create Gemini Live token'
    });
  }
});

/**
 * GET /api/voice-tutor/audio
 * Streams ultra-realistic human neural MP3 audio
 * Query params: ?text=...&voice=swara
 */
router.get('/audio', async (req, res) => {
  try {
    const text = (req.query.text || '').trim();
    const voice = req.query.voice || 'swara';

    if (!text) {
      return res.status(400).json({ success: false, error: 'text query parameter is required' });
    }

    const { buffer, voice: voiceUsed, fromCache } = await synthesizeNeuralAudio({
      text,
      voiceKey: voice
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('X-Voice-Used', voiceUsed);
    res.setHeader('X-From-Cache', fromCache ? 'true' : 'false');
    res.send(buffer);
  } catch (err) {
    console.error('[VOICE TUTOR AUDIO ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/voice-tutor/synthesize
 * Body: { text, voice }
 * Returns base64 data-uri for direct browser playback
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text = '', voice = 'swara' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'text is required' });
    }

    const { buffer, voice: voiceUsed, fromCache } = await synthesizeNeuralAudio({
      text: text.trim(),
      voiceKey: voice
    });

    res.json({
      success: true,
      voice: voiceUsed,
      fromCache,
      mimeType: 'audio/mpeg',
      audioDataUri: `data:audio/mpeg;base64,${buffer.toString('base64')}`
    });
  } catch (err) {
    console.error('[VOICE TUTOR SYNTHESIZE ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/voice-tutor/explain
 * Request body: { questionId, questionText, solutionText, chapterName, topic, voice }
 * Returns spoken question, Hinglish audio brief, and human neural audio URL
 */
router.post('/explain', async (req, res) => {
  try {
    const {
      questionId = 'q_active',
      questionText = '',
      solutionText = '',
      chapterName = '',
      topic = '',
      voice = 'swara'
    } = req.body;

    // Look up question in memory store if questionText not directly supplied
    let qText = questionText;
    let sText = solutionText;
    let ch = chapterName;
    let top = topic;

    if (!qText && questionId) {
      const allBanks = Object.values(inMemoryStore.subjectBanks || {});
      for (const bank of allBanks) {
        if (Array.isArray(bank)) {
          const match = bank.find(item => item.id === questionId);
          if (match) {
            qText = match.question_latex || match.questionText || '';
            sText = match.solution_latex || '';
            ch = match.chapter_name || match.chapter || '';
            top = match.topic || match.subtopic || '';
            break;
          }
        }
      }
    }

    const brief = await generateHinglishAudioBrief({
      questionId,
      questionText: qText,
      solutionText: sText,
      chapterName: ch,
      topic: top
    });

    const audioUrl = `/api/voice-tutor/audio?text=${encodeURIComponent(brief.hinglishBrief)}&voice=${encodeURIComponent(voice)}`;
    const questionAudioUrl = `/api/voice-tutor/audio?text=${encodeURIComponent(brief.cleanSpokenQuestion)}&voice=neerja`;

    const payload = {
      ...brief,
      audioUrl,
      questionAudioUrl,
      availableVoices: Object.keys(NEURAL_VOICES)
    };

    res.json({
      success: true,
      ...payload,
      data: payload
    });
  } catch (err) {
    console.error('[VOICE TUTOR ROUTE ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/voice-tutor/solve-and-sync
 * Solves the current question using LLM and creates synchronized payload for Smartboard + Voice
 * Request body: { questionId, questionText, solutionText, chapterName, topic, options, correctAnswer, marks, voice }
 */
router.post('/solve-and-sync', async (req, res) => {
  try {
    const {
      questionId = 'q_active',
      questionText = '',
      solutionText = '',
      chapterName = '',
      topic = '',
      options = [],
      correctAnswer = '',
      marks = 3,
      subject = '',
      subjectKey = '',
      facultyName = '',
      voice = 'swara'
    } = req.body;

    // Look up question in memory store if questionText not directly supplied
    let qText = questionText;
    let sText = solutionText;
    let ch = chapterName;
    let top = topic;
    let opts = options;
    let ans = correctAnswer;
    let m = marks;
    let subj = subject || subjectKey;

    if (!qText && questionId) {
      const allBanks = Object.values(inMemoryStore.subjectBanks || {});
      for (const bank of allBanks) {
        if (Array.isArray(bank)) {
          const match = bank.find(item => item.id === questionId);
          if (match) {
            qText = match.question_latex || match.questionText || '';
            sText = match.solution_latex || '';
            ch = match.chapter_name || match.chapter || '';
            top = match.topic || match.subtopic || '';
            opts = match.options_latex || opts;
            ans = match.correct_answer_latex || match.correct_answer || ans;
            m = match.marks_weightage || m;
            if (!subj) subj = match.subject || match.subjectKey;
            break;
          }
        }
      }
    }

    const plan = await generateSmartboardTeachingPlan({
      questionId,
      questionText: qText,
      solutionText: sText,
      chapterName: ch,
      topic: top,
      options: opts,
      correctAnswer: ans,
      marks: m,
      subject: subj,
      subjectKey: subjectKey || subj,
      facultyName
    });

    const audioUrl = `/api/voice-tutor/audio?text=${encodeURIComponent(plan.hinglishBrief)}&voice=${encodeURIComponent(voice)}`;

    const payload = {
      success: true,
      questionId,
      smartboardPlan: {
        questionHeader: {
          title: qText,
          chapter: ch,
          marks: m
        },
        diagram: plan.diagram,
        solution: plan.solution,
        examTip: plan.examTip
      },
      hinglishBrief: plan.hinglishBrief,
      audioUrl,
      source: plan.source
    };

    res.json(payload);
  } catch (err) {
    console.error('[VOICE TUTOR SOLVE-AND-SYNC ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/voice-tutor/interrupt
 * Handles student voice doubt / interruption while question is playing
 * Request body: { questionText, solutionText, studentDoubt, conversationHistory, voice }
 */
router.post('/interrupt', async (req, res) => {
  try {
    const {
      questionText = '',
      solutionText = '',
      studentDoubt = '',
      conversationHistory = [],
      voice = 'swara'
    } = req.body;

    const answer = await answerStudentInterruption({
      questionText,
      solutionText,
      studentDoubt,
      conversationHistory
    });

    const audioUrl = `/api/voice-tutor/audio?text=${encodeURIComponent(answer.answerHinglish)}&voice=${encodeURIComponent(voice)}`;

    const payload = {
      ...answer,
      audioUrl
    };

    res.json({
      success: true,
      ...payload,
      data: payload
    });
  } catch (err) {
    console.error('[VOICE TUTOR INTERRUPT ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const fs = require('fs');
const path = require('path');
const whiteboardTelemetryBuffer = [];
const telemetryLogPath = path.join(__dirname, '..', '..', 'logs', 'whiteboard_telemetry.log');

try {
  const logDir = path.dirname(telemetryLogPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
} catch (e) {}

/**
 * POST /api/voice-tutor/whiteboard-logs
 * Ingests live telemetry, actions, and errors from student whiteboard instances
 */
router.post('/whiteboard-logs', (req, res) => {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      event: req.body?.event || 'UNKNOWN_ACTION',
      data: req.body?.data || {},
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
    };

    whiteboardTelemetryBuffer.push(entry);
    if (whiteboardTelemetryBuffer.length > 200) whiteboardTelemetryBuffer.shift();

    const line = JSON.stringify(entry) + '\n';
    try {
      fs.appendFileSync(telemetryLogPath, line, 'utf8');
    } catch (fsErr) {
      // In read-only serverless environments, in-memory buffer continues
    }

    console.log(`[WHITEBOARD TELEMETRY] ${entry.timestamp} | ${entry.event} | ${JSON.stringify(entry.data).slice(0, 160)}`);
    res.json({ success: true, logged: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/voice-tutor/whiteboard-logs
 * Retrieves the latest recorded actions and errors
 */
router.get('/whiteboard-logs', (req, res) => {
  res.json({
    success: true,
    totalLogs: whiteboardTelemetryBuffer.length,
    logs: whiteboardTelemetryBuffer.slice(-100)
  });
});

module.exports = router;


