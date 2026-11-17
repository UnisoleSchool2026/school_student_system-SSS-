// ============================================================================
// TEST: Study Board voice teacher session + board diagram library (2026-11-17)
// Runs in-process, no network: the Live token is pointed at a fake WS base.
//   node scripts/test_voice_tutor_and_diagrams.js
// ============================================================================

const path = require('path');
const assert = require('assert');

process.chdir(path.resolve(__dirname, '..'));
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
process.env.GEMINI_LIVE_WS_BASE = 'ws://127.0.0.1:9';

const { initDatabase } = require('../src/config/database');
const tutor = require('../src/services/tutorService');
const diagrams = require('../src/services/diagramLibrary');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try { await fn(); passed += 1; console.log(`  PASS  ${name}`); } catch (err) { failed += 1; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const ARYAN = 'b0000000-0000-0000-0000-000000000001'; // 12-NonMed

async function main() {
  try { await initDatabase(); } catch (e) { /* in-memory fallback */ }

  await check('Student session: audio voice, three board tools, Hinglish by default', async () => {
    const s = await tutor.liveSession({ studentId: ARYAN, subjectKey: 'PHYSICS', topicTitle: "Coulomb's law", outline: 'Part 1: test' });
    assert.ok(/access_token=/.test(s.wsUrl));
    assert.deepStrictEqual(s.setup.generationConfig.responseModalities, ['AUDIO']);
    assert.strictEqual(s.language, 'hinglish');
    assert.strictEqual(s.setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, tutor.VOICES.female);
    const names = s.setup.tools[0].functionDeclarations.map(f => f.name).sort();
    assert.deepStrictEqual(names, ['continue_lesson', 'show_diagram', 'write_on_board']);
    assert.strictEqual(s.setup.realtimeInputConfig.activityHandling, 'START_OF_ACTIVITY_INTERRUPTS');
    const sys = s.setup.systemInstruction.parts[0].text;
    assert.ok(/Coulomb's law/.test(sys) && /Part 1: test/.test(sys));
    assert.ok(/Never mention AI/.test(sys));
  });

  await check('English + male voice are honoured; unknown language falls back to Hinglish', async () => {
    const en = await tutor.liveSession({ studentId: ARYAN, subjectKey: 'PHYSICS', language: 'en', voice: 'male' });
    assert.strictEqual(en.language, 'en');
    assert.strictEqual(en.setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, tutor.VOICES.male);
    const odd = await tutor.liveSession({ studentId: ARYAN, subjectKey: 'PHYSICS', language: 'fr' });
    assert.strictEqual(odd.language, 'hinglish');
  });

  await check('A student cannot open a session for a subject outside their class', async () => {
    await assert.rejects(() => tutor.liveSession({ studentId: ARYAN, subjectKey: 'BIOLOGY' }), e => e.status >= 400 && e.status < 500);
  });

  await check('Teacher session teaches the whole class', async () => {
    const s = await tutor.liveSession({ teacherSubjectKey: 'PHYSICS', subjectKey: 'PHYSICS' });
    assert.ok(/whole class/.test(s.setup.systemInstruction.parts[0].text));
  });

  await check('Outline sent by the browser is capped', async () => {
    const s = await tutor.liveSession({ studentId: ARYAN, subjectKey: 'PHYSICS', outline: 'x'.repeat(50000) });
    assert.ok(s.setup.systemInstruction.parts[0].text.length < 20000);
  });

  await check('No API key: a clear 503 instead of a crash', async () => {
    const key = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await assert.rejects(() => tutor.liveSession({ studentId: ARYAN, subjectKey: 'PHYSICS' }), e => e.status === 503);
    } finally { process.env.GEMINI_API_KEY = key; }
  });

  await check('Diagram specs are cleaned: unknown types dropped, numbers clamped, unsafe formulas removed', async () => {
    assert.strictEqual(diagrams.sanitizeDiagram({ type: 'script' }), null);
    const c = diagrams.sanitizeDiagram({ type: 'charges', charges: [{ x: 9, y: -9, q: 50, label: '<b>q</b>' }] });
    assert.strictEqual(c.charges[0].x, 1);
    assert.strictEqual(c.charges[0].y, -1);
    assert.ok(Math.abs(c.charges[0].q) <= 3);
    const g = diagrams.sanitizeDiagram({ type: 'graph', curves: [{ fn: 'alert(1)' }, { fn: '1/x^2' }] });
    const fns = g ? (g.curves || []).map(x => x.fn) : [];
    assert.ok(fns.indexOf('alert(1)') === -1, 'unsafe formula kept');
  });

  await check('Topics get a matching diagram (or a concept map), never a wrong one', async () => {
    const pick = (topicName, chapterName, subtopics) => (diagrams.diagramsForTopic({ topicName, chapterName, subtopics })[0] || {}).type;
    assert.strictEqual(pick("Coulomb's law", 'Electric Charges and Fields'), 'charges');
    assert.strictEqual(pick('Total internal reflection', 'Ray Optics and Optical Instruments'), 'refraction');
    assert.notStrictEqual(pick('Magnetic force on a moving charge', 'Moving Charges and Magnetism'), 'charges');
    assert.strictEqual(pick('Some unusual topic', 'Unknown chapter', ['A', 'B', 'C']), 'concept_map');
  });

  console.log(`\nVoice tutor + diagram tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
