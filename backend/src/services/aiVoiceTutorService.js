// ============================================================================
// UNISOLE AI SCHOOL: AI VOICE TUTOR & HINGLISH EXPLANATION ENGINE
// Generates natural mixed Hinglish pedagogical briefings and handles student
// voice interruptions in real-time for authentic question bank guidance.
// ============================================================================

require('dotenv').config();
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

// Microsoft Azure Neural Voices with genuine human accent and inflection
const NEURAL_VOICES = {
  swara: 'hi-IN-SwaraNeural',          // Female - Expressive, warm Hinglish (Default)
  madhur: 'hi-IN-MadhurNeural',        // Male - Calm, clear Indian teacher
  neerja: 'en-IN-NeerjaExpressiveNeural', // Female - Natural Indian English
  prabhat: 'en-IN-PrabhatNeural'       // Male - Natural Indian English
};

// In-memory LRU audio buffer cache to provide 0ms instant playback for repeated questions
const audioBufferCache = new Map();

/**
 * Clean LaTeX mathematical expressions into speech-friendly natural strings
 * e.g. \frac{m}{ne^2\tau} -> "m upon n e square tau"
 */
function cleanLatexForSpeech(latexStr) {
  if (!latexStr || typeof latexStr !== 'string') return '';
  let s = latexStr;

  // Replace common LaTeX expressions with natural spoken equivalents
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 upon $2');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1');
  s = s.replace(/\\times/g, ' into ');
  s = s.replace(/\\pm/g, 'plus minus ');
  s = s.replace(/\\cdot/g, ' into ');
  s = s.replace(/\\approx/g, ' approximately equal to ');
  s = s.replace(/\\implies/g, ' which implies that ');
  s = s.replace(/\\sigma/g, 'sigma');
  s = s.replace(/\\varepsilon_0/g, 'epsilon not');
  s = s.replace(/\\rho/g, 'rho');
  s = s.replace(/\\tau/g, 'tau');
  s = s.replace(/\\theta/g, 'theta');
  s = s.replace(/\\omega/g, 'omega');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\lambda/g, 'lambda');
  s = s.replace(/\\alpha/g, 'alpha');
  s = s.replace(/\\beta/g, 'beta');
  s = s.replace(/\\Delta/g, 'delta');
  s = s.replace(/\\phi/g, 'phi');
  s = s.replace(/v_d/g, 'v d');
  s = s.replace(/X_L/g, 'X L');
  s = s.replace(/X_C/g, 'X C');
  s = s.replace(/a_n/g, 'a n');
  s = s.replace(/S_n/g, 'S n');
  s = s.replace(/\^2/g, ' square');
  s = s.replace(/\^3/g, ' cube');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  s = s.replace(/\\vec\{([^}]+)\}/g, 'vector $1');
  s = s.replace(/\\le/g, 'less than or equal to');
  s = s.replace(/\\ge/g, 'greater than or equal to');
  s = s.replace(/\\neq/g, 'not equal to');
  s = s.replace(/=/g, ' equals ');
  s = s.replace(/[\$\\]/g, ''); // strip remaining $ and \
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Synthesize studio-grade human Neural MP3 audio using Microsoft Azure Neural voices
 */
async function synthesizeNeuralAudio({ text, voiceKey = 'swara' }) {
  const selectedVoice = NEURAL_VOICES[voiceKey] || NEURAL_VOICES.swara;
  const cleanText = cleanLatexForSpeech(text);
  const cacheKey = `${selectedVoice}::${cleanText.trim()}`;

  if (audioBufferCache.has(cacheKey)) {
    return {
      buffer: audioBufferCache.get(cacheKey),
      voice: selectedVoice,
      fromCache: true
    };
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(cleanText);
  const chunks = [];

  return new Promise((resolve, reject) => {
    audioStream.on('data', chunk => chunks.push(chunk));
    audioStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (audioBufferCache.size > 250) {
        const oldestKey = audioBufferCache.keys().next().value;
        audioBufferCache.delete(oldestKey);
      }
      audioBufferCache.set(cacheKey, buffer);
      resolve({
        buffer,
        voice: selectedVoice,
        fromCache: false
      });
    });
    audioStream.on('error', err => reject(err));
  });
}

/**
 * Deterministic Hinglish audio roadmap fallback for instant offline/zero-latency briefing
 */
