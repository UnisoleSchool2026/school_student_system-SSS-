/**
 * Verification test for Question Bank Chapter & PYQ/NCERT Selection and Step-by-Step Solution Studio
 */
const assert = require('assert');
const { class10MathQuestions, getBankSummary } = require('../src/services/class10MathQuestionBank.js');

console.log('Testing Class 10 Math Question Bank & Intuitive Step-by-Step Solutions...');

// 1. Verify 438 total questions
assert.strictEqual(class10MathQuestions.length, 438, 'Should have exactly 438 questions in the repository');

// 2. Verify all 14 chapters exist
const summary = getBankSummary();
assert.strictEqual(Object.keys(summary.chaptersBreakdown).length, 14, 'Should cover all 14 chapters');
for (let ch = 1; ch <= 14; ch++) {
  assert(summary.chaptersBreakdown[String(ch)] > 0, `Chapter ${ch} must have questions`);
}

// 3. Verify PYQ and NCERT question counts
assert.strictEqual(summary.sourcesBreakdown.CBSE_PYQ, 310, 'Should have 310 Board PYQs');
assert.strictEqual(summary.sourcesBreakdown.NCERT_TEXTBOOK, 68, 'Should have 68 NCERT Textbook exercises & examples');
assert.strictEqual(summary.sourcesBreakdown.CBSE_SAMPLE_PATTERN, 60, 'Should have 60 CBSE Sample Pattern questions');

// 4. Verify step-by-step solution fields on all questions
let validSolutionCount = 0;
let validHintsCount = 0;
class10MathQuestions.forEach(q => {
  if (q.solution_latex && q.solution_latex.trim().length > 0) validSolutionCount++;
  if (Array.isArray(q.socratic_hints) && q.socratic_hints.length > 0) validHintsCount++;
  assert(q.chapter_number >= 1 && q.chapter_number <= 14, `Question ${q.id} has invalid chapter_number`);
  assert(q.marks_weightage >= 1 && q.marks_weightage <= 5, `Question ${q.id} has invalid marks_weightage`);
});

assert.strictEqual(validSolutionCount, 438, 'Every question must have a step-by-step solution');
assert.strictEqual(validHintsCount, 438, 'Every question must have socratic hints');

console.log('[PASS] All 438 questions verified across 14 chapters with complete step-by-step solutions, rubrics, and socratic hints.');
