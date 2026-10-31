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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
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
              source: 'GROQ_AI'
            };
          }
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
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
              source: 'GROQ_AI'
            };
          }
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

module.exports = {
  cleanLatexForSpeech,
  generateHinglishAudioBrief,
  answerStudentInterruption,
  synthesizeNeuralAudio,
  NEURAL_VOICES
};
