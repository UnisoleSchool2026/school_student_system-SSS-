// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: MULTI-LLM QUESTION GENERATION ENGINE
// Dual Engine: Google Gemini 1.5 & Groq (LPU Llama-3.3) with Automatic Failover
// Grounded in NCERT Curriculum and Class 10/11/12 Board Blueprints
// ============================================================================

require('dotenv').config();

/**
 * Generate curriculum-compliant LaTeX question using Groq or Gemini LLM
 * @param {object} params
 * @param {string} params.grade e.g., '10', '11', '12'
 * @param {string} params.subject e.g., 'Science', 'Mathematics', 'Physics'
 * @param {string} params.chapter e.g., 'Light - Reflection and Refraction', 'Trigonometry'
 * @param {string} params.board e.g., 'CBSE', 'HP_BOARD', 'JEE_MAIN', 'NEET'
 * @param {string} params.difficulty e.g., 'EASY', 'MEDIUM', 'HARD'
 * @param {string} params.questionType e.g., 'MCQ_SINGLE', 'NUMERICAL', 'SUBJECTIVE_DERIVATION'
 * @param {string} params.provider 'auto' | 'gemini' | 'groq'
 */
async function generateLlmQuestion({
  grade = '10',
  subject = 'Science',
  chapter = 'Light – Reflection and Refraction',
  ncertSection = '9.2 Spherical Mirrors and Mirror Formula',
  board = 'CBSE',
  difficulty = 'MEDIUM',
  questionType = 'NUMERICAL',
  provider = 'auto'
}) {
  const geminiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';

  console.log(`[LLM ENGINE] Request: Class ${grade} ${subject} - ${chapter} (${board}) | Provider: ${provider}`);

  // Build the strict pedagogical prompt grounded in NCERT & Board patterns
  const systemPrompt = `You are the Lead Academic Assessment Specialist for Unisole AI School.
Your objective is to generate authentic, curriculum-grounded assessment questions for Class ${grade} (${board} & State Boards).
You MUST adhere strictly to:
1. Pristine LaTeX mathematical formatting: use $...$ for inline formulas and $$...$$ for display equations.
2. Direct alignment with the official NCERT textbook for Class ${grade} ${subject}.
3. CBSE / HPBOSE Board blueprint marking scheme: specify step-by-step rubrics.
4. If MCQ, each wrong option (distractor) MUST have a specific diagnostic reason explaining the conceptual trap.
5. Return ONLY a valid JSON object matching the requested schema. No conversational preamble.`;

  const userPrompt = `Generate a high quality assessment question for:
- Class: ${grade}
- Subject: ${subject}
- NCERT Chapter: ${chapter}
- NCERT Section: ${ncertSection}
- Curriculum Board: ${board} (HP Board / CBSE alignment)
- Difficulty: ${difficulty}
- Format: ${questionType}

Output strictly in this JSON format:
{
  "question_latex": "The question text with clean LaTeX like $f = -15\\\\,\\\\text{cm}$",
  "options_latex": [
    { "key": "A", "latex": "$...$", "is_correct": false, "distractor_trap": "Reason for error" },
    { "key": "B", "latex": "$...$", "is_correct": true, "distractor_trap": null }
  ],
  "correct_answer_latex": "B or the final numerical value",
  "solution_latex": "Step-by-step derivation with clear equations",
  "socratic_hints": [
    "Hint 1 prompting method without giving answer",
    "Hint 2 focusing on formula application"
  ],
  "step_rubric": [
    { "step": 1, "description": "Formula statement & sign convention", "marks": 1.0 },
    { "step": 2, "description": "Substitution & calculation", "marks": 1.0 },
    { "step": 3, "description": "Final value with SI unit", "marks": 1.0 }
  ],
  "ncert_mapping": {
    "chapter_name": "${chapter}",
    "ncert_section": "${ncertSection}",
    "page_reference": "NCERT Class ${grade}",
    "pyq_similarity": "${board} Board (Similar to 2023/2022 Question)",
    "marks": 3
  },
  "benchmark_time_seconds": 120,
  "bloom_level": "APPLICATION"
}`;

  // 1. Try Groq if selected or in auto mode with active key
  if ((provider === 'groq' || provider === 'auto') && groqKey) {
    try {
      console.log('[LLM ENGINE] Calling Groq Cloud API with LPU acceleration...');
      const groqResult = await callGroqApi({ apiKey: groqKey, systemPrompt, userPrompt });
      if (groqResult) {
        const cleanPayload = sanitizeQuestionPayload(groqResult.data);
        return {
          id: `groq_${Date.now()}`,
          llm_provider: `Groq LPU (${groqResult.modelUsed})`,
          inference_time_ms: groqResult.durationMs,
          ...cleanPayload,
          curriculum_board: board,
          grade,
          subject,
          is_ai_generated: true,
          generated_at: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('[LLM ENGINE] Groq API call failed. Falling back to Gemini:', err.message);
    }
  }

  // 2. Try Gemini if selected or in auto mode with active key
  if ((provider === 'gemini' || provider === 'auto') && geminiKey) {
    try {
      console.log('[LLM ENGINE] Calling Google Gemini API...');
      const geminiResult = await callGeminiApi({ apiKey: geminiKey, systemPrompt, userPrompt });
      if (geminiResult) {
        const cleanPayload = sanitizeQuestionPayload(geminiResult.data);
        return {
          id: `gemini_${Date.now()}`,
          llm_provider: `Google Gemini (${geminiResult.modelUsed})`,
          inference_time_ms: geminiResult.durationMs,
          ...cleanPayload,
          curriculum_board: board,
          grade,
          subject,
          is_ai_generated: true,
          generated_at: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('[LLM ENGINE] Gemini API call failed. Falling back to NCERT PYQ Bank:', err.message);
    }
  }

  // 3. Fallback: Curated Subject-Specific Question Bank (Strict Subject Isolation)
  console.log(`[LLM ENGINE] Offline/deterministic generation for Class ${grade} ${subject} -> ${chapter}`);
  const fallbackQ = getSubjectSpecificFallbackQuestion({ subject, chapter, grade, board, difficulty });
  
  return {
    id: `subj_pyq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    llm_provider: 'HAPS Subject-Specific NCERT & Board PYQ Bank (Strict Isolation)',
    ...fallbackQ,
    grade: String(grade),
    subject,
    chapter: fallbackQ.chapter || chapter,
    chapter_name: fallbackQ.chapter || chapter,
    curriculum_board: board,
    is_ai_generated: false,
    generated_at: new Date().toISOString()
  };
}

/**
 * Fallback generator ensuring 100% subject isolation (Chemistry never produces Physics, etc.)
 */
function getSubjectSpecificFallbackQuestion({ subject = '', chapter = '', grade = '12', board = 'CBSE', difficulty = 'MEDIUM' }) {
  let inMemoryStore = null;
  try {
    inMemoryStore = require('../config/database').inMemoryStore;
  } catch (e) {}

  const sLower = (subject || '').toLowerCase().trim();
  const cLower = (chapter || '').toLowerCase().trim();
  const banks = inMemoryStore?.subjectBanks || {};

  // 1. CHEMISTRY
  if (sLower.includes('chem')) {
    const chemBank = banks.senior_chemistry || [];
    const chapterMatches = chemBank.filter(q => {
      const qChap = (q.chapter_name || q.chapter || '').toLowerCase();
      return qChap.includes(cLower) || cLower.includes(qChap);
    });
    if (chapterMatches.length > 0) {
      return chapterMatches[Math.floor(Math.random() * chapterMatches.length)];
    }
    if (chemBank.length > 0) {
      return chemBank[Math.floor(Math.random() * chemBank.length)];
    }
    // High-yield Chemistry fallback if bank unavailable
    return {
      question_latex: "For a first-order chemical reaction, the half-life period $t_{1/2}$ is $69.3\\,\\text{min}$. Calculate the time required for $99\\%$ completion of the reaction. (Take $\\log 10 = 1, \\ln 2 = 0.693$).",
      options_latex: [
        { key: "A", latex: "$t = 460.6\\,\\text{min}$", is_correct: true, distractor_trap: null },
        { key: "B", latex: "$t = 138.6\\,\\text{min}$", is_correct: false, distractor_trap: "Confused 99% completion with $2 \\times t_{1/2}$" },
        { key: "C", latex: "$t = 693.0\\,\\text{min}$", is_correct: false, distractor_trap: "Multiplied $t_{1/2}$ by 10 directly without using logarithmic rate relation" },
        { key: "D", latex: "$t = 230.3\\,\\text{min}$", is_correct: false, distractor_trap: "Calculated time for 90% completion instead of 99%" }
      ],
      correct_answer_latex: "t = 460.6\\,\\text{min}",
      solution_latex: "$$k = \\frac{0.693}{t_{1/2}} = \\frac{0.693}{69.3} = 0.01\\,\\text{min}^{-1}$$.\nFor 99% completion, $[A] = [A]_0 - 0.99[A]_0 = 0.01[A]_0$.\n$$t = \\frac{2.303}{k}\\log\\left(\\frac{[A]_0}{0.01[A]_0}\\right) = \\frac{2.303}{0.01}\\log(100) = \\frac{2.303 \\times 2}{0.01} = 460.6\\,\\text{min}$$.",
      socratic_hints: [
        "What is the relation between rate constant $k$ and half-life $t_{1/2}$ for a first-order reaction?",
        "What fraction of reactant $[A]/[A]_0$ remains after 99% reaction completes?"
      ],
      step_rubric: [
        { step: 1, description: "Calculate rate constant $k = 0.01\\text{ min}^{-1}$", marks: 1.0 },
        { step: 2, description: "Substitute remaining concentration $[A] = 0.01[A]_0$ into first order equation", marks: 1.0 },
        { step: 3, description: "Final answer $t = 460.6\\text{ min}$ with unit", marks: 1.0 }
      ],
      benchmark_time_seconds: 90
    };
  }

  // 2. BIOLOGY
  if (sLower.includes('bio')) {
    const bioBank = banks.senior_biology || [];
    const chapterMatches = bioBank.filter(q => {
      const qChap = (q.chapter_name || q.chapter || '').toLowerCase();
      return qChap.includes(cLower) || cLower.includes(qChap);
    });
    if (chapterMatches.length > 0) {
      return chapterMatches[Math.floor(Math.random() * chapterMatches.length)];
    }
    if (bioBank.length > 0) {
      return bioBank[Math.floor(Math.random() * bioBank.length)];
    }
    const { getCuratedClass10Question } = require('./class10PyqBank');
    return getCuratedClass10Question('Science', 'Life Processes', board);
  }

  // 3. MATHEMATICS
  if (sLower.includes('math')) {
    const mathBank = String(grade) === '10' ? (banks.class10_maths || []) : (banks.senior_mathematics || []);
    const chapterMatches = mathBank.filter(q => {
      const qChap = (q.chapter_name || q.chapter || '').toLowerCase();
      return qChap.includes(cLower) || cLower.includes(qChap);
    });
    if (chapterMatches.length > 0) {
      return chapterMatches[Math.floor(Math.random() * chapterMatches.length)];
    }
    if (mathBank.length > 0) {
      return mathBank[Math.floor(Math.random() * mathBank.length)];
    }
    const { getCuratedClass10Question } = require('./class10PyqBank');
    return getCuratedClass10Question('Mathematics', chapter, board);
  }

  // 4. PHYSICS
  if (sLower.includes('phys')) {
    const phyBank = banks.senior_physics || [];
    const chapterMatches = phyBank.filter(q => {
      const qChap = (q.chapter_name || q.chapter || '').toLowerCase();
      return qChap.includes(cLower) || cLower.includes(qChap);
    });
    if (chapterMatches.length > 0) {
      return chapterMatches[Math.floor(Math.random() * chapterMatches.length)];
    }
    if (phyBank.length > 0) {
      return phyBank[Math.floor(Math.random() * phyBank.length)];
    }
  }

  // 5. CLASS 10 SCIENCE OR DEFAULT
  const { getCuratedClass10Question } = require('./class10PyqBank');
  return getCuratedClass10Question(subject, chapter, board);
}

/**
 * Extract and parse JSON safely from LLM output (handles markdown code fences and reasoning prefixes)
 */
function cleanAndParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();

  // Strip markdown code fences if present: ```json ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // Attempt greedy regex match for innermost or outermost balanced JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        // Fall through
      }
    }
    throw new Error(`Unable to parse LLM JSON response: ${text.slice(0, 150)}...`);
  }
}

/**
 * Call Groq Cloud API using native high-speed fetch with verified models
 */
async function callGroqApi({ apiKey, systemPrompt, userPrompt }) {
  const start = Date.now();
  const modelsToTry = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.25,
          max_tokens: 2500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq model ${model} HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const durationMs = Date.now() - start;
      const content = json.choices[0].message.content;
      const parsedData = cleanAndParseJson(content);

      return {
        data: parsedData,
        modelUsed: model,
        durationMs
      };
    } catch (err) {
      lastError = err;
      console.warn(`[LLM ENGINE] Groq model ${model} attempt failed: ${err.message}. Trying next model...`);
    }
  }

  throw lastError || new Error('All Groq model attempts failed.');
}