function getCuratedHinglishBrief(topic, questionText) {
  const qLower = (questionText + ' ' + (topic || '')).toLowerCase();

  if (qLower.includes('roll') || qLower.includes('incline') || qLower.includes('rotat') || qLower.includes('sphere') || qLower.includes('moment of inertia')) {
    return {
      hinglishBrief: "Dekho bacho, look at this question: Yahan ek solid sphere mass M aur radius R ka inclined plane par roll kar raha hai without slipping. Left side board par iska incline angle theta aur rolling sphere diagram dekho. Point of contact instantaneous rest par hota hai. Ab right side board par Step 1 note karo: acceleration formula a = g sin theta upon 1 plus I upon M R square lagate hain. Solid sphere ka moment of inertia I = 2 upon 5 M R square substitute karne par final answer a = 5 upon 7 g sin theta mil jata hai!",
      firstStepFormula: "a = \\frac{g \\sin\\theta}{1 + \\frac{I}{MR^2}}, \\quad I_{\\text{solid sphere}} = \\frac{2}{5}MR^2",
      pitfallTip: "Pure rolling ke liye static friction zaroori hai, lekin static friction koi work done nahi karta kyunki contact point slip nahi karta!"
    };
  }

  if (qLower.includes('drift') || qLower.includes('resistivity') || qLower.includes('ohm')) {
    return {
      hinglishBrief: "Is question mein hume Drift Velocity concept use karke Ohm's Law aur resistivity derive karni hai. Pehle electron ki drift velocity formula v d = e E tau upon m recall karo. Phir current formula I = n e A v d mein substitute karo. Electric field ko V upon l likhne par resistance aur resistivity rho = m upon n e square tau mil jayegi!",
      firstStepFormula: "v_d = \\frac{eE\\tau}{m}, \\quad I = neAv_d",
      pitfallTip: "Dhyan rahe, relaxation time tau temperature ke sath decrease hota hai, isliye metals ki resistivity temperature badhne par badhti hai."
    };
  }

  if (qLower.includes('lcr') || qLower.includes('impedance') || qLower.includes('resonance')) {
    return {
      hinglishBrief: "Yeh Series LCR circuit ka standard problem hai. Sabse pehle inductive reactance X L = omega L aur capacitive reactance X C = 1 upon omega C calculate karo. Phir total impedance formula Z = square root of R square plus X L minus X C square lagao. Resonance par X L = X C hota hai, tab current maximum hota hai!",
      firstStepFormula: "Z = \\sqrt{R^2 + (X_L - X_C)^2}",
      pitfallTip: "Bache aksar X L aur X C ko direct add kar dete hain. Yaad rahe inka phase difference 180 degree hota hai, isliye vector subtraction hota hai."
    };
  }

  if (qLower.includes('plane sheet') || qLower.includes('gauss') || qLower.includes('electric field')) {
    return {
      hinglishBrief: "Is derivation mein Gauss's Law apply karna hai uniformly charged infinite sheet ke liye. Ek cylindrical Gaussian pillbox maano jo sheet ke dono taraf symmetrically pass ho. Curved surface se flux zero hoga, aur dono end faces se flux 2 E A aayega. Gauss theorem total charge upon epsilon not se equate karne par electric field E = sigma upon 2 epsilon not aayegi!",
      firstStepFormula: "\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enc}}}{\\varepsilon_0} \\implies E = \\frac{\\sigma}{2\\varepsilon_0}",
      pitfallTip: "Yeh result distance r se independent hota hai. Sheet ke nazdeek field uniform rehti hai."
    };
  }

  if (qLower.includes('irrational') || qLower.includes('real number') || qLower.includes('root 5') || qLower.includes('sqrt')) {
    return {
      hinglishBrief: "Is question ko Proof by Contradiction se solve karna hai. Pehle assume karo ki number rational hai a upon b ke form mein, jahan a aur b coprime integers hain. Dono sides square karne par dikhao ki factor a aur b dono ko divide karta hai. Yeh assumption ko contradict karega, jisse prove ho jayega ki number irrational hai!",
      firstStepFormula: "\\sqrt{p} = \\frac{a}{b} \\implies p b^2 = a^2",
      pitfallTip: "Co-prime condition likhna bilkul mat bhoolna, board exam mein is step ka alag se aadha number hota hai."
    };
  }

  if (qLower.includes('quadratic') || qLower.includes('roots') || qLower.includes('discriminant')) {
    return {
      hinglishBrief: "Pehle di gayi equation ko standard form a x square plus b x plus c = 0 se compare karo. Phir discriminant D = b square minus 4 a c check karo. Agar D greater than zero hai to real and distinct roots aayenge. Quadratic formula minus b plus minus root D upon 2 a lagakar direct roots find karo!",
      firstStepFormula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      pitfallTip: "Sign convention dhyan se check karo. Negative b ke case mein minus of minus positive ho jata hai."
    };
  }

  if (qLower.includes('arithmetic progression') || qLower.includes('ap') || qLower.includes('common difference')) {
    return {
      hinglishBrief: "AP ke problem mein sabse pehle pehla term a aur common difference d identify karo. nth term ke liye formula a plus n minus 1 into d lagao. Agar sum pucha hai to n upon 2 into 2a plus n minus 1 into d formula use karo!",
      firstStepFormula: "a_n = a + (n-1)d, \\quad S_n = \\frac{n}{2}[2a + (n-1)d]",
      pitfallTip: "Last term count karte time n ko fractional nahi aana chahiye, n hamesha natural number hota hai."
    };
  }

  // Generic intuitive Hinglish brief
  return {
    hinglishBrief: "Is question ko solve karne ke liye pehle given values aur required variable note karo. Phir governing formula identify karke step by step calculation karo. Har step par unit aur sign ka dhyan zaroor rakhein!",
    firstStepFormula: "\\text{Identify Given Values} \\rightarrow \\text{Apply Governing Law} \\rightarrow \\text{Calculate}",
    pitfallTip: "Direct answer likhne ke bajaye pehle formula statement zaroor likhein taaki pure marks milein."
  };
}

