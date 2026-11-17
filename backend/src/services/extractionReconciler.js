// ============================================================================
// EXTRACTION RECONCILER & COUNT AUDIT ENGINE
// Manifest vs Extraction verification: counts, sequence, marks sum & mode rules
// Post-office sorting desk: counts every pile against manifest before delivery
// ============================================================================

const { STATUS_LIFECYCLE } = require('./questionCanonicalSchema');

/**
 * Reconciles extracted questions against expected manifest
 */
function reconcileExtraction(manifest = {}, extractedQuestions = [], context = {}) {
  const issues = [];
  const warnings = [];
  const sectionBreakdown = [];

  const actualTotalQ = extractedQuestions.length;
  const isAdHoc = Boolean(manifest.isAdHocWorksheet || manifest.declaredTotalQuestions == null);
  const expectedTotalQ = isAdHoc ? actualTotalQ : (manifest.declaredTotalQuestions || 0);
  const expectedTotalMarks = manifest.declaredTotalMarks || 0;

  if (actualTotalQ === 0) {
    issues.push('Zero questions extracted from the provided source.');
  }

  // 1. Sequence and Numbering Audit
  const seenNumbers = new Map();
  const duplicateNumbers = [];
  const numbersFound = [];

  extractedQuestions.forEach((q, idx) => {
    const qNum = Number(q.questionNumber || q.question_number || idx + 1);
    numbersFound.push(qNum);
    if (seenNumbers.has(qNum)) {
      duplicateNumbers.push(qNum);
    } else {
      seenNumbers.set(qNum, q);
    }
  });

  const missingNumbers = [];
  if (!isAdHoc && expectedTotalQ > 0) {
    for (let i = 1; i <= expectedTotalQ; i++) {
      if (!seenNumbers.has(i)) {
        missingNumbers.push(i);
      }
    }
  }

  // 2. Section Breakdown & Marks Audit
  let calculatedMarksSum = 0;
  const sections = Array.isArray(manifest.sections) && manifest.sections.length > 0 ? manifest.sections : [];

  if (sections.length > 0 && !isAdHoc) {
    sections.forEach(sec => {
      const secQuestions = extractedQuestions.filter(q => {
        const qNum = Number(q.questionNumber || q.question_number);
        if (Number.isFinite(qNum) && qNum >= 1 && sec.startQ && sec.endQ) {
          return qNum >= sec.startQ && qNum <= sec.endQ;
        }
        return q.sectionLabel && q.sectionLabel.toUpperCase() === sec.label.toUpperCase();
      });

      const secActualCount = secQuestions.length;
      const secPassed = secActualCount === sec.count;

      if (!secPassed) {
        issues.push(`Section ${sec.label}: Expected ${sec.count} questions (Q${sec.startQ}–Q${sec.endQ}), but extracted ${secActualCount}.`);
      }

      secQuestions.forEach(q => {
        const qMarks = Number(q.marks || q.marks_weightage || sec.marksPerQ);
        calculatedMarksSum += qMarks;
      });

      sectionBreakdown.push({
        label: sec.label,
        name: sec.name || `Section ${sec.label}`,
        expectedCount: sec.count,
        actualCount: secActualCount,
        marksPerQ: sec.marksPerQ,
        passed: secPassed
      });
    });
  } else {
    // Ad-hoc input: group extracted questions by mark category
    const marksGroups = new Map();
    extractedQuestions.forEach(q => {
      const qMarks = Number(q.marks || q.marks_weightage || 1);
      calculatedMarksSum += qMarks;
      marksGroups.set(qMarks, (marksGroups.get(qMarks) || 0) + 1);
    });

    Array.from(marksGroups.entries()).sort((a, b) => a[0] - b[0]).forEach(([m, count]) => {
      sectionBreakdown.push({
        label: `${m}M`,
        name: `${m} Mark Question${count > 1 ? 's' : ''}`,
        expectedCount: count,
        actualCount: count,
        marksPerQ: m,
        passed: true
      });
    });
  }

  // 3. Overall Count & Marks Discrepancies
  if (!isAdHoc && expectedTotalQ > 0 && actualTotalQ !== expectedTotalQ) {
    issues.push(`Total Count Mismatch: Manifest declared ${expectedTotalQ} questions, but extracted ${actualTotalQ} (${actualTotalQ < expectedTotalQ ? 'under-extracted' : 'over-extracted'}).`);
  }

  if (duplicateNumbers.length > 0) {
    issues.push(`Duplicate Question Numbers Detected: ${duplicateNumbers.join(', ')}.`);
  }

  if (missingNumbers.length > 0 && !isAdHoc) {
    issues.push(`Missing Question Numbers: Q${missingNumbers.join(', Q')}.`);
  }

  if (!isAdHoc && expectedTotalMarks > 0 && calculatedMarksSum !== expectedTotalMarks && context.mode === 'BOARD') {
    warnings.push(`Marks Sum Divergence: Declared ${expectedTotalMarks} marks, calculated marks sum is ${calculatedMarksSum}.`);
  }

  // 4. MCQ Completeness & Quality Audit
  extractedQuestions.forEach((q, idx) => {
    const qNum = q.questionNumber || q.question_number || idx + 1;
    const format = String(q.question_format || q.type || '').toUpperCase();
    const opts = Array.isArray(q.options_latex) ? q.options_latex : (Array.isArray(q.options) ? q.options : []);

    if (format === 'MCQ_SINGLE' || format === 'MCQ') {
      if (opts.length < 4) {
        warnings.push(`Q${qNum}: Standard MCQ has ${opts.length} options instead of 4.`);
      }
      const hasCorrect = opts.some(o => o.is_correct || o.isCorrect) || Boolean(q.correct_answer || q.correctAnswer);
      if (!hasCorrect) {
        warnings.push(`Q${qNum}: Correct answer key is unassigned.`);
      }
    }
  });

  // 5. Mode Rules Audit
  if (context.mode === 'COMPETITIVE') {
    extractedQuestions.forEach((q, idx) => {
      const qNum = q.questionNumber || q.question_number || idx + 1;
      const format = String(q.question_format || q.type || '').toUpperCase();
      const opts = Array.isArray(q.options_latex) ? q.options_latex : (Array.isArray(q.options) ? q.options : []);
      if (!['MCQ_SINGLE', 'MCQ', 'ASSERTION_REASON', 'NUMERICAL_INTEGER'].includes(format) && opts.length === 0) {
        warnings.push(`Q${qNum}: Subjective descriptive question detected in COMPETITIVE mode. Consider moving to BOARD mode.`);
      }
    });
  }

  const passed = issues.length === 0;
  const status = passed ? STATUS_LIFECYCLE.PENDING_REVIEW : STATUS_LIFECYCLE.DRAFT;

  return {
    passed,
    status,
    actualTotalQuestions: actualTotalQ,
    expectedTotalQuestions: expectedTotalQ || actualTotalQ,
    calculatedMarksSum,
    expectedTotalMarks: expectedTotalMarks || calculatedMarksSum,
    duplicateNumbers,
    missingNumbers,
    sectionBreakdown,
    issues,
    warnings,
    reconciliationTimestamp: new Date().toISOString()
  };
}

