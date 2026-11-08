// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: GROQ VISION MODEL PROVIDER
// Alternative Provider Adapter for Comparative Golden Set Evaluation
// ============================================================================

const VisionModelProvider = require('./modelProvider.interface');
const config = require('../../config/visionModels.config');

class GroqVisionProvider extends VisionModelProvider {
  constructor(customConfig = {}) {
    super();
    this.config = { ...config.groq, ...customConfig };
    this.apiKey = this.config.apiKey || process.env.GROQ_API_KEY || '';
    this.apiBaseUrl = this.config.apiBaseUrl || 'https://api.groq.com/openai/v1';
  }

  async checkHealth() {
    if (!this.apiKey) {
      return { ok: false, error: 'GROQ_API_KEY is missing from environment.' };
    }
    return { ok: true, provider: 'GROQ', defaultModel: this.config.defaultModel };
  }

  async evaluatePage({
    imageBase64,
    mimeType = 'image/jpeg',
    pageNumber = 1,
    candidateQuestions = []
  }) {
    if (!this.apiKey) {
      throw new Error('Groq API key is not configured.');
    }

    const modelName = this.config.defaultModel;
    const url = `${this.apiBaseUrl}/chat/completions`;

    const systemPrompt = `You are a certified CBSE Master Senior Secondary Academic Examiner evaluating physical handwritten answer sheets.
Analyze the handwritten sheet image, transcribe the student's handwritten work faithfully, find each question number, split deductions into steps, and award marks step-by-step.
Output ONLY a valid JSON object matching this structure:
{
  "page": ${pageNumber},
  "evaluations": [
    {
      "question_no": "1",
      "page": ${pageNumber},
      "type": "long",
      "transcription": "...",
      "selected_option": null,
      "steps": [
        {
          "step_no": 1,
          "student_step": "...",
          "scheme_step": "...",
          "correct": true,
          "marks_awarded": 1,
          "max_marks": 1,
          "mistake_type": "NONE",
          "reason": "..."
        }
      ],
      "total_awarded": 1,
      "total_max": 1,
      "confidence": 0.85,
      "needs_review": false,
      "review_reason": null
    }
  ]
}`;

    const promptText = `Evaluate this student handwritten page (Page ${pageNumber}) against the test questions below:\n` +
      candidateQuestions.map(q => `Q${q.question_no || q.questionIndex || ''}: ${q.question_latex || q.questionText || ''} [Max: ${q.max_marks || q.marks || 1}M]`).join('\n');

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: this.config.temperature || 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const parsed = JSON.parse(content);
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      page: parsed.page || pageNumber,
      evaluations: parsed.evaluations || [],
      rawText: content,
      modelUsed: modelName,
      modelTier: 'GROQ_VISION',
      usage: data.usage || {},
      latencyMs,
      confidence: 0.82
    };
  }
}

module.exports = GroqVisionProvider;
