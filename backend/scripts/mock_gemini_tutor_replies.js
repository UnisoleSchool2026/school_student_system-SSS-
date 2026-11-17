// ============================================================================
// Tutor scenarios for scripts/mock_gemini_server.js (offline tests only)
//   forPrompt(text)   -> lesson / doubt JSON for generateContent
//   liveSession(ws)   -> a Gemini Live conversation: speaks (audio + transcript),
//                        is interrupted by student audio, calls the board tools,
//                        and continues the lesson when asked.
// ============================================================================

const LESSON = {
  hook: 'Why does a comb rubbed in dry hair pull small bits of paper towards it?',
  basics: ['Everything is made of atoms, and atoms have tiny charged particles: protons (+) and electrons (−).', 'A force is a push or a pull.'],
  simple: [
    'Rubbing moves some electrons from your hair to the comb, so the comb gets extra negative charge.',
    'Charges push or pull each other even without touching: like charges push apart, unlike charges pull together.',
    'This push or pull is called the electrostatic force.',
    'The force gets stronger when the charges are bigger, and much weaker when they move apart.'
  ],
  analogy: 'Like two magnets on a table: bring them closer and the pull jumps up sharply.',
  main_diagram: { type: 'charges', title: 'Unlike charges attract', caption: 'Field lines go from +q to −q; the forces on the two charges are equal and opposite.', charges: [{ x: -0.45, y: 0, q: 1, label: '+q₁' }, { x: 0.45, y: 0, q: -1, label: '−q₂' }], showForces: true },
  points: [
    { title: "Coulomb's law", lines: ['$F = k\\dfrac{q_1 q_2}{r^2}$', '$F$: force between the charges, in newton (N)', '$q_1, q_2$: the two charges, in coulomb (C)', '$r$: distance between them, in metre (m)', '$k = 9 \\times 10^9\\ N\\,m^2/C^2$ in air'], diagram: { type: 'graph', title: 'Force falls fast with distance', caption: 'Double the distance and the force becomes one quarter.', x: { min: 0.5, max: 4, label: 'r' }, y: { min: 0, max: 4.2, label: 'F' }, curves: [{ fn: '1/x^2', label: 'F ∝ 1/r²' }], points: [{ x: 1, y: 1, label: 'F' }, { x: 2, y: 0.25, label: 'F/4' }] } },
    { title: 'Direction of the force', lines: ['The force acts along the line joining the two charges.', 'Like charges: away from each other (repulsion).', 'Unlike charges: towards each other (attraction).'], diagram: null }
  ],
  worked: { question: 'Two charges of $2\\,\\mu C$ each are $3\\,cm$ apart in air. Find the force.', steps: ['Write the law: $F = k q_1 q_2 / r^2$, because both are point charges.', 'Convert units: $q = 2\\times10^{-6}\\,C$, $r = 0.03\\,m$.', 'Substitute: $F = 9\\times10^9 \\times (2\\times10^{-6})^2 / (0.03)^2$.', 'Simplify: $F = 40\\,N$ (repulsive, since both are positive).'], answer: '$F = 40\\,N$, repulsive' },
  misconceptions: ['Wrong: the force halves when the distance doubles. Right: it becomes one quarter.'],
  remember: ['Always convert μC to C and cm to m before substituting.']
};

const DOUBT = {
  readable: true,
  question: 'Why does the force become one quarter when the distance doubles?',
  steps: [{ title: 'Look at the formula', lines: ['$F \\propto 1/r^2$', 'If $r$ becomes $2r$, then $r^2$ becomes $4r^2$.'] }, { title: 'So', lines: ['$F$ becomes $F/4$.'] }],
  answer: 'One quarter, because the distance is squared.',
  concept: 'Inverse-square law',
  tip: 'Square the distance factor, do not just divide by it.',
  diagram: { type: 'graph', title: 'Inverse square', x: { min: 0.5, max: 4, label: 'r' }, y: { min: 0, max: 4.2, label: 'F' }, curves: [{ fn: '1/x^2', label: 'F ∝ 1/r²' }], points: [{ x: 1, y: 1, label: 'F' }, { x: 2, y: 0.25, label: 'F/4' }] }
};