/**
 * Normalizes question attributes according to the paper profile and manifest
 */
function normalizeQuestionWithManifest(q = {}, manifest = {}, index = 0) {
  const qNum = Number(q.questionNumber || q.question_number || index + 1);
  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];

  let matchedSection = null;
  for (const sec of sections) {
    if (qNum >= sec.startQ && qNum <= sec.endQ) {
      matchedSection = sec;
      break;
    }
  }

  // Derive marks from matched section manifest rather than index guesswork
  const assignedMarks = matchedSection ? matchedSection.marksPerQ : (q.marks_weightage || q.marks || 1);
  const sectionLabel = matchedSection ? matchedSection.label : (q.sectionLabel || null);

  // Detect internal choice (OR alternative)
  const fullText = (q.question_latex || q.questionPrompt || '').toLowerCase();
  const hasChoice = /\b(?:or|\(or\))\b/i.test(fullText) || /either\b[\s\S]*?\bor\b/i.test(fullText);

  return {
    ...q,
    questionNumber: qNum,
    question_number: qNum,
    sectionLabel,
    marks: assignedMarks,
    marks_weightage: assignedMarks,
    hasInternalChoice: hasChoice
  };
}

module.exports = {
  reconcileExtraction,
  normalizeQuestionWithManifest
};
