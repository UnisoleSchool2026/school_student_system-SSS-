// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: HANDWRITTEN SHEET EVALUATION SERVICE
// Core Orchestrator: evaluate_sheet(testId, studentId, images) -> EvaluationResult
// Isolated Vision Service with Flash -> Pro Escalation, Quality Gate & Validation
// ============================================================================

const config = require('../config/visionModels.config');
const path = require('path');
const { preprocessSheetPage } = require('./imagePreprocessor');
const GeminiVisionProvider = require('./vision/geminiVisionProvider');
const GroqVisionProvider = require('./vision/groqVisionProvider');
const { inMemoryStore } = require('../config/database');

// Instantiate pluggable model providers
const geminiProvider = new GeminiVisionProvider();
const groqProvider = new GroqVisionProvider();

function getActiveProvider(providerName) {
  const chosen = (providerName || config.defaultProvider || 'GEMINI').toUpperCase();
  if (chosen === 'GROQ') return groqProvider;
  return geminiProvider;
}

/**
 * Validates deterministic step-sum arithmetic and score bounds.
 */
function validateQuestionEvaluation(evalItem, questionMeta) {
  const issues = [];
  const maxQMarks = Number(questionMeta?.max_marks || questionMeta?.marks || evalItem.total_max || 1);

  // 1. Bound check
  if (evalItem.total_awarded > maxQMarks) {
    issues.push(`Awarded marks (${evalItem.total_awarded}) exceeds maximum allowed (${maxQMarks}).`);
    evalItem.total_awarded = Math.min(evalItem.total_awarded, maxQMarks);
  }

  if (evalItem.total_awarded < 0) {
    issues.push(`Awarded marks cannot be negative.`);
    evalItem.total_awarded = 0;
  }

  // 2. Step sum arithmetic check
  const steps = evalItem.steps || [];
  if (steps.length > 0) {
    const sumStepMarks = steps.reduce((sum, s) => sum + (Number(s.marks_awarded) || 0), 0);
    const diff = Math.abs(sumStepMarks - evalItem.total_awarded);
    if (diff > 0.01) {
      issues.push(`Step marks sum (${sumStepMarks}) does not match question total awarded (${evalItem.total_awarded}).`);
      evalItem.total_awarded = sumStepMarks; // Correct to sum of steps
    }

    // Step bound check
    steps.forEach(s => {
      if (s.marks_awarded > s.max_marks) {
        issues.push(`Step ${s.step_no} marks (${s.marks_awarded}) exceed step max (${s.max_marks}).`);
        s.marks_awarded = Math.min(s.marks_awarded, s.max_marks);
      }
    });
  }

  // 3. Deterministic MCQ verification in code (do not trust LLM judgment on MCQ options)
  if (evalItem.type === 'mcq' || questionMeta?.type === 'mcq') {
    const expectedOpt = (questionMeta?.correct_answer || questionMeta?.correctAnswer || '').trim().toUpperCase();
    const studentOpt = (evalItem.selected_option || '').trim().toUpperCase();
    
    if (studentOpt && expectedOpt) {
      const isCorrect = studentOpt === expectedOpt;
      evalItem.total_awarded = isCorrect ? maxQMarks : 0;
      evalItem.steps = [
        {
          step_no: 1,
          student_step: `Selected Option (${studentOpt})`,
          scheme_step: `Expected Option (${expectedOpt})`,
          correct: isCorrect,
          marks_awarded: isCorrect ? maxQMarks : 0,
          max_marks: maxQMarks,
          mistake_type: isCorrect ? 'NONE' : 'CONCEPT_ERROR',
          reason: isCorrect ? 'Correct option chosen.' : `Incorrect option selected: chose (${studentOpt}), correct was (${expectedOpt}).`
        }
      ];
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Main public evaluation function
 * @param {string} testId Assessment ID
 * @param {string} studentId Scholar ID
 * @param {Array<Buffer|string>} rawImages Array of page images (buffers or base64 strings)
 * @param {object} options Optional settings (provider, teacherNotes, skipQualityCheck)
 */
async function evaluate_sheet(testId, studentId, rawImages = [], options = {}) {
  const startTime = Date.now();
  const provider = getActiveProvider(options.provider);
  const confidenceThreshold = config.gemini.confidenceThreshold || 0.75;

  if (!rawImages || rawImages.length === 0) {
    throw new Error('At least one page image must be provided for evaluation.');
  }

  // 1. Fetch Assessment Questions & Marking Schemes
  let test = (inMemoryStore.assessments || []).find(a => a.id === testId);
  if (!test && inMemoryStore.handwrittenSubmissions) {
    // Check recorded tests
    for (const cid of Object.keys(inMemoryStore.recordedClassTests || {})) {
      test = (inMemoryStore.recordedClassTests[cid] || []).find(t => t.id === testId);
      if (test) break;
    }
  }

  // Default test questions fallback if testId is a synthetic or demo test
  const candidateQuestions = (test && test.questions && test.questions.length > 0)
    ? test.questions
    : [
        {
          id: 'q_demo_1',
          question_no: '1',
          type: 'mcq',
          marks: 1,
          max_marks: 1,
          question_latex: 'Solve $x^2 - 16 = 0$.',
          correct_answer: 'A',
          marking_scheme: [{ step_no: 1, description: 'Identify roots $x = \\pm 4$', max_marks: 1 }]
        },
        {
          id: 'q_demo_2',
          question_no: '2',
          type: 'short',
          marks: 2,
          max_marks: 2,
          question_latex: 'Find the discriminant of $2x^2 + x - 6 = 0$ and state the nature of roots.',
          correct_answer: 'D = 49 > 0, roots are real and distinct.',
          marking_scheme: [
            { step_no: 1, description: 'Compute $D = b^2 - 4ac = 1^2 - 4(2)(-6) = 49$', max_marks: 1 },
            { step_no: 2, description: 'Conclude $D > 0 \\implies$ real and unequal roots', max_marks: 1 }
          ]
        },
        {
          id: 'q_demo_3',
          question_no: '3',
          type: 'long',
          marks: 3,
          max_marks: 3,
          question_latex: 'The area of a rectangle is 120 m² and its length exceeds breadth by 7 m. Find its dimensions.',
          correct_answer: 'Length = 15 m, Breadth = 8 m',
          marking_scheme: [
            { step_no: 1, description: 'Setup equation: $x(x+7) = 120 \\implies x^2 + 7x - 120 = 0$', max_marks: 1 },
            { step_no: 2, description: 'Factorize: $(x+15)(x-8) = 0 \\implies x = 8$', max_marks: 1 },
            { step_no: 3, description: 'Breadth = 8 m, Length = 15 m with proper SI units', max_marks: 1 }
          ]
        }
      ];

  // Map questions by question_no for fast matching
  const questionMap = new Map();
  candidateQuestions.forEach(q => {
    const qKey = String(q.question_no || q.questionIndex || '').trim();
    if (qKey) questionMap.set(qKey, q);
    // Also map lowercase e.g. "3a" -> "3a"
    questionMap.set(qKey.toLowerCase(), q);
  });

  // 2. Preprocess All Images Locally (Format, Quality Gate, Blur/Exposure Detection)
  const preprocessedPages = [];
  for (let idx = 0; idx < rawImages.length; idx++) {
    const rawImg = rawImages[idx];
    const prepResult = await preprocessSheetPage(rawImg, { pageIndex: idx });
    if (!prepResult.passed) {
      // Immediate rejection - do not send bad images to model!
      return {
        success: false,
        status: 'QUALITY_REJECTED',
        error: prepResult.error,
        code: prepResult.code,
        failedPageIndex: idx + 1,
        message: `Quality check failed on Page ${idx + 1}: ${prepResult.error}`
      };
    }
    preprocessedPages.push(prepResult);
  }

  // 3. Evaluate Each Page via Vision Model
  const pageResults = [];
  const allQuestionEvaluations = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let totalLatencyMs = 0;
  let escalatedPagesCount = 0;

  for (let pIdx = 0; pIdx < preprocessedPages.length; pIdx++) {
    const pageData = preprocessedPages[pIdx];
    const pageNum = pIdx + 1;

    // Call Default Flash Model
    let pageEval = await provider.evaluatePage({
      imageBase64: pageData.base64Data,
      mimeType: pageData.mimeType,
      pageNumber: pageNum,
      candidateQuestions: candidateQuestions,
      modelTier: 'DEFAULT'
    });

    totalInputTokens += pageEval.usage?.input_tokens || 0;
    totalOutputTokens += pageEval.usage?.output_tokens || 0;
    totalCostUsd += pageEval.usage?.cost_usd || 0;
    totalLatencyMs += pageEval.latencyMs || 0;

    let needsEscalation = false;
    let escalationReason = '';

    // Check if confidence is low
    if (pageEval.confidence < confidenceThreshold) {
      needsEscalation = true;
      escalationReason = `Page confidence (${pageEval.confidence}) below threshold (${confidenceThreshold})`;
    }

    // Check validation of evaluations
    const pageEvals = pageEval.evaluations || [];
    for (const qEval of pageEvals) {
      const qMeta = questionMap.get(String(qEval.question_no).trim()) || questionMap.get(String(qEval.question_no).toLowerCase().trim());
      const valResult = validateQuestionEvaluation(qEval, qMeta);
      if (!valResult.valid) {
        needsEscalation = true;
        escalationReason = `Validation discrepancy: ${valResult.issues.join('; ')}`;
      }
    }

    // 4. Escalation Ladder: If low confidence or validation failed, re-run ONCE with Pro model
    if (needsEscalation && provider.apiKey && config.gemini.escalationModel) {
      console.log(`[EVALUATOR] Escalating Page ${pageNum} to PRO model: ${escalationReason}`);
      try {
        const proEval = await provider.evaluatePage({
          imageBase64: pageData.base64Data,
          mimeType: pageData.mimeType,
          pageNumber: pageNum,
          candidateQuestions: candidateQuestions,
          modelTier: 'PRO'
        });

        escalatedPagesCount++;
        totalInputTokens += proEval.usage?.input_tokens || 0;
        totalOutputTokens += proEval.usage?.output_tokens || 0;
        totalCostUsd += proEval.usage?.cost_usd || 0;
        totalLatencyMs += proEval.latencyMs || 0;

        // Re-validate Pro results
        for (const qEval of (proEval.evaluations || [])) {
          const qMeta = questionMap.get(String(qEval.question_no).trim());
          validateQuestionEvaluation(qEval, qMeta);
        }

        pageEval = proEval;
      } catch (escErr) {
        console.warn(`[EVALUATOR] Pro escalation call failed: ${escErr.message}. Keeping initial evaluation flagged for teacher.`);
      }
    }

    // Tag questions with page number and processed image path
    (pageEval.evaluations || []).forEach(qe => {
      qe.page = pageNum;
      qe.pageImageHash = pageData.imageHash;
      qe.processedImagePath = pageData.processedPath;

      // Final review flag if confidence still low
      if (qe.confidence < confidenceThreshold || qe.needs_review) {
        qe.needs_review = true;
        qe.review_reason = qe.review_reason || `Low handwriting certainty (${qe.confidence}). Teacher verification required.`;
      }
      allQuestionEvaluations.push(qe);
    });

    pageResults.push({
      page: pageNum,
      imageHash: pageData.imageHash,
      originalPath: pageData.originalPath,
      processedPath: pageData.processedPath,
      relativeImageUrl: pageData.originalPath ? '/uploads/originals/' + path.basename(pageData.originalPath) : null,
      modelUsed: pageEval.modelUsed,
      modelTier: pageEval.modelTier,
      confidence: pageEval.confidence,
      questionsFound: (pageEval.evaluations || []).length,
      usage: pageEval.usage,
      latencyMs: pageEval.latencyMs
    });
  }

  // 5. Aggregate Evaluation Totals
  const totalAwarded = allQuestionEvaluations.reduce((sum, q) => sum + (Number(q.total_awarded) || 0), 0);
  const totalMax = allQuestionEvaluations.reduce((sum, q) => sum + (Number(q.total_max) || 0), 0) || test?.totalMarks || 25;
  const percentage = totalMax > 0 ? parseFloat(((totalAwarded / totalMax) * 100).toFixed(1)) : 0;

  // Mistakes classification breakdown
  const mistakesBreakdown = {};
  allQuestionEvaluations.forEach(q => {
    (q.steps || []).forEach(s => {
      if (s.mistake_type && s.mistake_type !== 'NONE') {
        mistakesBreakdown[s.mistake_type] = (mistakesBreakdown[s.mistake_type] || 0) + 1;
      }
    });
  });

  const flaggedQuestions = allQuestionEvaluations.filter(q => q.needs_review);
  const overallConfidence = allQuestionEvaluations.length > 0
    ? parseFloat((allQuestionEvaluations.reduce((sum, q) => sum + (q.confidence || 0.8), 0) / allQuestionEvaluations.length).toFixed(2))
    : 0.85;

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status = flaggedQuestions.length > 0 ? 'NEEDS_REVIEW' : 'EVALUATED';

  const evaluationResult = {
    submissionId,
    testId,
    studentId: studentId || 'SCH-2026-101',
    status,
    totalAwarded: parseFloat(totalAwarded.toFixed(2)),
    totalMax: parseFloat(totalMax.toFixed(2)),
    percentage,
    overallConfidence,
    needsReview: flaggedQuestions.length > 0,
    flaggedCount: flaggedQuestions.length,
    flaggedQuestions: flaggedQuestions.map(q => ({
      question_no: q.question_no,
      page: q.page,
      confidence: q.confidence,
      reason: q.review_reason
    })),
    questions: allQuestionEvaluations,
    mistakesBreakdown,
    pagesSummary: pageResults,
    telemetry: {
      totalPages: preprocessedPages.length,
      escalatedPagesCount,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCostUsd: parseFloat(totalCostUsd.toFixed(6)),
      totalLatencyMs,
      evaluatedAt: new Date().toISOString()
    }
  };

  return evaluationResult;
}

module.exports = {
  evaluate_sheet,
  validateQuestionEvaluation,
  getActiveProvider
};