/**
 * Call Google Gemini API using native fetch with timeout guard
 */
async function callGeminiApi({ apiKey, systemPrompt, userPrompt }) {
  const start = Date.now();
  const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const model of geminiModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout guard

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nTask Instructions:\n${userPrompt}\n\nIMPORTANT: Return ONLY a valid JSON object starting with { and ending with }.` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.25
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini ${model} HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const durationMs = Date.now() - start;
      const rawText = json.candidates[0].content.parts[0].text;
      const parsedData = cleanAndParseJson(rawText);

      return {
        data: parsedData,
        modelUsed: model,
        durationMs
      };
    } catch (err) {
      lastError = err;
      console.warn(`[LLM ENGINE] Gemini model ${model} attempt failed: ${err.message}.`);
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed.');
}

function sanitizeLatexString(str) {
  if (!str || typeof str !== 'string') return str;
  let s = str.replace(/\\\]\\/g, '\\]');
  s = s.replace(/\\\]\s*\\/g, '\\]');
  s = s.replace(/([:;,])\s*\\\s*(?=\\\[|\$\$)/g, '$1\n');
  return s;
}

function sanitizeQuestionPayload(data) {
  if (!data || typeof data !== 'object') return data;
  const q = { ...data };
  if (q.question_latex) q.question_latex = sanitizeLatexString(q.question_latex);
  if (q.solution_latex) q.solution_latex = sanitizeLatexString(q.solution_latex);
  if (Array.isArray(q.options_latex)) {
    q.options_latex = q.options_latex.map(opt => ({
      ...opt,
      latex: sanitizeLatexString(opt.latex),
      distractor_trap: opt.distractor_trap ? sanitizeLatexString(opt.distractor_trap) : opt.distractor_trap
    }));
  }
  if (Array.isArray(q.socratic_hints)) {
    q.socratic_hints = q.socratic_hints.map(h => sanitizeLatexString(h));
  }
  if (Array.isArray(q.step_rubric)) {
    q.step_rubric = q.step_rubric.map(r => ({
      ...r,
      description: sanitizeLatexString(r.description)
    }));
  }
  return q;
}

module.exports = {
  generateLlmQuestion,
  sanitizeLatexString,
  sanitizeQuestionPayload
};

