// ============================================================================
// Live voice teacher for the Study Board (Gemini Live, native audio)
// ----------------------------------------------------------------------------
// The browser talks to Gemini Live directly over a WebSocket, using a
// short-lived token made here (the API key never leaves the server). This
// service builds the whole session setup: the teacher's instructions, the
// language, the voice, and the tools the teacher uses to draw on the board.
//
// The board drives the lesson: it sends one "part" of the lesson at a time
// (what is written on the board and the diagram) and the teacher explains it
// aloud in depth. The student can interrupt at any moment by speaking or
// typing; the teacher answers (drawing a diagram if that helps) and the
// lesson continues from the same place.
// ============================================================================

const { DIAGRAM_GUIDE } = require('./diagramLibrary');
const studyBoard = require('./studyBoardService');

const VOICES = {
  female: process.env.GEMINI_LIVE_VOICE_FEMALE || 'Kore',
  male: process.env.GEMINI_LIVE_VOICE_MALE || 'Charon'
};

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function clip(text, max) {
  return String(text || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').slice(0, max);
}

function liveModel() {
  const raw = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-latest';
  return raw.startsWith('models/') ? raw : `models/${raw}`;
}

function systemInstruction({ language, subjectName, chapterName, topicName, grade, outline, role }) {
  const lang = studyBoard.LANGUAGES[language] || studyBoard.LANGUAGES.hinglish;
  return `You are a much-loved Indian school teacher, teaching ${role === 'teacher' ? 'a whole class from the classroom board' : 'one student'} live, by voice, next to a whiteboard that both of you can see.
Subject: ${subjectName}. ${grade ? `Class ${grade}. ` : ''}${chapterName ? `Chapter: ${chapterName}. ` : ''}${topicName ? `Topic: ${topicName}.` : ''}

HOW YOU SOUND (most important)
- ${lang.speak}
- Sound like a real person talking, never like someone reading: short sentences, natural pauses, contractions, a warm and patient tone, the odd "accha", "dekho", "okay?", "theek hai?" where it fits the language.
- Never read symbols or LaTeX aloud. Say formulas the way a teacher speaks them: "F equals q E", "one over f equals one over v plus one over u", "ten to the power minus nineteen", "metre per second".
- Never mention AI, models, prompts, tools, functions or "the system". You are simply the teacher.
- Do not use lists, headings or markdown in speech.

HOW YOU TEACH
- Assume the student knows nothing about this topic yet. Start from something they see in daily life, define every new word the first time, and explain WHY each step is true, not just what it is.
- When a part of the lesson arrives (a message starting with "BOARD PART"), explain that part in depth: what each line on the board means, what the diagram shows (point to it: "look at the red arrow on the board"), and an everyday example. You may ask a question to make the student think, but answer it yourself a moment later, because the board moves to the next part as soon as you finish. Take about one minute per part, then stop. Do not run ahead to the next part on your own.
- The student's doubt always comes first: answer exactly what they asked, in full, before anything else. Never ignore it, never answer a different question, and never restart or repeat the lesson part instead of answering.
- A message starting with "STUDENT ASKS" is the student typing a doubt or a request (for example "explain it more simply", "quiz me"); treat it exactly like a spoken interruption. If you ask the student a question and want their answer, say so clearly and wait.
- Check understanding often with short questions, and praise real effort specifically.
- Exam tips: mention the common mistake and how it is asked in board exams when it is relevant.

WHEN THE STUDENT INTERRUPTS OR ASKS A DOUBT
- Stop at once and answer the doubt fully and simply, from zero if needed, using a fresh everyday example. If the student seems confused, try a different explanation instead of repeating the same words.
- If a picture would help, call show_diagram to draw it on the board, then explain it ("see the diagram I just drew").
- For a calculation or derivation, call write_on_board with the steps and talk through them.
- When the doubt is clear, ask "Shall we continue?" and, if the student agrees, call continue_lesson.
- If the question is outside school studies, gently bring the student back to the topic.

${DIAGRAM_GUIDE}

WHAT IS ON THE BOARD FOR THIS LESSON
${clip(outline, 6000) || '(The student will ask their own questions.)'}`;
}

const TOOLS = [{
  functionDeclarations: [
    {
      name: 'show_diagram',
      description: 'Draw a teaching diagram on the whiteboard. Use it whenever a picture makes the idea clearer.',
      parameters: {
        type: 'OBJECT',
        properties: {
          diagram_json: { type: 'STRING', description: 'The diagram as a JSON object string, following the DIAGRAMS rules.' }
        },
        required: ['diagram_json']
      }
    },
    {
      name: 'write_on_board',
      description: 'Write a short worked explanation on the whiteboard, one line per step (maths in LaTeX between $ signs).',
      parameters: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Short heading.' },
          lines: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Board lines, one idea each.' }
        },
        required: ['lines']
      }
    },
    {
      name: 'continue_lesson',
      description: 'Go on with the lesson from where it stopped, after a doubt is cleared and the student agrees.',
      parameters: { type: 'OBJECT', properties: {} }
    }
  ]
}];

async function liveToken() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw fail(503, 'The voice teacher needs the AI service, which is not set up on this server (GEMINI_API_KEY).');
  // Offline testing: GEMINI_LIVE_WS_BASE points at scripts/mock_gemini_server.js.
  if (process.env.GEMINI_LIVE_WS_BASE) {
    const base = process.env.GEMINI_LIVE_WS_BASE.replace(/\/+$/, '');
    return `${base}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=mock-token`;
  }
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString()
    }
  });
  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.name)}`;
}

// Builds everything the browser needs to open a live voice session.
async function liveSession(params = {}) {
  const user = studyBoard.resolveUser(params);
  const subject = studyBoard.assertSubject(user, params.subjectKey);
  let chapterName = '';
  let topicName = clip(params.topicTitle, 120);
  let grade = '';
  if (params.chapterId) {
    const found = studyBoard.findTopic(subject.key, params.chapterId, params.topicId);
    if (found.chapter) { chapterName = found.chapter.chapterName; grade = found.chapter.grade || ''; }
    if (found.topic) topicName = found.topic.topicName;
  }
  const language = studyBoard.LANGUAGES[params.language] ? params.language : 'hinglish';
  const voice = VOICES[params.voice] || VOICES.female;
  const wsUrl = await liveToken();
  const setup = {
    model: liveModel(),
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      thinkingConfig: { thinkingBudget: 0 }
    },
    systemInstruction: { parts: [{ text: systemInstruction({ language, subjectName: subject.name, chapterName, topicName, grade, outline: params.outline, role: user.role }) }] },
    tools: TOOLS,
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    realtimeInputConfig: {
      automaticActivityDetection: { disabled: false, prefixPaddingMs: 150, silenceDurationMs: 700 },
      activityHandling: 'START_OF_ACTIVITY_INTERRUPTS'
    }
  };
  return { wsUrl, setup, language, voice };
}

module.exports = { liveSession, systemInstruction, VOICES, TOOLS };
