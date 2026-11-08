// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: GOOGLE GEMINI VISION MODEL PROVIDER
// Production Vision Grader: Structured JSON Schema, Follow-Through Marks, Escalation
// ============================================================================

const VisionModelProvider = require('./modelProvider.interface');
const config = require('../../config/visionModels.config');

class GeminiVisionProvider extends VisionModelProvider {
  constructor(customConfig = {}) {
    super();
    this.config = { ...config.gemini, ...customConfig };
    this.apiKey = this.config.apiKey || process.env.GEMINI_API_KEY || '';
    this.apiBaseUrl = this.config.apiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async checkHealth() {
    if (!this.apiKey) {
      return { ok: false, error: 'GEMINI_API_KEY is missing from environment.' };
    }
    return { ok: true, provider: 'GEMINI', defaultModel: this.config.defaultModel };
  }

  /**
   * Builds the official Gemini Structured Output JSON Schema for step-wise evaluation.
   */
  getEvaluationSchema() {
    return {
      type: 'OBJECT',
      properties: {
        page: { type: 'INTEGER' },
        evaluations: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question_no: { 
                type: 'STRING',
                description: 'The exact question number written by the student (e.g. 1, 2, 3a, 12). If absent or unclear, flag needs_review.' 
              },
              page: { type: 'INTEGER' },
              type: { 
                type: 'STRING', 
                enum: ['mcq', 'short', 'long'] 
              },
              transcription: { 
                type: 'STRING', 
                description: 'Verbatim transcription of the student written answer. If characters or numbers are unclear, transcribe as [unclear: best guess]. Never guess digits.' 
              },
              selected_option: { 
                type: 'STRING', 
                description: 'For MCQs only: extracted chosen option letter (A, B, C, D) or null.' 
              },
              steps: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    step_no: { type: 'INTEGER' },
                    student_step: { type: 'STRING', description: 'What the student specifically wrote for this step.' },
                    scheme_step: { type: 'STRING', description: 'Criteria from the marking scheme.' },
                    correct: { type: 'BOOLEAN' },
                    marks_awarded: { type: 'NUMBER' },
                    max_marks: { type: 'NUMBER' },
                    mistake_type: {
                      type: 'STRING',
                      enum: [
                        'NONE',
                        'CONCEPT_ERROR',
                        'FORMULA_ERROR',
                        'SUBSTITUTION_ERROR',
                        'CALCULATION_ERROR',
                        'UNIT_MISSING',
                        'INCOMPLETE_ANSWER',
                        'SKIPPED_STEP',
                        'ILLEGIBLE_OR_AMBIGUOUS',
                        'NO_ATTEMPT'
                      ]
                    },
                    reason: { type: 'STRING', description: 'Concise pedagogical reason for marks awarded or deducted.' }
                  },
                  required: ['step_no', 'student_step', 'scheme_step', 'correct', 'marks_awarded', 'max_marks', 'mistake_type', 'reason']
                }
              },
              total_awarded: { type: 'NUMBER', description: 'Sum of marks_awarded across all steps for this question.' },
              total_max: { type: 'NUMBER', description: 'Total maximum marks possible for this question.' },
              confidence: { type: 'NUMBER', description: 'Float between 0.0 and 1.0 indicating reading clarity and marking certainty.' },
              needs_review: { type: 'BOOLEAN', description: 'True if handwriting is ambiguous, question number is missing, or low confidence.' },
              review_reason: { type: 'STRING', description: 'Specific reason for flagging for teacher review, or null.' }
            },
            required: ['question_no', 'page', 'type', 'transcription', 'steps', 'total_awarded', 'total_max', 'confidence', 'needs_review']
          }
        }
      },
      required: ['page', 'evaluations']
    };
  }

  /**
   * Formats candidate test questions and marking schemes into structured prompt context.
   */
  formatRubricPrompt(candidateQuestions) {
    let rubricText = 'TEST QUESTIONS & STEP-WISE MARKING SCHEMES:\n';
    candidateQuestions.forEach((q, i) => {
      const qNum = q.question_no || q.questionIndex || `${i + 1}`;
      rubricText += `\n--- QUESTION ${qNum} [Max Marks: ${q.max_marks || q.marks || 1}, Type: ${q.type || 'long'}] ---\n`;
      rubricText += `Question Statement: ${q.question_latex || q.questionText || q.question || ''}\n`;
      rubricText += `Expected Answer / Final Value: ${q.correct_answer || q.correctAnswer || 'See rubric'}\n`;
      rubricText += `Step-by-Step Marking Scheme Rubric:\n`;

      const steps = q.step_rubric || q.marking_scheme || [];
      if (steps.length > 0) {
        steps.forEach(s => {
          rubricText += `  • Step ${s.step_no || s.step}: ${s.description || s.title || ''} [Marks: ${s.max_marks || s.marks}] (Follow-through allowed: ${s.allow_follow_through !== false ? 'YES' : 'NO'})\n`;
        });
      } else {
        rubricText += `  • Step 1: Complete method and final deduction [Marks: ${q.max_marks || q.marks || 1}]\n`;
      }
    });
    return rubricText;
  }

  /**
   * Evaluates a single page image with Gemini Vision.
   */
  async evaluatePage({
    imageBase64,
    mimeType = 'image/jpeg',
    pageNumber = 1,
    candidateQuestions = [],
    modelTier = 'DEFAULT'
  }) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const modelName = modelTier === 'PRO' ? this.config.escalationModel : this.config.defaultModel;
    const url = `${this.apiBaseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`;

    const systemInstruction = `You are a certified CBSE Master Senior Secondary Academic Examiner evaluating physical handwritten answer sheets.
Your mission is to read the student's answer sheet, locate every question number the student wrote, transcribe their work faithfully, and award marks step by step.

CRITICAL EVALUATION RULES:
1. FAITHFUL TRANSCRIPTION:
   - Transcribe the student's handwriting verbatim, preserving mathematical symbols, line breaks, and crossed-out work.
   - If any character, symbol, or digit is ambiguous or partially obscured, write it as [unclear: best guess] and lower the confidence score. NEVER silently guess or invent digits, since a single digit changes mathematical truth.
2. QUESTION IDENTIFICATION & MATCHING:
   - Look for the question number written by the student (e.g. "Q1", "1.", "Ans 3a", "Q. 12"). Match it to the relevant question in the provided rubric.
   - If the student wrote an answer without a clear question number, or if the number is ambiguous, set needs_review: true with a clear review_reason.
   - If a question was unattempted, do not hallucinate text. Set mistake_type: "NO_ATTEMPT", total_awarded: 0, steps: [].
3. STEP-WISE MARKING & FOLLOW-THROUGH (ERROR CARRIED FORWARD):
   - Break the student's deduction into steps and compare each step directly with the marking scheme.
   - Award partial credit for each valid step: Formula written, values substituted, algebraic manipulations, and final unit.
   - FOLLOW-THROUGH RULE: If a student makes an algebraic or arithmetic slip in an early step (e.g. Step 1), deduct marks for that step. However, if in subsequent steps (e.g. Step 2 & 3) the student applies the correct theoretical method to that erroneous value, award full follow-through marks for the subsequent steps.
4. MCQs:
   - For MCQs, extract the written or circled option letter (A, B, C, or D) into selected_option.
5. MISTAKE TAXONOMY:
   - For any step where marks are lost, classify mistake_type strictly from:
     ['NONE', 'CONCEPT_ERROR', 'FORMULA_ERROR', 'SUBSTITUTION_ERROR', 'CALCULATION_ERROR', 'UNIT_MISSING', 'INCOMPLETE_ANSWER', 'SKIPPED_STEP', 'ILLEGIBLE_OR_AMBIGUOUS', 'NO_ATTEMPT']
6. MATHEMATICAL CONSISTENCY:
   - The sum of marks_awarded across all steps MUST EXACTLY equal total_awarded for that question.
   - marks_awarded for any step must NEVER exceed max_marks for that step.`;

    const rubricContext = this.formatRubricPrompt(candidateQuestions);

    const userPrompt = `Attached is Page ${pageNumber} of a student's handwritten answer script.
Evaluate this page against the provided questions and step-wise marking schemes below.
Output strictly valid JSON matching the schema.

${rubricContext}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: userPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: this.config.temperature,
        topP: this.config.topP,
        maxOutputTokens: this.config.maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: this.getEvaluationSchema()
      }
    };

    const startTime = Date.now();
    let responseJson = null;
    let rawText = '';
    let usage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };

    // Execute with Exponential Backoff (retries on 429/503)
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errBody = await response.text();
          if (response.status === 429 || response.status >= 500) {
            // Rate limit or server glitch: exponential backoff
            const backoffMs = Math.pow(2, attempts) * 1000 + Math.random() * 500;
            console.warn(`[GEMINI API] HTTP ${response.status} on attempt ${attempts}. Backing off for ${Math.round(backoffMs)}ms...`);
            await new Promise(r => setTimeout(r, backoffMs));
            continue;
          }
          throw new Error(`Gemini API HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const candidate = data.candidates && data.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
          throw new Error('Gemini API returned empty candidate response.');
        }

        rawText = candidate.content.parts.map(p => p.text).join('\n').trim();
        responseJson = JSON.parse(rawText);

        // Extract token usage
        if (data.usageMetadata) {
          const inTokens = data.usageMetadata.promptTokenCount || 0;
          const outTokens = data.usageMetadata.candidatesTokenCount || 0;
          const inRate = modelTier === 'PRO' ? this.config.pricing.proInputPer1k : this.config.pricing.flashInputPer1k;
          const outRate = modelTier === 'PRO' ? this.config.pricing.proOutputPer1k : this.config.pricing.flashOutputPer1k;
          const cost = ((inTokens / 1000) * inRate) + ((outTokens / 1000) * outRate);

          usage = {
            input_tokens: inTokens,
            output_tokens: outTokens,
            total_tokens: inTokens + outTokens,
            cost_usd: parseFloat(cost.toFixed(6))
          };
        }

        break; // Success
      } catch (err) {
        lastError = err;
        if (attempts >= maxAttempts) throw err;
        await new Promise(r => setTimeout(r, 1500 * attempts));
      }
    }

    if (!responseJson) {
      throw lastError || new Error('Failed to obtain JSON from Gemini.');
    }

    const latencyMs = Date.now() - startTime;

    // Calculate aggregate confidence across all questions on this page
    const evals = responseJson.evaluations || [];
    let avgConfidence = 1.0;
    if (evals.length > 0) {
      avgConfidence = evals.reduce((sum, e) => sum + (e.confidence || 0.8), 0) / evals.length;
    }

    return {
      success: true,
      page: responseJson.page || pageNumber,
      evaluations: evals,
      rawText,
      modelUsed: modelName,
      modelTier,
      usage,
      latencyMs,
      confidence: parseFloat(avgConfidence.toFixed(2))
    };
  }
}

module.exports = GeminiVisionProvider;