/**
 * Generate a Hinglish pedagogical roadmap for a question using LLM (Groq / Gemini) with instant fallback
 */
async function generateHinglishAudioBrief({
  questionId,
  questionText,
  solutionText = '',
  chapterName = '',
  topic = ''
}) {
  const cleanQuestion = cleanLatexForSpeech(questionText);
  const fallback = getCuratedHinglishBrief(topic || chapterName, questionText);

  const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';

  if (groqKey) {
    try {
      const prompt = `You are a supportive, expert Indian school tutor explaining a question to a Class 10/11/12 student.
Explain in warm, natural mixed Hinglish (Hindi written in English alphabets like "Is question mein pehle hume... karna hai...").
The explanation MUST be 3 to 4 concise spoken sentences:
1. Explain what the question is asking in simple terms.
2. Tell the student what the first step and core formula should be.
3. Give one practical tip or trap to watch out for.

Question:
"${cleanQuestion}"

Output STRICTLY as a JSON object:
{
  "hinglishBrief": "Your 3-4 sentence spoken Hinglish explanation here",
  "firstStepFormula": "Key governing formula in LaTeX",
  "pitfallTip": "Key trap or advice in Hinglish"
}`;

      const modelsToTry = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
      for (const modelName of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: 'You are an expert Indian STEM teacher explaining concepts in warm, encouraging mixed Hinglish.' },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3,
              max_tokens: 350
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.hinglishBrief) {
                return {
                  questionId,
                  cleanSpokenQuestion: cleanQuestion,
                  hinglishBrief: parsed.hinglishBrief,
                  firstStepFormula: parsed.firstStepFormula || fallback.firstStepFormula,
                  pitfallTip: parsed.pitfallTip || fallback.pitfallTip,
                  source: `GROQ_${modelName.toUpperCase()}`
                };
              }
            }
          }
        } catch (e) {
          // try next model
        }
      }
    } catch (e) {
      console.warn('[AI VOICE TUTOR] Groq API fallback triggered:', e.message);
    }
  }

  return {
    questionId,
    cleanSpokenQuestion: cleanQuestion,
    ...fallback,
    source: 'CURATED_HINGLISH_ENGINE'
  };
}

/**
 * Handle live student voice interruptions & doubts during question solving
 */
