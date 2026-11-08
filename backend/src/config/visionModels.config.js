// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: VISION MODEL CONFIGURATION & ESCALATION RULES
// Multi-Tier Vision AI Config: Flash Default -> Pro Escalation -> Human Review
// ============================================================================

module.exports = {
  // Provider Selection: 'GEMINI' | 'GROQ' | 'MOCK'
  defaultProvider: process.env.VISION_PROVIDER || 'GEMINI',

  // Google Gemini Configuration (Official Gemini 1.5 / 2.5 Vision)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    apiBaseUrl: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    
    // Model Hierarchy: Do NOT hardcode in logic - override via environment variables
    defaultModel: process.env.VISION_MODEL_FLASH || 'gemini-3.8-flash',
    escalationModel: process.env.VISION_MODEL_PRO || 'gemini-pro-latest',
    
    // Confidence & Escalation Thresholds
    confidenceThreshold: parseFloat(process.env.VISION_CONFIDENCE_THRESHOLD || '0.75'),
    maxEscalationRetries: 1,

    // Generation Hyperparameters
    temperature: 0.1, // Low temperature for deterministic grading & strict schema compliance
    topP: 0.95,
    maxOutputTokens: 4096,

    // Batch API settings for bulk cohort evaluation (500+ pages)
    batchThresholdPages: parseInt(process.env.VISION_BATCH_THRESHOLD || '100', 10),
    batchPollIntervalMs: 10000,

    // Token Pricing in USD per 1,000 tokens (Standard Google AI Studio rates)
    pricing: {
      flashInputPer1k: 0.000075,
      flashOutputPer1k: 0.0003,
      proInputPer1k: 0.00125,
      proOutputPer1k: 0.005
    }
  },

  // Groq Vision Configuration (Pluggable alternative for benchmarking)
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
    confidenceThreshold: 0.70,
    temperature: 0.1,
    maxOutputTokens: 4096
  },

  // Local Image Preparation Quality Gate
  imageQuality: {
    minDimensionPx: 600,
    maxDimensionPx: 2000,
    targetDimensionPx: 1800, // Target long edge
    jpegQuality: 85,
    blurVarianceThreshold: 80.0, // Laplacian variance threshold for blur detection
    minBrightness: 40,  // Rejects severe underexposure
    maxBrightness: 245  // Rejects severe overexposure/washed out pages
  },

  // Standardized Mistake Taxonomy (for downstream telemetry & personalized assignments)
  mistakeTypes: {
    NONE: 'No error identified - step is fully accurate',
    CONCEPT_ERROR: 'Fundamental conceptual or theoretical mistake',
    FORMULA_ERROR: 'Incorrect physics/math formula or theorem stated',
    SUBSTITUTION_ERROR: 'Values incorrectly plugged into formula or algebraic signs flipped',
    CALCULATION_ERROR: 'Arithmetic, factoring, or algebraic computation slip',
    UNIT_MISSING: 'Final magnitude correct but standard SI unit omitted or incorrect',
    INCOMPLETE_ANSWER: 'Step left partially solved without reaching valid deduction',
    SKIPPED_STEP: 'Mandatory CBSE rubric step omitted completely',
    ILLEGIBLE_OR_AMBIGUOUS: 'Handwriting smudged, crossed out, or unclear to verify',
    NO_ATTEMPT: 'Question unattempted by student'
  }
};