function forPrompt(text) {
  if (/"hook"/.test(text) && /"main_diagram"/.test(text)) return LESSON;
  if (/Student's question/.test(text)) return DOUBT;
  return null;
}

// 120 ms of a quiet, speech-like tone at 24 kHz, as base64 PCM16 (Gemini Live output format).
function audioChunk(seed) {
  const n = 2880;
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / 24000;
    const v = 0.08 * Math.sin(2 * Math.PI * (180 + 40 * Math.sin(seed + t * 6)) * t) * (0.6 + 0.4 * Math.sin(t * 20 + seed));
    buf.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  return buf.toString('base64');
}

function liveSession(ws, log) {
  let speaking = null; // { timer }
  let pending = null; // function to run after a toolResponse
  let studentChunks = 0;
  let quietTimer = null;
  let interruptedThisTurn = false;
  const send = obj => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };

  function speak(text, done) {
    const words = text.split(' ');
    const parts = [];
    for (let i = 0; i < words.length; i += 5) parts.push(words.slice(i, i + 5).join(' ') + ' ');
    let k = 0;
    speaking = { timer: setInterval(() => {
      if (k >= parts.length) {
        clearInterval(speaking.timer);
        speaking = null;
        send({ serverContent: { turnComplete: true } });
        if (done) done();
        return;
      }
      send({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: audioChunk(k) } }] }, outputTranscription: { text: parts[k] } } });
      k += 1;
    }, 110) };
  }

  function stopSpeaking() {
    if (speaking) { clearInterval(speaking.timer); speaking = null; }
  }

  function answerDoubt(question) {
    send({ toolCall: { functionCalls: [{ id: 'call_diagram_1', name: 'show_diagram', args: { diagram_json: JSON.stringify(DOUBT.diagram) } }] } });
    pending = () => {
      send({ toolCall: { functionCalls: [{ id: 'call_board_1', name: 'write_on_board', args: { title: 'Why one quarter?', lines: ['$F \\propto 1/r^2$', 'Double $r$: $r^2$ becomes 4 times', 'So $F$ becomes $F/4$'] } }] } });
      pending = () => speak(`Bahut achha sawaal. Dekho, board par graph dekho. Force distance ke square se divide hota hai, isliye distance double karo to force chaar guna kam ho jaata hai. Samjha? Shall we continue?`);
    };
    log({ kind: 'live-doubt', question: String(question).slice(0, 120) });
  }

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
    if (msg.setup) {
      const s = msg.setup;
      const sys = (((s.systemInstruction || {}).parts || [])[0] || {}).text || '';
      log({ kind: 'live-setup', model: s.model, voice: (((s.generationConfig || {}).speechConfig || {}).voiceConfig || {}).prebuiltVoiceConfig, tools: ((s.tools || [])[0] || {}).functionDeclarations ? s.tools[0].functionDeclarations.map(f => f.name) : [], hinglish: /Hinglish/.test(sys), sysChars: sys.length });
      send({ setupComplete: {} });
      return;
    }
    if (msg.clientContent) {
      const text = ((msg.clientContent.turns || []).map(t => (t.parts || []).map(p => p.text || '').join(' ')).join(' ')).trim();
      log({ kind: 'live-text', text: text.slice(0, 200) });
      stopSpeaking();
      if (/^BOARD PART/.test(text)) {
        const title = (/: ([^\n.]+)/.exec(text) || [])[1] || 'this part';
        interruptedThisTurn = false;
        speak(`Accha, ab ${title} dekhte hain. Board par jo likha hai uska matlab simple hai. Socho tum apne baal mein comb ghuma rahe ho, aur kaagaz ke tukde comb ki taraf kheench jaate hain. Yahi electrostatic force hai. Theek hai?`);
      } else if (/continue|aage|chalo|yes/i.test(text) && !/STUDENT ASKS/.test(text)) {
        send({ toolCall: { functionCalls: [{ id: 'call_continue_1', name: 'continue_lesson', args: {} }] } });
        pending = () => speak('Chalo, aage badhte hain.');
      } else {
        answerDoubt(text);
      }
      return;
    }
    if (msg.toolResponse) {
      log({ kind: 'live-tool-response', responses: (msg.toolResponse.functionResponses || []).map(r => `${r.name}:${JSON.stringify(r.response).slice(0, 80)}`) });
      const next = pending;
      pending = null;
      if (next) setTimeout(next, 150);
      return;
    }
    if (msg.realtimeInput) {
      if (msg.realtimeInput.audio || msg.realtimeInput.mediaChunks) {
        studentChunks += 1;
        if (speaking && studentChunks >= 3 && !interruptedThisTurn) {
          interruptedThisTurn = true;
          stopSpeaking();
          send({ serverContent: { interrupted: true } });
          log({ kind: 'live-interrupted' });
        }
        clearTimeout(quietTimer);
        quietTimer = setTimeout(() => {
          if (studentChunks >= 3) {
            const q = 'Sir, distance double karne par force chaar guna kam kyun hota hai?';
            send({ serverContent: { inputTranscription: { text: q } } });
            studentChunks = 0;
            answerDoubt(q);
          }
        }, 700);
      }
      if (msg.realtimeInput.audioStreamEnd) log({ kind: 'live-audio-end' });
    }
  });
  ws.on('close', () => { stopSpeaking(); clearTimeout(quietTimer); log({ kind: 'live-close' }); });
}

module.exports = { forPrompt, liveSession, LESSON, DOUBT };