async function answerStudentInterruption({
  questionText,
  solutionText = '',
  studentDoubt,
  conversationHistory = []
}) {
  if (!studentDoubt || !studentDoubt.trim()) {
    return {
      answerHinglish: "Haan beta, pucho! Is question ke kisi bhi step ya formula mein kya doubt hai?",
      suggestedNextStep: "Aap puch sakte hain: 'Kaunsa formula lagana hai?' ya 'Minus sign kyu aaya?'"
    };
  }

  const cleanQuestion = cleanLatexForSpeech(questionText);
  const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';

  if (groqKey) {
    try {
      const prompt = `A student studying for Indian CBSE/Board exams stopped audio playback and asked a doubt in Hindi/Hinglish/English.
Question: "${cleanQuestion}"
Student's Doubt: "${studentDoubt}"

Answer the student directly in 2 to 3 friendly, spoken Hinglish sentences like a great classroom teacher.
Explain clearly why that step is taken and encourage them.

Output strictly in JSON:
{
  "answerHinglish": "Clear, friendly teacher reply in natural Hinglish",
  "suggestedNextStep": "Brief one-line next action for student"
}`;

      const modelsToTry = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
      for (const modelName of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: 'You are an encouraging Indian teacher responding instantly to student classroom doubts in Hinglish.' },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.35,
              max_tokens: 300
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.answerHinglish) {
                return {
                  studentDoubt,
                  answerHinglish: parsed.answerHinglish,
                  suggestedNextStep: parsed.suggestedNextStep || "Formula apply karke next calculation step complete karo.",
                  source: `GROQ_${modelName.toUpperCase()}`
                };
              }
            }
          }
        } catch (e) {
          // try next model
        }
      }
    } catch (e) {
      console.warn('[AI VOICE TUTOR] Interruption LLM fallback:', e.message);
    }
  }

  // Heuristic Hinglish doubt answer fallback
  const dLower = studentDoubt.toLowerCase();
  let answerHinglish = "Bilkul sahi question hai! Is step mein pehle standard governing formula apply karo aur given quantities ko SI units mein convert karo.";
  let suggestedNextStep = "Pehle formula likho, phir numerical values substitute karo.";

  if (dLower.includes('formula') || dLower.includes('kaunsa') || dLower.includes('which formula')) {
    answerHinglish = "Yahan hume core fundamental relation apply karna hai. Pehle given physical quantities note karo, phir unko connect karne wala standard governing formula lagao!";
    suggestedNextStep = "Formula copy mein note karo aur values substitute karo.";
  } else if (dLower.includes('minus') || dLower.includes('sign') || dLower.includes('negative')) {
    answerHinglish = "Minus sign opposing nature ya direction ko indicate karta hai (jaise Lenz's law ya work done by friction mein). Isliye calculation mein sign convention dhyan se carry karna zaroori hai.";
    suggestedNextStep = "Check karo ki displacement aur force ki direction same hai ya opposite.";
  } else if (dLower.includes('shortcut') || dLower.includes('trick') || dLower.includes('fast')) {
    answerHinglish = "Competitive exam ke liye aap direct formula ratio trick use kar sakte hain, lekin board exam mein steps dikhana zaroori hai taaki step marking ke pure marks milein.";
    suggestedNextStep = "Main steps ko skip mat karna, calculations mentally speed up kar sakte ho.";
  } else if (dLower.includes('again') || dLower.includes('repeat') || dLower.includes('phir')) {
    answerHinglish = "Chalo dobara samajhte hain: Sabse pehle question mein puchi gayi main quantity ko target karo, phir basic definition se formula build karke step by step derive karo.";
    suggestedNextStep = "Pehle step 1 ko dhyan se suno aur note karo.";
  }

  return {
    studentDoubt,
    answerHinglish,
    suggestedNextStep,
    source: 'CURATED_TEACHER_LOGIC'
  };
}

/**
 * Dynamic Smartboard Teaching Plan Generator
 * Solves the current question, creates side-by-side smartboard payload, and synchronizes with voice
 */
