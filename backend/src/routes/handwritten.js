// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: HANDWRITTEN SHEET EVALUATION ROUTER
// Multi-page Upload, Quality Gate, Step-by-Step Vision Grading & Teacher Audit
// ============================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { inMemoryStore } = require('../config/database');
const { evaluate_sheet } = require('../services/handwrittenEvaluator');
const { emitEvent } = require('../kafka/producer');

// Configure Multer for disk upload
const uploadDir = path.resolve(__dirname, '../../uploads/originals');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Ensure inMemoryStore arrays exist
if (!inMemoryStore.handwrittenSubmissions) inMemoryStore.handwrittenSubmissions = [];
if (!inMemoryStore.teacherCorrections) inMemoryStore.teacherCorrections = [];
if (!inMemoryStore.personalAssignments) inMemoryStore.personalAssignments = [];

// Seed 3 realistic initial submissions for demonstration so the review screen is immediately populated
if (!inMemoryStore.handwrittenSubmissions.some(s => s.submissionId === 'sub_demo_101')) {
  inMemoryStore.handwrittenSubmissions = [
    {
      submissionId: 'sub_demo_101',
      id: 'sub_demo_101',
      testId: 'test_demo_quad',
      testTitle: 'Class 10-A • Unit Assessment: Roots of Quadratic Equations',
      subject: 'Class 10th Mathematics',
      classId: '10-Maths-A',
      studentId: 'SCH-2026-101',
      rollNo: '101',
      studentName: 'Aryan Sharma',
      status: 'NEEDS_REVIEW',
      totalAwarded: 22.0,
      totalMax: 25.0,
      percentage: 88.0,
      overallConfidence: 0.72,
      needsReview: true,
      flaggedCount: 1,
      flaggedQuestions: [
        { question_no: '3', page: 1, confidence: 0.68, reason: 'Digit in factoring partially obscured with cross-out. Requires examiner signoff.' }
      ],
      questions: [
        {
          question_no: '1',
          page: 1,
          type: 'mcq',
          transcription: 'Ans 1. (A) x = ±4',
          selected_option: 'A',
          total_awarded: 1,
          total_max: 1,
          confidence: 0.96,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Selected Option (A)', scheme_step: 'Expected Option (A)', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct root magnitude and sign.' }
          ]
        },
        {
          question_no: '2',
          page: 1,
          type: 'short',
          transcription: 'Q2. 2x^2 + x - 6 = 0\na = 2, b = 1, c = -6\nD = b^2 - 4ac = (1)^2 - 4(2)(-6) = 1 + 48 = 49\nSince D > 0, roots are real and distinct.',
          total_awarded: 2,
          total_max: 2,
          confidence: 0.94,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'D = (1)^2 - 4(2)(-6) = 49', scheme_step: 'Compute discriminant D = 49', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate algebraic substitution.' },
            { step_no: 2, student_step: 'D > 0 implies roots real & distinct', scheme_step: 'State nature of roots', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct conclusion.' }
          ]
        },
        {
          question_no: '3',
          page: 1,
          type: 'long',
          transcription: 'Q3. Let breadth = x, Length = x + 7\nArea = x(x+7) = 120\nx^2 + 7x - 120 = 0\n(x + 15)(x - 8) = 0   [Partially smudged digit]\nx = 8 (discard x = -15)\nBreadth = 8 m, Length = 15 m',
          total_awarded: 3,
          total_max: 3,
          confidence: 0.68,
          needs_review: true,
          review_reason: 'Digit in factoring partially obscured with cross-out. Requires examiner signoff.',
          steps: [
            { step_no: 1, student_step: 'x(x+7) = 120 => x^2 + 7x - 120 = 0', scheme_step: 'Quadratic equation setup', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Equation properly modeled.' },
            { step_no: 2, student_step: '(x+15)(x-8) = 0 => x = 8', scheme_step: 'Factorization and root selection', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Valid factoring.' },
            { step_no: 3, student_step: 'Breadth = 8 m, Length = 15 m', scheme_step: 'Dimensions with SI units', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Standard metric dimensions stated.' }
          ]
        },
        {
          question_no: '4',
          page: 1,
          type: 'numerical',
          transcription: 'Q4. 3x^2 - 2kx + 12 = 0 has equal roots.\na = 3, b = -2k, c = 12\nD = 0 => (-2k)^2 - 4(3)(12) = 0\n4k^2 - 144 = 0 => k^2 = 36 => k = ±6',
          total_awarded: 3,
          total_max: 4,
          confidence: 0.91,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Equal roots condition D = 0', scheme_step: 'State D = 0 condition', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Criterion identified.' },
            { step_no: 2, student_step: '(-2k)^2 - 4(3)(12) = 0 => 4k^2 = 144', scheme_step: 'Substitute coefficients into D', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate algebraic simplification.' },
            { step_no: 3, student_step: 'k = ±6', scheme_step: 'Extract both positive and negative roots', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Both signs retained.' },
            { step_no: 4, student_step: 'Omitted verification step for k = ±6 in original quadratic', scheme_step: 'Check degeneracy constraint', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SKIPPED_STEP', reason: 'Final verification skipped.' }
          ]
        },
        {
          question_no: '5',
          page: 2,
          type: 'long',
          transcription: 'Q5. Complete the square for ax^2 + bx + c = 0.\nx^2 + (b/a)x + c/a = 0\nx^2 + 2(b/2a)x + (b/2a)^2 = (b/2a)^2 - c/a\n(x + b/2a)^2 = (b^2 - 4ac)/(4a^2)\nx + b/2a = ±√(b^2 - 4ac) / 2a\nx = (-b ± √(b^2 - 4ac)) / 2a',
          total_awarded: 5,
          total_max: 5,
          confidence: 0.94,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Divide through by leading coefficient a', scheme_step: 'Normalize monic polynomial', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Step clean.' },
            { step_no: 2, student_step: 'Add (b/2a)^2 to both sides', scheme_step: 'Complete the square binomial addition', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Valid algebraic identity.' },
            { step_no: 3, student_step: 'Express LHS as (x + b/2a)^2', scheme_step: 'Perfect square reduction', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct factoring.' },
            { step_no: 4, student_step: 'Take square root with ± sign', scheme_step: 'Radical evaluation and denominator root 2a', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Both branches tracked.' },
            { step_no: 5, student_step: 'x = (-b ± √(b^2 - 4ac)) / 2a', scheme_step: 'Final quadratic formula statement', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Standard quadratic formula established.' }
          ]
        },
        {
          question_no: '6',
          page: 2,
          type: 'long',
          transcription: 'Q6. Sum of areas of two squares is 468 m^2. Difference of perimeters is 24 m.\nLet side of square 1 = x, side of square 2 = y\n4x - 4y = 24 => x - y = 6 => x = y + 6\n(y + 6)^2 + y^2 = 468\ny^2 + 12y + 36 + y^2 = 468\n2y^2 + 12y - 432 = 0 => y^2 + 6y - 216 = 0\n(y + 18)(y - 12) = 0 => y = 12 (discard y = -18)\nx = 18 m, y = 12 m',
          total_awarded: 4,
          total_max: 5,
          confidence: 0.89,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: '4x - 4y = 24 => x = y + 6', scheme_step: 'Perimeter linear equation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Perimeter modeled.' },
            { step_no: 2, student_step: '(y + 6)^2 + y^2 = 468', scheme_step: 'Sum of squares area equation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Substitution valid.' },
            { step_no: 3, student_step: 'y^2 + 6y - 216 = 0', scheme_step: 'Standard quadratic form', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Reduction accurate.' },
            { step_no: 4, student_step: '(y+18)(y-12) = 0 => y = 12', scheme_step: 'Factoring and root rejection', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct root selected.' },
            { step_no: 5, student_step: 'Forgot to state square 1 area check (18^2 + 12^2 = 324 + 144 = 468)', scheme_step: 'Mandatory verification with original geometric conditions', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SKIPPED_STEP', reason: 'Omitted verification.' }
          ]
        },
        {
          question_no: '7',
          page: 2,
          type: 'long',
          transcription: 'Q7. Train travels 360 km at uniform speed x km/h. If speed was 5 km/h more, journey takes 1 hr less.\nTime 1 = 360/x, Time 2 = 360/(x + 5)\n360/x - 360/(x + 5) = 1\n360[(x + 5) - x] / [x(x + 5)] = 1\n1800 = x^2 + 5x => x^2 + 5x - 1800 = 0\n(x + 45)(x - 40) = 0 => x = 40 km/h (speed > 0)',
          total_awarded: 4,
          total_max: 5,
          confidence: 0.90,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Time difference 360/x - 360/(x + 5) = 1', scheme_step: 'Kinematic time-distance equation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Sound algebraic formulation.' },
            { step_no: 2, student_step: '360(5) / x(x+5) = 1', scheme_step: 'LCM algebraic fraction reduction', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate numerator subtraction.' },
            { step_no: 3, student_step: 'x^2 + 5x - 1800 = 0', scheme_step: 'Polynomial standard form', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct polynomial.' },
            { step_no: 4, student_step: '(x + 45)(x - 40) = 0 => x = 40 km/h', scheme_step: 'Factorization and physical speed choice', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Discards negative speed.' },
            { step_no: 5, student_step: 'Did not compute new increased speed (45 km/h)', scheme_step: 'Sub-question: state increased speed and both travel times', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'INCOMPLETE_ANSWER', reason: 'Partial question requirement missed.' }
          ]
        }
      ],
      mistakesBreakdown: { NONE: 4 },
      pagesSummary: [
        { page: 1, modelUsed: 'gemini-1.5-flash', confidence: 0.72, questionsFound: 3, latencyMs: 740 }
      ],
      telemetry: { totalPages: 1, totalTokens: 1140, totalCostUsd: 0.0003, evaluatedAt: new Date().toISOString() }
    },
    {
      submissionId: 'sub_demo_102',
      id: 'sub_demo_102',
      testId: 'test_demo_quad',
      testTitle: 'Class 10-A • Unit Assessment: Roots of Quadratic Equations',
      subject: 'Class 10th Mathematics',
      classId: '10-Maths-A',
      studentId: 'SCH-2026-102',
      rollNo: '102',
      studentName: 'Priya Verma',
      status: 'EVALUATED',
      totalAwarded: 24.5,
      totalMax: 25.0,
      percentage: 98.0,
      overallConfidence: 0.95,
      needsReview: false,
      flaggedCount: 0,
      flaggedQuestions: [],
      questions: [
        {
          question_no: '1',
          page: 1,
          type: 'mcq',
          transcription: 'Ans 1. (A) x = ±4',
          selected_option: 'A',
          total_awarded: 1,
          total_max: 1,
          confidence: 0.98,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Selected Option (A)', scheme_step: 'Expected Option (A)', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct root magnitude and sign.' }
          ]
        },
        {
          question_no: '2',
          page: 1,
          type: 'short',
          transcription: 'Q2. 2x^2 + x - 6 = 0\na = 2, b = 1, c = -6\nD = b^2 - 4ac = 1 - 4(2)(-6) = 1 + 48 = 49\nD > 0 so roots are real and unequal.',
          total_awarded: 2,
          total_max: 2,
          confidence: 0.96,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'D = (1)^2 - 4(2)(-6) = 49', scheme_step: 'Compute discriminant D = 49', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Flawless calculation.' },
            { step_no: 2, student_step: 'Roots are real & unequal', scheme_step: 'State nature of roots', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate deduction.' }
          ]
        },
        {
          question_no: '3',
          page: 1,
          type: 'long',
          transcription: 'Q3. Let breadth = x, length = x + 7\nArea = x(x+7) = 120\nx^2 + 7x - 120 = 0\nx^2 + 15x - 8x - 120 = 0\nx(x+15) - 8(x+15) = 0\n(x+15)(x-8) = 0 => x = 8 or x = -15\nSince breadth > 0, breadth = 8 m, length = 15 m.',
          total_awarded: 3,
          total_max: 3,
          confidence: 0.96,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'x(x+7) = 120 => x^2 + 7x - 120 = 0', scheme_step: 'Quadratic equation modeling', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Perfect algebraic translation.' },
            { step_no: 2, student_step: '(x+15)(x-8) = 0 => x = 8', scheme_step: 'Linear binomial factorization', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct common terms and root.' },
            { step_no: 3, student_step: 'Breadth = 8 m, Length = 15 m', scheme_step: 'Final dimensions with standard units (m)', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Both values stated with correct SI unit.' }
          ]
        },
        {
          question_no: '4',
          page: 1,
          type: 'numerical',
          transcription: 'Q4. 3x^2 - 2kx + 12 = 0\nD = 0 for equal roots\n(-2k)^2 - 4(3)(12) = 0 => 4k^2 = 144 => k = ±6',
          total_awarded: 4,
          total_max: 4,
          confidence: 0.98,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Equal roots condition D = 0', scheme_step: 'State D = 0 condition', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Criterion identified.' },
            { step_no: 2, student_step: '(-2k)^2 - 4(3)(12) = 0 => 4k^2 = 144', scheme_step: 'Substitute coefficients into D', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate algebraic simplification.' },
            { step_no: 3, student_step: 'k = ±6', scheme_step: 'Extract both roots', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Both signs retained.' },
            { step_no: 4, student_step: 'Verified for k = 6: 3x^2 - 12x + 12 = 3(x-2)^2 = 0', scheme_step: 'Check degeneracy constraint', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Verification complete.' }
          ]
        },
        {
          question_no: '5',
          page: 2,
          type: 'long',
          transcription: 'Q5. Complete the square for ax^2 + bx + c = 0.\nx = (-b ± √(b^2 - 4ac)) / 2a',
          total_awarded: 5,
          total_max: 5,
          confidence: 0.98,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'x^2 + (b/a)x + c/a = 0', scheme_step: 'Normalize monic polynomial', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Step clean.' },
            { step_no: 2, student_step: 'Add (b/2a)^2 to both sides', scheme_step: 'Complete the square', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Valid algebraic identity.' },
            { step_no: 3, student_step: '(x + b/2a)^2 = (b^2 - 4ac)/(4a^2)', scheme_step: 'Perfect square reduction', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct factoring.' },
            { step_no: 4, student_step: 'Take square root with ± sign', scheme_step: 'Radical evaluation and denominator root 2a', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Both branches tracked.' },
            { step_no: 5, student_step: 'x = (-b ± √(b^2 - 4ac)) / 2a', scheme_step: 'Final quadratic formula statement', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Standard quadratic formula established.' }
          ]
        },
        {
          question_no: '6',
          page: 2,
          type: 'long',
          transcription: 'Q6. 4x - 4y = 24 => x - y = 6\nx^2 + y^2 = 468 => (y+6)^2 + y^2 = 468\n2y^2 + 12y - 432 = 0 => y = 12 m, x = 18 m',
          total_awarded: 5,
          total_max: 5,
          confidence: 0.97,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: '4x - 4y = 24 => x = y + 6', scheme_step: 'Perimeter linear equation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Perimeter modeled.' },
            { step_no: 2, student_step: '(y + 6)^2 + y^2 = 468', scheme_step: 'Sum of squares area equation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Substitution valid.' },
            { step_no: 3, student_step: 'y^2 + 6y - 216 = 0', scheme_step: 'Standard quadratic form', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Reduction accurate.' },
            { step_no: 4, student_step: '(y+18)(y-12) = 0 => y = 12', scheme_step: 'Factoring and root rejection', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct root selected.' },
            { step_no: 5, student_step: 'Sides are 18 m and 12 m (324 + 144 = 468 m^2)', scheme_step: 'State dimensions with units and condition check', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Exemplary execution.' }
          ]
        },
        {
          question_no: '7',
          page: 2,
          type: 'long',
          transcription: 'Q7. 360/x - 360/(x+5) = 1\nx^2 + 5x - 1800 = 0 => (x+45)(x-40) = 0\nx = 40 km/h, new speed = 45 km/h',
          total_awarded: 4.5,
          total_max: 5,
          confidence: 0.96,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Time difference 360/x - 360/(x + 5) = 1', scheme_step: 'Kinematic time-distance equation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Sound algebraic formulation.' },
            { step_no: 2, student_step: '360(5) / x(x+5) = 1', scheme_step: 'LCM algebraic fraction reduction', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate numerator subtraction.' },
            { step_no: 3, student_step: 'x^2 + 5x - 1800 = 0', scheme_step: 'Polynomial standard form', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct polynomial.' },
            { step_no: 4, student_step: '(x + 45)(x - 40) = 0 => x = 40 km/h', scheme_step: 'Factorization and physical speed choice', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Discards negative speed.' },
            { step_no: 5, student_step: 'New speed = 45 km/h, original time = 9 hrs, new time = 8 hrs', scheme_step: 'State increased speed and travel times', correct: true, marks_awarded: 0.5, max_marks: 1, mistake_type: 'NONE', reason: 'Stated times, minor notation abbreviation.' }
          ]
        }
      ],
      mistakesBreakdown: { NONE: 5 },
      pagesSummary: [{ page: 1, modelUsed: 'gemini-1.5-flash', confidence: 0.95, questionsFound: 3, latencyMs: 680 }],
      telemetry: { totalPages: 1, totalTokens: 1080, totalCostUsd: 0.00028, evaluatedAt: new Date().toISOString() }
    },
    {
      submissionId: 'sub_demo_103',
      id: 'sub_demo_103',
      testId: 'test_demo_quad',
      testTitle: 'Class 10-A • Unit Assessment: Roots of Quadratic Equations',
      subject: 'Class 10th Mathematics',
      classId: '10-Maths-A',
      studentId: 'SCH-2026-103',
      rollNo: '103',
      studentName: 'Rohit Thakur',
      status: 'NEEDS_REVIEW',
      totalAwarded: 11.0,
      totalMax: 25.0,
      percentage: 44.0,
      overallConfidence: 0.69,
      needsReview: true,
      flaggedCount: 2,
      flaggedQuestions: [
        { question_no: '2', page: 1, confidence: 0.65, reason: 'Negative sign lost during discriminant computation.' },
        { question_no: '3', page: 1, confidence: 0.70, reason: 'Incomplete factoring line.' }
      ],
      questions: [
        {
          question_no: '1',
          page: 1,
          type: 'mcq',
          transcription: 'Ans 1. (C) x = 4',
          selected_option: 'C',
          total_awarded: 0,
          total_max: 1,
          confidence: 0.95,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Selected Option (C)', scheme_step: 'Expected Option (A) x = ±4', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'CONCEPT_ERROR', reason: 'Student omitted the negative root when taking square root of 16.' }
          ]
        },
        {
          question_no: '2',
          page: 1,
          type: 'short',
          transcription: 'Q2. 2x^2 + x - 6 = 0\na = 2, b = 1, c = 6  [Sign flip on c]\nD = b^2 - 4ac = 1 - 4(2)(6) = 1 - 48 = -47\nRoots are imaginary.',
          total_awarded: 1,
          total_max: 2,
          confidence: 0.65,
          needs_review: true,
          review_reason: 'Negative sign lost during discriminant computation on c = -6. Follow-through awarded for conclusion.',
          steps: [
            { step_no: 1, student_step: 'a = 2, b = 1, c = 6 => D = 1 - 48 = -47', scheme_step: 'Identify coefficients and compute D = 49', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SUBSTITUTION_ERROR', reason: 'Sign error: copied c = +6 instead of c = -6, leading to D = -47.' },
            { step_no: 2, student_step: 'D < 0 implies roots are imaginary', scheme_step: 'State nature of roots based on D', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Follow-through mark awarded: correctly deduced imaginary roots from student’s negative discriminant.' }
          ]
        },
        {
          question_no: '3',
          page: 1,
          type: 'long',
          transcription: 'Q3. Length = x + 7, Breadth = x\nArea = x(x + 7) = 120\nx^2 + 7x - 120 = 0\n(x + 12)(x - 10) = 0   [Incorrect factoring factors]\nx = 10\nBreadth = 10, Length = 17   [No units written]',
          total_awarded: 1,
          total_max: 3,
          confidence: 0.70,
          needs_review: true,
          review_reason: 'Incorrect factorization factors (12, -10 instead of 15, -8). Unit missing in final dimensions.',
          steps: [
            { step_no: 1, student_step: 'x(x+7) = 120 => x^2 + 7x - 120 = 0', scheme_step: 'Quadratic equation modeling', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct algebraic formulation.' },
            { step_no: 2, student_step: '(x + 12)(x - 10) = 0 => x = 10', scheme_step: 'Factorization to (x + 15)(x - 8) = 0', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'CALCULATION_ERROR', reason: 'Product 12*(-10) = -120 but sum is +2, not +7.' },
            { step_no: 3, student_step: 'Breadth = 10, Length = 17', scheme_step: 'Dimensions with SI units (meters)', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'UNIT_MISSING', reason: 'Failed to write SI units (meters) and values are wrong.' }
          ]
        },
        {
          question_no: '4',
          page: 1,
          type: 'numerical',
          transcription: 'Q4. 3x^2 - 2kx + 12 = 0\nD = (-2k)^2 - 4(3)(12) = 4k^2 - 144 = 0\nk^2 = 36 => k = 6   [Missed -6]',
          total_awarded: 2,
          total_max: 4,
          confidence: 0.88,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'D = 0 for equal roots', scheme_step: 'Equal roots condition', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Criterion identified.' },
            { step_no: 2, student_step: '4k^2 = 144 => k^2 = 36', scheme_step: 'Algebraic calculation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Accurate.' },
            { step_no: 3, student_step: 'k = 6', scheme_step: 'Extract both roots ±6', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'CONCEPT_ERROR', reason: 'Lost negative root k = -6.' },
            { step_no: 4, student_step: 'No verification check', scheme_step: 'Degeneracy check', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SKIPPED_STEP', reason: 'Omitted verification.' }
          ]
        },
        {
          question_no: '5',
          page: 2,
          type: 'long',
          transcription: 'Q5. ax^2 + bx + c = 0\nx^2 + b/a x = -c/a\nx^2 + b/2a x = -c/a   [Algebraic error in coefficient 2]',
          total_awarded: 2,
          total_max: 5,
          confidence: 0.75,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'Divide by a', scheme_step: 'Normalize monic', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Step clean.' },
            { step_no: 2, student_step: 'x^2 + b/2a x = -c/a', scheme_step: 'Add (b/2a)^2 to both sides', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'FORMULA_ERROR', reason: 'Failed to add square term to both sides.' },
            { step_no: 3, student_step: 'Stuck on factorization', scheme_step: 'Perfect square reduction', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'INCOMPLETE_ANSWER', reason: 'Could not complete square.' },
            { step_no: 4, student_step: 'Wrote formula from memory: x = -b ± √(b^2-4ac)/2a', scheme_step: 'Deductive radical steps', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Stated final result.' },
            { step_no: 5, student_step: 'Steps incomplete', scheme_step: 'Rigorous proof closure', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SKIPPED_STEP', reason: 'Missing intermediate algebraic deductions.' }
          ]
        },
        {
          question_no: '6',
          page: 2,
          type: 'long',
          transcription: 'Q6. Perimeter difference = 24 => x - y = 6 => x = y + 6\nArea sum = 468 => (y+6)^2 + y^2 = 468\n2y^2 + 12y + 36 = 468 => 2y^2 + 12y - 432 = 0\ny^2 + 6y - 216 = 0\ny = 12, x = 18',
          total_awarded: 3,
          total_max: 5,
          confidence: 0.85,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: 'x - y = 6', scheme_step: 'Perimeter formulation', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Valid.' },
            { step_no: 2, student_step: '(y+6)^2 + y^2 = 468', scheme_step: 'Area sum modeling', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Valid.' },
            { step_no: 3, student_step: 'y^2 + 6y - 216 = 0', scheme_step: 'Polynomial standard form', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct.' },
            { step_no: 4, student_step: 'Jumped to y = 12 without factoring steps', scheme_step: 'Show middle term splitting factors (+18, -12)', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SKIPPED_STEP', reason: 'Skipped explicit deductive factoring step.' },
            { step_no: 5, student_step: 'x = 18, y = 12 (No units written)', scheme_step: 'State dimensions with SI meters', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'UNIT_MISSING', reason: 'Missing meter units.' }
          ]
        },
        {
          question_no: '7',
          page: 2,
          type: 'long',
          transcription: 'Q7. Speed = x. Distance = 360 km.\n360/x - 360/(x+5) = 1\n360(x+5) - 360x = x(x+5)\n1800 = x^2 + 5x => x^2 + 5x - 1800 = 0\nRoots = 40, -45',
          total_awarded: 2,
          total_max: 5,
          confidence: 0.82,
          needs_review: false,
          steps: [
            { step_no: 1, student_step: '360/x - 360/(x+5) = 1', scheme_step: 'Kinematic equation setup', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Correct time equation.' },
            { step_no: 2, student_step: 'x^2 + 5x - 1800 = 0', scheme_step: 'Cross multiply and reduce', correct: true, marks_awarded: 1, max_marks: 1, mistake_type: 'NONE', reason: 'Algebraic reduction accurate.' },
            { step_no: 3, student_step: 'Roots = 40, -45', scheme_step: 'Factoring deduction', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'SKIPPED_STEP', reason: 'Did not show factoring steps.' },
            { step_no: 4, student_step: 'Left answer as both 40 and -45', scheme_step: 'Physical rejection of negative speed', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'CONCEPT_ERROR', reason: 'Failed to discard negative velocity.' },
            { step_no: 5, student_step: 'Did not calculate new speed or travel time', scheme_step: 'Sub-question completion', correct: false, marks_awarded: 0, max_marks: 1, mistake_type: 'INCOMPLETE_ANSWER', reason: 'Unfinished.' }
          ]
        }
      ],
      mistakesBreakdown: { SUBSTITUTION_ERROR: 2, CALCULATION_ERROR: 1 },
      pagesSummary: [{ page: 1, modelUsed: 'gemini-1.5-flash', confidence: 0.69, questionsFound: 2, latencyMs: 790 }],
      telemetry: { totalPages: 1, totalTokens: 1220, totalCostUsd: 0.00032, evaluatedAt: new Date().toISOString() }
    }
  ];
}

// 1. GET /api/handwritten/submissions - List all submissions with summary counts
router.get('/submissions', (req, res) => {
  const { testId, status, classId } = req.query;
  let list = inMemoryStore.handwrittenSubmissions || [];

  if (testId) list = list.filter(s => s.testId === testId);
  if (status) list = list.filter(s => s.status === status);
  if (classId) list = list.filter(s => s.classId === classId);

  const totalCount = list.length;
  const flaggedCount = list.filter(s => s.status === 'NEEDS_REVIEW' || s.needsReview).length;
  const evaluatedCount = list.filter(s => s.status === 'EVALUATED' || s.status === 'FINALIZED').length;
  const avgScore = totalCount > 0
    ? (list.reduce((sum, s) => sum + (s.totalAwarded || 0), 0) / totalCount).toFixed(1)
    : '0';

  res.json({
    success: true,
    totalCount,
    flaggedCount,
    evaluatedCount,
    classAverage: avgScore,
    submissions: list
  });
});

// 2. GET /api/handwritten/submissions/:id - Single submission full step details
router.get('/submissions/:id', (req, res) => {
  const { id } = req.params;
  const sub = (inMemoryStore.handwrittenSubmissions || []).find(s => s.id === id || s.submissionId === id);
  if (!sub) {
    return res.status(404).json({ success: false, error: `Submission "${id}" not found.` });
  }

  // Find related audit corrections
  const corrections = (inMemoryStore.teacherCorrections || []).filter(c => c.submissionId === id);

  res.json({
    success: true,
    submission: sub,
    corrections
  });
});

// 3. POST /api/handwritten/upload-sheet - Upload and evaluate multi-page handwritten sheet
router.post('/upload-sheet', upload.array('pages', 10), async (req, res) => {
  try {
    const {
      testId = 'test_demo_quad',
      studentId = 'SCH-2026-101',
      rollNo = '101',
      studentName = 'Aryan Sharma',
      classId = '10-Maths-A',
      testTitle = 'Class Unit Assessment',
      subject = 'Class 10th Mathematics'
    } = req.body;

    let imageInputs = [];
    const isBenchmark = req.body.isBenchmark === 'true' || req.body.isBenchmark === true;

    // Check if uploaded as files via Multer
    if (req.files && req.files.length > 0) {
      imageInputs = req.files.map(f => f.path);
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Received base64 data URLs in JSON
      imageInputs = req.body.images;
    } else if (req.body.sheetImageUrl) {
      imageInputs = [req.body.sheetImageUrl];
    } else if (isBenchmark) {
      // Generate synthetic high-res benchmark sheet buffer
      const sharp = require('sharp');
      const svg = `
        <svg width="1600" height="2200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f1f5f9"/>
          <line x1="120" y1="0" x2="120" y2="2200" stroke="#f87171" stroke-width="2"/>
          ${Array.from({ length: 42 }).map((_, i) => `<line x1="0" y1="${100 + i * 48}" x2="1600" y2="${100 + i * 48}" stroke="#94a3b8" stroke-width="1.5"/>`).join('')}
          <text x="140" y="70" font-family="Courier, monospace" font-size="28" font-weight="bold" fill="#0f172a">HAPS SENIOR ACADEMIC ASSESSMENT • SCHOLAR ANSWER SCRIPT</text>
          <text x="140" y="140" font-family="Courier, monospace" font-size="22" fill="#1e3a8a">Roll #${rollNo} • ${studentName} • ${testTitle}</text>
          <text x="140" y="235" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">Ans 1. (A) x = ±4</text>
          <text x="140" y="330" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">Q2. 2x^2 + x - 6 = 0, D = 1 - 4(2)(-6) = 49 &gt; 0 (real &amp; distinct)</text>
          <text x="140" y="425" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">Q3. Let breadth = x, Length = x + 7, Area = x(x+7) = 120</text>
          <text x="140" y="475" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">x^2 + 7x - 120 = 0 =&gt; (x + 15)(x - 8) = 0 =&gt; x = 8 m, Length = 15 m</text>
          <text x="140" y="570" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">Q4. 3x^2 - 2kx + 12 = 0 has equal roots =&gt; D = 0 =&gt; (-2k)^2 - 4(3)(12) = 0</text>
          <text x="140" y="620" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">4k^2 - 144 = 0 =&gt; k^2 = 36 =&gt; k = ±6</text>
          <text x="140" y="715" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">Q5. Derive quadratic formula: ax^2 + bx + c = 0</text>
          <text x="140" y="765" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">x^2 + (b/a)x + c/a = 0 =&gt; (x + b/2a)^2 = (b^2 - 4ac)/(4a^2)</text>
          <text x="140" y="815" font-family="Courier, sans-serif" font-size="22" fill="#0f172a">x = (-b ± √(b^2 - 4ac)) / 2a</text>
        </svg>
      `;
      const sampleBuf = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
      imageInputs = [sampleBuf];
    } else {
      return res.status(400).json({
        success: false,
        error: 'No sheet images provided. Please attach at least 1 image file or base64 photo.'
      });
    }

    console.log(`[HANDWRITTEN UPLOAD] Evaluating ${imageInputs.length} page(s) for Roll #${rollNo} (${studentName})...`);

    // Run core evaluation engine
    const evalResult = await evaluate_sheet(testId, studentId, imageInputs, {
      provider: req.body.provider || 'GEMINI'
    });

    if (evalResult.status === 'QUALITY_REJECTED') {
      return res.status(400).json({
        success: false,
        code: evalResult.code,
        error: evalResult.error,
        message: evalResult.message
      });
    }

    // Attach student & test metadata
    const submissionRecord = {
      ...evalResult,
      id: evalResult.submissionId,
      rollNo,
      studentName,
      classId,
      testTitle,
      subject,
      uploadedAt: new Date().toISOString()
    };

    // Store in submission table
    inMemoryStore.handwrittenSubmissions.unshift(submissionRecord);

    // Emit real-time Kafka telemetry event
    try {
      await emitEvent('telemetry.handwritten-scan', studentId, {
        action: 'HandwrittenSheetEvaluated',
        submissionId: evalResult.submissionId,
        rollNo,
        totalAwarded: evalResult.totalAwarded,
        totalMax: evalResult.totalMax,
        percentage: evalResult.percentage,
        needsReview: evalResult.needsReview
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: evalResult.needsReview
        ? `Evaluation complete: Flagged ${evalResult.flaggedCount} question(s) with low confidence for teacher verification.`
        : 'Evaluation complete: High confidence step-by-step scoring verified.',
      submission: submissionRecord
    });

  } catch (err) {
    console.error('[HANDWRITTEN UPLOAD ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/handwritten/submissions/:id/override-step - One-click teacher adjustment
router.post('/submissions/:id/override-step', (req, res) => {
  try {
    const { id } = req.params;
    const {
      questionNo,
      stepNo,
      marksAwarded,
      marks,
      newMarks: bodyNewMarks,
      teacherNotes = '',
      teacherName = 'Mrs. Meenakshi Sharma'
    } = req.body;

    const sub = (inMemoryStore.handwrittenSubmissions || []).find(s => s.id === id || s.submissionId === id);
    if (!sub) {
      return res.status(404).json({ success: false, error: `Submission "${id}" not found.` });
    }

    const qItem = (sub.questions || []).find(q => String(q.question_no).trim() === String(questionNo).trim());
    if (!qItem) {
      return res.status(404).json({ success: false, error: `Question "${questionNo}" not found in submission.` });
    }

    const sItem = (qItem.steps || []).find(s => Number(s.step_no) === Number(stepNo));
    if (!sItem) {
      return res.status(404).json({ success: false, error: `Step ${stepNo} not found in Question ${questionNo}.` });
    }

    const oldMarks = sItem.marks_awarded;
    const rawVal = marksAwarded !== undefined ? marksAwarded : (marks !== undefined ? marks : bodyNewMarks);
    const newMarks = Math.min(sItem.max_marks, Math.max(0, Number(rawVal) || 0));

    // Apply adjustment
    sItem.marks_awarded = newMarks;
    sItem.correct = newMarks === sItem.max_marks;
    if (newMarks > oldMarks) sItem.mistake_type = 'NONE';
    sItem.teacher_override = true;
    sItem.teacher_notes = teacherNotes;

    // Recalculate question total
    qItem.total_awarded = (qItem.steps || []).reduce((sum, s) => sum + (Number(s.marks_awarded) || 0), 0);

    // If teacher modified, clear needs_review for this question if resolved
    if (qItem.needs_review) {
      qItem.needs_review = false;
      qItem.review_resolved_by = teacherName;
    }

    // Recalculate submission total & percentage
    sub.totalAwarded = parseFloat((sub.questions || []).reduce((sum, q) => sum + (Number(q.total_awarded) || 0), 0).toFixed(2));
    sub.percentage = sub.totalMax > 0 ? parseFloat(((sub.totalAwarded / sub.totalMax) * 100).toFixed(1)) : 0;
    sub.flaggedCount = (sub.questions || []).filter(q => q.needs_review).length;
    sub.needsReview = sub.flaggedCount > 0;
    sub.status = sub.needsReview ? 'NEEDS_REVIEW' : 'EVALUATED';

    // Store in teacher_corrections audit log (Golden Dataset Builder)
    const auditRecord = {
      id: `corr_${Date.now()}`,
      submissionId: id,
      studentId: sub.studentId,
      rollNo: sub.rollNo,
      questionNo,
      stepNo,
      aiMarksAwarded: oldMarks,
      teacherMarksAwarded: newMarks,
      teacherName,
      teacherNotes,
      updatedAt: new Date().toISOString()
    };
    inMemoryStore.teacherCorrections.unshift(auditRecord);

    res.json({
      success: true,
      message: `Step ${stepNo} of Q${questionNo} updated from ${oldMarks}M to ${newMarks}M. Total updated to ${sub.totalAwarded}/${sub.totalMax}.`,
      updatedQuestion: qItem,
      submission: sub,
      auditRecord
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/handwritten/submissions/:id/finalize - Approve & lock evaluation
router.post('/submissions/:id/finalize', (req, res) => {
  const { id } = req.params;
  const { teacherComments = '', teacherName = 'Mrs. Meenakshi Sharma' } = req.body;

  const sub = (inMemoryStore.handwrittenSubmissions || []).find(s => s.id === id || s.submissionId === id);
  if (!sub) {
    return res.status(404).json({ success: false, error: `Submission "${id}" not found.` });
  }

  sub.status = 'FINALIZED';
  sub.needsReview = false;
  sub.teacherVerified = true;
  sub.teacherName = teacherName;
  sub.teacherComments = teacherComments;
  sub.finalizedAt = new Date().toISOString();

  // Sync with recorded class tests student results if matching
  try {
    for (const cid of Object.keys(inMemoryStore.recordedClassTests || {})) {
      const tests = inMemoryStore.recordedClassTests[cid] || [];
      tests.forEach(t => {
        if (t.id === sub.testId && t.studentResults) {
          const sRes = t.studentResults.find(r => r.roll === sub.rollNo);
          if (sRes) {
            sRes.score = Math.round(sub.totalAwarded);
            sRes.percentage = `${sub.percentage}%`;
            sRes.tier = sub.percentage >= 80 ? 'Excellent' : (sub.percentage >= 50 ? 'Average' : 'Below Average');
          }
        }
      });
    }
  } catch (e) {}

  res.json({
    success: true,
    message: `Answer sheet evaluation for Roll #${sub.rollNo} (${sub.studentName}) approved and finalized. Score: ${sub.totalAwarded}/${sub.totalMax} (${sub.percentage}%).`,
    submission: sub
  });
});

// 6. POST /api/handwritten/submissions/:id/generate-assignment - Build personalized remedial drills
router.post('/submissions/:id/generate-assignment', (req, res) => {
  try {
    const { id } = req.params;
    const sub = (inMemoryStore.handwrittenSubmissions || []).find(s => s.id === id || s.submissionId === id);
    if (!sub) {
      return res.status(404).json({ success: false, error: `Submission "${id}" not found.` });
    }

    // Isolate student's specific mistakes
    const weakMistakes = [];
    const lostMarkSteps = [];

    (sub.questions || []).forEach(q => {
      (q.steps || []).forEach(s => {
        if (s.marks_awarded < s.max_marks || (s.mistake_type && s.mistake_type !== 'NONE')) {
          lostMarkSteps.push({
            questionNo: q.question_no,
            stepNo: s.step_no,
            criterion: s.scheme_step,
            studentWork: s.student_step,
            mistakeType: s.mistake_type || 'CALCULATION_ERROR',
            reason: s.reason
          });
          if (s.mistake_type && !weakMistakes.includes(s.mistake_type)) {
            weakMistakes.push(s.mistake_type);
          }
        }
      });
    });

    // Curate personalized remedial problem drills targeting the exact mistake patterns
    const drills = [];
    if (weakMistakes.includes('CALCULATION_ERROR') || weakMistakes.includes('SUBSTITUTION_ERROR')) {
      drills.push({
        drillNumber: 1,
        title: 'Targeted Formula Substitution & Sign Drill',
        problem: 'In the quadratic equation $3x^2 - 5x - 2 = 0$, carefully compute $D = b^2 - 4ac$ paying special attention to the negative sign on $c = -2$.',
        pedagogicalFocus: 'Avoid sign flip slips when negative constant term is multiplied by $-4ac$.'
      });
      drills.push({
        drillNumber: 2,
        title: 'Step Verification & Factoring Practice',
        problem: 'Solve $x^2 - 7x + 10 = 0$ by splitting the middle term. Verify both roots by substitution back into the equation.',
        pedagogicalFocus: 'Reinforce mental cross-checking of factors $(-2)$ and $(-5)$.'
      });
    }

    if (weakMistakes.includes('UNIT_MISSING')) {
      drills.push({
        drillNumber: 3,
        title: 'Applied Word Problem & Dimensional Units',
        problem: 'The perimeter of a rectangular classroom is 44 m and its area is 120 m². Find the length and breadth stating correct SI units (meters).',
        pedagogicalFocus: 'CBSE mandates explicit standard SI units in final word problem statements.'
      });
    }

    if (drills.length === 0) {
      drills.push({
        drillNumber: 1,
        title: 'Advanced Enrichment Mastery Drill',
        problem: 'Solve $(x - 1)/(x - 2) + (x - 3)/(x - 4) = 10/3$ ($x \\neq 2, 4$) with complete deductive steps.',
        pedagogicalFocus: 'Speed drills and higher-order algebraic simplification.'
      });
    }

    const assignment = {
      assignmentId: `asgn_rem_${Date.now()}`,
      submissionId: id,
      studentId: sub.studentId,
      rollNo: sub.rollNo,
      studentName: sub.studentName,
      subject: sub.subject,
      testTitle: sub.testTitle,
      scoreSummary: `${sub.totalAwarded} / ${sub.totalMax} (${sub.percentage}%)`,
      detectedMistakeTypes: weakMistakes,
      lostMarkStepsCount: lostMarkSteps.length,
      lostMarkSteps,
      drills,
      whatsappSnippet: `*UNISOLE SCHOLAR - PERSONALIZED REMEDIAL ASSIGNMENT*\nDear Parent, here is ${sub.studentName}'s handwritten test diagnostic for *${sub.testTitle}*.\nScore: ${sub.totalAwarded}/${sub.totalMax} (${sub.percentage}%).\nWeak Focus: ${weakMistakes.join(', ') || 'Speed refinement'}.\nPlease review the 2 attached practice drills on our scholar portal.\n- Department of ${sub.subject}`,
      generatedAt: new Date().toISOString()
    };

    inMemoryStore.personalAssignments.unshift(assignment);

    res.json({
      success: true,
      message: `Personalized remedial assignment formulated with ${drills.length} practice drills based on ${sub.studentName}'s specific mistake patterns.`,
      assignment
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
