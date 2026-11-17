#!/usr/bin/env node
// ============================================================================
// Offline stand-in for Google Gemini (development and tests only)
// ----------------------------------------------------------------------------
// Start:  node scripts/mock_gemini_server.js            (port 8787, or MOCK_GEMINI_PORT)
// Use:    GEMINI_API_BASE=http://127.0.0.1:8787 GEMINI_API_KEY=test node src/server.js
//
// Serves the parts of the Gemini API this app uses, with fixed, realistic replies:
//   GET  /v1beta/models                         model list (one listed model is "missing" to test fallback)
//   POST /v1beta/models/<model>:generateContent  photo -> questions JSON; tutor prompts -> lesson / answer JSON
//   WS   /ws/...BidiGenerateContent...           Gemini Live: audio + tool calls, honours interruptions
// Every request is appended to MOCK_GEMINI_LOG (default /tmp/mock_gemini_log.jsonl) for test checks.
// ============================================================================
const http = require('http');
const fs = require('fs');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.MOCK_GEMINI_PORT) || 8787;
const LOG = process.env.MOCK_GEMINI_LOG || '/tmp/mock_gemini_log.jsonl';
const MISSING = new Set(['gemini-9.9-flash']); // listed but answers 404, like a retired model

function log(entry) {
  try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ at: new Date().toISOString() }, entry)) + '\n'); } catch (e) { /* ignore */ }
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function reply(res, obj) {
  send(res, 200, { candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(obj) }] }, finishReason: 'STOP' }] });
}

// ---------------------------------------------------------------- replies --
function visionReply(photoCount) {
  return {
    detected_question_count: 3,
    questions: [
      {
        question_number: 1, chapter_name: 'Current Electricity', marks_weightage: 1, difficulty: 'EASY',
        question_latex: 'The SI unit of electrical resistivity is',
        options_latex: [
          { key: 'A', latex: '$\\Omega$', is_correct: false }, { key: 'B', latex: '$\\Omega\\,m$', is_correct: true },
          { key: 'C', latex: '$\\Omega\\,m^{-1}$', is_correct: false }, { key: 'D', latex: '$S\\,m$', is_correct: false }
        ],
        correct_answer_latex: '$\\Omega\\,m$', solution_latex: '$\\rho = RA/l$, so the unit is $\\Omega\\cdot m^2/m = \\Omega\\,m$.'
      },
      {
        question_number: 2, chapter_name: 'Current Electricity', marks_weightage: 3, difficulty: 'MEDIUM',
        question_latex: 'In the circuit shown, find the current through the $4\\,\\Omega$ resistor. The cell has emf $6\\,V$ and negligible internal resistance.',
        options_latex: [], correct_answer_latex: '', solution_latex: '',
        has_figure: true, figure_description: 'Circuit: 6 V cell with a 2 ohm resistor in series and 4 ohm and 4 ohm resistors in parallel',
        figure_image_index: 1, figure_box_2d: [520, 120, 900, 880]
      },
      {
        question_number: 3, chapter_name: 'Current Electricity', marks_weightage: 2, difficulty: 'MEDIUM',
        question_latex: 'State Kirchhoff\'s [unclear] law and write the sign convention used.',
        options_latex: [], correct_answer_latex: '', solution_latex: '',
        source_photo: Math.min(2, photoCount)
      }
    ]
  };
}

// Lesson and answer replies for the AI tutor (kept here so every scenario is in one file).
const tutor = require('./mock_gemini_tutor_replies');

// ------------------------------------------------------------- HTTP server --
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/v1beta/models') {
    log({ kind: 'list' });
    return send(res, 200, {
      models: ['gemini-9.9-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-2.5-flash-preview-tts', 'text-embedding-004']
        .map(n => ({ name: `models/${n}`, supportedGenerationMethods: /embedding/.test(n) ? ['embedContent'] : ['generateContent'] }))
    });
  }
  const m = /^\/v1beta\/models\/([^:]+):generateContent$/.exec(url.pathname);
  if (req.method === 'POST' && m) {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      const model = decodeURIComponent(m[1]);
      let body = {};
      try { body = JSON.parse(raw); } catch (e) { return send(res, 400, { error: { message: 'bad json' } }); }
      const parts = ((body.contents || [])[0] || {}).parts || [];
      const images = parts.filter(p => p.inlineData && /^image\//.test(p.inlineData.mimeType)).length;
      const text = parts.map(p => p.text || '').join('\n') + '\n' + (((body.systemInstruction || {}).parts || [])[0] || {}).text;
      log({ kind: 'generate', model, images, chars: text.length, key: url.searchParams.get('key') ? 'set' : 'missing', textStart: text.slice(0, 160) });
      if (MISSING.has(model)) return send(res, 404, { error: { code: 404, message: `models/${model} is not found for API version v1beta` } });
      if (images) return reply(res, visionReply(images));
      const tutorReply = tutor.forPrompt(text);
      if (tutorReply) return reply(res, tutorReply);
      return reply(res, { questions: [] });
    });
    return undefined;
  }
  return send(res, 404, { error: { message: 'not found' } });
});

// ------------------------------------------------------- Gemini Live (WS) --
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  log({ kind: 'live-connect', path: req.url.slice(0, 120) });
  tutor.liveSession(ws, log);
});

server.listen(PORT, '127.0.0.1', () => console.log(`[MOCK GEMINI] listening on http://127.0.0.1:${PORT}`));