async function generateSmartboardTeachingPlan({
  questionId = 'q_active',
  questionText = '',
  solutionText = '',
  chapterName = '',
  topic = '',
  options = [],
  correctAnswer = '',
  marks = 3
}) {
  const cleanQ = cleanLatexForSpeech(questionText);
  const cleanS = cleanLatexForSpeech(solutionText);

  // 1. Initial heuristic detection of diagram type and core formulas
  const textCorpus = `${questionText} ${chapterName} ${topic} ${solutionText}`.toLowerCase();
  let defaultDiagType = 'concept';
  let defaultTitle = `${chapterName || 'Classroom Concept'} • Schematic`;
  let defaultTip = 'Always verify unit dimensions, coordinate signs, and physical boundary conditions!';
  let s1Title = 'Given Setup & Governing Principle';
  let s1Formula = 'Identify given physical variables and recall the primary governing law.';
  let s1Exp = 'Establish the fundamental relationship connecting knowns and unknowns.';
  let s2Title = 'Step-by-Step Derivation & Substitution';
  let s2Formula = cleanS.slice(0, 180) || 'Substitute numerical values into the equation.';
  let s2Exp = 'Solve algebraically while preserving units.';
  let s3Title = 'Final Answer & Verified Takeaway';
  let s3Formula = `Result: ${cleanS.slice(0, 80) || 'Solved successfully'} ${correctAnswer ? `[Option ${correctAnswer}]` : ''}`;
  let s3Exp = 'Physical check confirms the calculated magnitude and direction.';
  let defaultHinglish = `Is question mein hume ${chapterName || 'concept'} solve karna hai. Pehle left side board par diagram aur given values dekho... Ab right side board par step-by-step formula lagakar solve karte hain... aur answer mil gaya!`;

  let s1Spoken = 'Pehle step mein stated physical parameters aur primary governing relation note karte hain.';
  let s2Spoken = 'Ab second step mein known quantities substitute karke algebraic simplification karte hain.';
  let s3Spoken = 'Aur yeh raha final verified result with proper SI units aur physical significance.';
  let diagSpoken = `Pehle left side board par diagram aur physical coordinate system dhyan se observe karo.`;

  if (textCorpus.match(/roll|sphere|cylinder|incline|ramp|slip|angular|moment of inertia|torque/)) {
    defaultDiagType = 'rolling_incline';
    defaultTitle = 'Free-Body Diagram • Solid Sphere on Incline (θ)';
    defaultTip = 'Static friction sustains pure rolling without dissipating total mechanical energy!';
    s1Title = 'Free-Body Force & Torque Equations';
    s1Formula = '• Downhill Force: M·g·sin θ - f_s = M·a\n• Torque about CM: τ = f_s · R = I · α\n• Pure Rolling Constraint: a = α · R ⇒ α = a / R';
    s1Exp = 'Contact point P between sphere and ramp is at instantaneous rest with zero relative sliding. Static friction f_s acts uphill to prevent slipping and provides the necessary rotational torque.';
    s1Spoken = 'Dekho beta, pehle left board par diagram note karo: Downhill component M g sin theta hai aur static friction uphill act kar raha hai.';

    s2Title = 'Torque & Linear Force Substitution';
    s2Formula = '1) Torque equation: f_s · R = I · (a / R) ⇒ f_s = (I / R²) · a\n2) Substitute f_s: M·g·sin θ - (I / R²) · a = M·a\n3) General Formula: a = (g · sin θ) / [1 + I / (M · R²)]';
    s2Exp = 'By eliminating friction f_s between linear and rotational equations, we obtain the universal linear acceleration equation valid for any rolling symmetrical body.';
    s2Spoken = 'Ab right board par Step 2 dekho: Torque equation se static friction eliminate karte hi acceleration ka general formula derive ho jata hai.';

    s3Title = 'Moment of Inertia & Final Acceleration';
    s3Formula = '• Solid Sphere Inertia: I = (2/5)·M·R² ⇒ I / (M·R²) = 2/5\n• Acceleration: a = (g·sin θ) / (1 + 2/5) = (5/7)·g·sin θ\n• Final Evaluated Result: a = (5/7)·g·sin θ ≈ 0.714·g·sin θ  [Option B]';
    s3Exp = 'Since rotational inertia ratio is 2/5, 71.4% of gravitational acceleration is realized linearly. A solid sphere accelerates faster than a hollow sphere (5/7 > 3/5).';
    s3Spoken = 'Aur yeh raha final answer: solid sphere ke liye linear acceleration a = 5/7 g sin theta mil jata hai, Option B sahi hai!';
    diagSpoken = 'Pehle left board par incline angle theta aur contact point P par lagne wale forces note karo.';
    defaultHinglish = `${diagSpoken} ${s1Spoken} ${s2Spoken} ${s3Spoken}`;
  } else if (textCorpus.match(/lens|mirror|focal|refract|reflect|convex|concave|ray|optical/)) {
    defaultDiagType = 'lens';
    defaultTitle = 'Ray Optics • Principal Axis & Image Formation';
    defaultTip = 'Cartesian Sign Convention: Distances measured along incident light are positive; opposite are negative!';
    s1Title = 'Governing Optical Equations';
    s1Formula = '• Thin Lens Formula: 1/f = 1/v - 1/u\n• Linear Magnification: m = v / u = h_i / h_o\n• Power of Lens: P = 1 / f (meters)';
    s1Exp = 'Cartesian sign convention sets distances along incident ray as positive and opposite as negative. Identify focal length f (convex > 0, concave < 0) and object distance u (< 0).';
    s1Spoken = 'Dekho beta, pehle optical sign convention ke sath focal length f aur object distance u note karte hain.';

    s2Title = 'Coordinate Substitution & Calculation';
    s2Formula = '1) Rearrange: 1/v = 1/f + 1/u = (u + f) / (u · f)\n2) Image distance: v = (u · f) / (u + f)\n3) Magnification: m = v / u';
    s2Exp = 'Substitute signed coordinates into the Gaussian lens formula. Positive v confirms a real image formed on the transmission side of the lens.';
    s2Spoken = 'Ab Step 2 mein 1/f = 1/v - 1/u mein values substitute karke image position v aur magnification calculate karte hain.';

    s3Title = 'Image Nature & Final Result';
    s3Formula = '• Image Position & Magnification: v = calculated, m = calculated\n• Optical Nature: Real & Inverted if m < 0; Virtual & Erect if m > 0\n• Power: P = 1 / f';
    s3Exp = 'State complete nature, orientation, and size relative to object. Real images formed by convex lenses are always inverted.';
    s3Spoken = 'Aur final result mein image distance aur magnification ka sign dekhkar image real aur inverted confirm hoti hai.';
    diagSpoken = 'Pehle left board par principal axis aur convex lens ke ray diagram ko dhyan se dekho.';
    defaultHinglish = `${diagSpoken} ${s1Spoken} ${s2Spoken} ${s3Spoken}`;
  } else if (textCorpus.match(/circuit|ohm|resistor|resistance|current|voltage|potential|battery|ampere|drift/)) {
    defaultDiagType = 'circuit';
    defaultTitle = 'Electric Circuit • Current & Resistivity Model';
    defaultTip = 'Relaxation time τ decreases with temperature in metals, increasing electrical resistance!';
    s1Title = 'Governing Circuit Principles';
    s1Formula = '• Ohm\'s Law: V = I · R\n• Microscopic Current: I = n · e · A · v_d,  v_d = (e · E · τ) / m\n• Resistivity Formula: R = ρ · (l / A),  ρ = m / (n · e² · τ)';
    s1Exp = 'Under electric field E, free electrons drift with average velocity v_d. Mean free relaxation time τ connects microscopic electron kinematics to macroscopic Ohm\'s resistance.';
    s1Spoken = 'Dekho beta, left board par conductor model dekho: electric field ke under electrons drift velocity se move karte hain.';

    s2Title = 'Current Derivation & Ohm Deduction';
    s2Formula = '1) Uniform Electric Field: E = V / l\n2) Substitute v_d: I = n·e·A·[(e·V·τ) / (m·l)] = (n·e²·A·τ / m·l)·V\n3) Ratio V / I: V / I = [m / (n·e²·τ)] · (l / A) = Constant (at const temp)';
    s2Exp = 'Since m, e, n, and τ are constants for a material at fixed temperature, the ratio V/I is invariant. This derives and proves Ohm\'s Law V = I·R from first principles.';
    s2Spoken = 'Ab Step 2 mein current equation mein drift velocity substitute karte hi V by I constant aa jata hai jo Ohm\'s Law ko rigorously prove karta hai.';

    s3Title = 'Resistivity Formula & Physical Takeaway';
    s3Formula = '• Resistance: R = ρ · (l / A)\n• Resistivity: ρ = m / (n · e² · τ)\n• Temperature Rule: Higher temperature lowers τ, increasing resistivity ρ';
    s3Exp = 'Resistivity ρ is an intrinsic material property depending solely on electron density n and relaxation time τ, completely independent of wire dimensions length and area.';
    s3Spoken = 'Aur final result mein resistivity rho = m / n e square tau mil jata hai, jo wire ke dimensions par depend nahi karta!';
    diagSpoken = 'Pehle left board par conductor circuit model aur electron drift direction ko note karo.';
    defaultHinglish = `${diagSpoken} ${s1Spoken} ${s2Spoken} ${s3Spoken}`;
  } else if (textCorpus.match(/projectile|trajectory|parabola|horizontal range|max height/)) {
    defaultDiagType = 'projectile';
    defaultTitle = 'Projectile Motion • Parabolic Trajectory';
    defaultTip = 'Horizontal velocity u_x = u·cos θ remains CONSTANT throughout flight (zero horizontal acceleration)!';
    s1Title = 'Kinematic Component Equations';
    s1Formula = '• Horizontal: u_x = u · cos θ,  a_x = 0,  x(t) = (u · cos θ) · t\n• Vertical: u_y = u · sin θ,  a_y = -g,  y(t) = (u · sin θ) · t - ½·g·t²';
    s1Exp = 'Motion decomposes into two independent perpendicular components: uniform velocity horizontally and uniform acceleration vertically under gravity.';
    s1Spoken = 'Dekho beta, projectile motion mein horizontal aur vertical velocity components separate formulate karte hain.';

    s2Title = 'Trajectory Equation & Peak Calculation';
    s2Formula = '1) Time of Flight: T = (2·u·sin θ) / g\n2) Maximum Height: H = (u²·sin² θ) / (2·g)\n3) Horizontal Range: R = (u²·sin 2θ) / g';
    s2Exp = 'At maximum height, vertical velocity component v_y = 0. Substituting t = u·sin θ / g yields maximum height H and total horizontal range R.';
    s2Spoken = 'Step 2 mein vertical velocity zero karke maximum height aur horizontal range calculate karte hain.';

    s3Title = 'Final Kinematic Result & Takeaway';
    s3Formula = '• Range Expression: R = (u² · sin 2θ) / g\n• Maximum Condition: θ = 45° where sin 2θ = 1 ⇒ R_max = u² / g\n• Verification: Neglecting air resistance, path is strictly parabolic';
    s3Exp = 'Maximum horizontal range occurs at launch angle 45 degrees. Complementary launch angles θ and (90° - θ) yield identical horizontal ranges.';
    s3Spoken = 'Aur yeh raha final result: maximum range 45 degree angle par milta hai!';
    diagSpoken = 'Pehle left board par parabolic trajectory aur launch velocity vector ko note karo.';
    defaultHinglish = `${diagSpoken} ${s1Spoken} ${s2Spoken} ${s3Spoken}`;
  }

  // 2. Query LLM for dynamic, high-fidelity question-specific plan
  const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
  if (groqKey) {
    try {
      const prompt = `You are Dr. Vikram Sharma, an elite Indian STEM faculty member teaching a student live in front of an interactive classroom smartboard.
Analyze the following question and produce a synchronized teaching plan with rich explanations:
- Left board has the visual physical diagram/schematic and question statement.
- Right board has the step-by-step solution with rich pedagogical explanations written directly on the board.
- Spoken Hinglish explanation for the voice tutor exactly matching what is written on each card.

Question: "${cleanQ}"
Chapter: "${chapterName || 'Physics/STEM'}"
Topic: "${topic || ''}"
Solution Reference: "${solutionText || ''}"
Options: ${JSON.stringify(options || [])}
Correct Answer: "${correctAnswer || ''}"

Return STRICT JSON only:
{
  "diagramType": "circuit|rolling_incline|lens|projectile|fbd|oscillator|concept",
  "diagramTitle": "Concise diagram title",
  "diagramExplanation": "Clear description of visual forces, axes, and components shown in the diagram.",
  "diagramSpoken": "Dekho beta, pehle left side board par diagram aur physical system note karo...",
  "examTip": "One golden teacher exam tip / pitfall (1 crisp sentence)",
  "step1": {
    "title": "GIVEN SETUP & GOVERNING PRINCIPLE",
    "formula": "• Stated variables with units\\n• Primary governing formula",
    "explanation": "Detailed explanation of why this governing formula applies and how given variables connect (2-3 clear sentences for the board)",
    "spokenScript": "Ab right side board par Step 1 note karo... [what teacher speaks for Step 1 in Hinglish]"
  },
  "step2": {
    "title": "STEP-BY-STEP DERIVATION & SUBSTITUTION",
    "formula": "1) Working step 1...\\n2) Working step 2...\\n3) Intermediate algebraic simplification",
    "explanation": "Detailed algebraic explanation walking through each mathematical substitution step by step (2-3 clear sentences for the board)",
    "spokenScript": "Ab Step 2 mein values substitute karke solve karte hain... [what teacher speaks for Step 2 in Hinglish]"
  },
  "step3": {
    "title": "FINAL ANSWER & VERIFIED RESULT",
    "formula": "Final Answer: [value with SI units]  ${correctAnswer ? `[Option ${correctAnswer}]` : ''}",
    "explanation": "Physical sanity check confirming why this calculated magnitude and unit makes physical sense (2-3 clear sentences for the board)",
    "spokenScript": "Aur yeh raha hamara final answer... [what teacher speaks for Step 3 in Hinglish]"
  },
  "hinglishBrief": "Complete smooth natural spoken lecture (4-5 sentences) combining the spoken scripts smoothly."
}`;

      const modelsToTry = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
      const VALID_DIAGRAMS = ['rolling_incline', 'lens', 'circuit', 'projectile', 'fbd', 'oscillator', 'concept'];

      for (const m of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: m,
              messages: [
                { role: 'system', content: 'You output valid strict JSON only for classroom smartboard tutoring.' },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2,
              max_tokens: 850
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.step1 && parsed.step2 && parsed.step3) {
                const rawDiag = (parsed.diagramType || '').toLowerCase().trim();
                const cleanDiag = VALID_DIAGRAMS.includes(rawDiag) ? rawDiag : defaultDiagType;

                const s1 = parsed.step1 || {};
                const s2 = parsed.step2 || {};
                const s3 = parsed.step3 || {};

                const fullHinglish = parsed.hinglishBrief || [
                  parsed.diagramSpoken || diagSpoken,
                  s1.spokenScript || s1Spoken,
                  s2.spokenScript || s2Spoken,
                  s3.spokenScript || s3Spoken
                ].filter(Boolean).join(' ');

                return {
                  questionId,
                  diagram: {
                    type: cleanDiag,
                    title: parsed.diagramTitle || defaultTitle,
                    explanation: parsed.diagramExplanation || 'Visual model representing the physical coordinate system.',
                    spokenScript: parsed.diagramSpoken || diagSpoken
                  },
                  examTip: parsed.examTip || defaultTip,
                  solution: {
                    step1: {
                      title: s1.title || s1Title,
                      formula: s1.formula || s1Formula,
                      explanation: s1.explanation || s1Exp,
                      spokenScript: s1.spokenScript || s1Spoken,
                      teacherNote: s1.spokenScript || s1Spoken
                    },
                    step2: {
                      title: s2.title || s2Title,
                      formula: s2.formula || s2Formula,
                      explanation: s2.explanation || s2Exp,
                      spokenScript: s2.spokenScript || s2Spoken,
                      teacherNote: s2.spokenScript || s2Spoken
                    },
                    step3: {
                      title: s3.title || s3Title,
                      formula: s3.formula || s3Formula,
                      explanation: s3.explanation || s3Exp,
                      spokenScript: s3.spokenScript || s3Spoken,
                      teacherNote: s3.spokenScript || s3Spoken
                    }
                  },
                  hinglishBrief: fullHinglish,
                  source: `GROQ_${m.toUpperCase()}`
                };
              }
            }
          }
        } catch (innerErr) {
          // try next model
        }
      }
    } catch (err) {
      console.warn('[AI VOICE TUTOR] Groq smartboard generation fallback:', err.message);
    }
  }

  // 3. Fallback Plan
  return {
    questionId,
    diagram: {
      type: defaultDiagType,
      title: defaultTitle,
      explanation: 'Visual physical system schematic and boundary coordinates.',
      spokenScript: diagSpoken
    },
    examTip: defaultTip,
    solution: {
      step1: { title: s1Title, formula: s1Formula, explanation: s1Exp, spokenScript: s1Spoken, teacherNote: s1Spoken },
      step2: { title: s2Title, formula: s2Formula, explanation: s2Exp, spokenScript: s2Spoken, teacherNote: s2Spoken },
      step3: { title: s3Title, formula: s3Formula, explanation: s3Exp, spokenScript: s3Spoken, teacherNote: s3Spoken }
    },
    hinglishBrief: defaultHinglish,
    source: 'CURATED_TEACHER_LOGIC'
  };
}

module.exports = {
  cleanLatexForSpeech,
  generateHinglishAudioBrief,
  answerStudentInterruption,
  synthesizeNeuralAudio,
  generateSmartboardTeachingPlan,
  NEURAL_VOICES
};
