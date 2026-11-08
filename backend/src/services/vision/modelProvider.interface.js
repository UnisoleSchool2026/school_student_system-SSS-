// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: VISION MODEL PROVIDER INTERFACE
// Abstract Contract for Pluggable Multimodal Vision Evaluators (Gemini, Groq, etc.)
// ============================================================================

class VisionModelProvider {
  /**
   * Evaluates a single preprocessed sheet page image against relevant test questions.
   * @param {object} params
   * @param {string} params.imageBase64 Base64 encoded JPEG buffer
   * @param {string} params.mimeType MIME type (e.g. image/jpeg)
   * @param {number} params.pageNumber Page sequence number (1-based)
   * @param {Array<object>} params.candidateQuestions Relevant questions and marking schemes for this page
   * @param {string} [params.modelTier='DEFAULT'] 'DEFAULT' (Flash) or 'PRO' (Escalation)
   * @returns {Promise<{ success: boolean, data: object, rawText: string, model: string, usage: object, confidence: number }>}
   */
  async evaluatePage(params) {
    throw new Error('evaluatePage() must be implemented by subclass.');
  }

  /**
   * Health check / validation of provider credentials.
   */
  async checkHealth() {
    throw new Error('checkHealth() must be implemented by subclass.');
  }
}

module.exports = VisionModelProvider;
