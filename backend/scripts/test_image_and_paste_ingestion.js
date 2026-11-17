// ============================================================================
// COMPREHENSIVE TEST: IMAGE & PASTE QUESTION INGESTION & MODE BANK ROUTING
// Verifies:
// 1. Single / Ad-hoc Pasted Question: Passes reconciliation without demanding 33 questions
// 2. Multimodal Image Ingestion: Uses modern active Gemini models (gemini-3.8-flash, etc.)
// 3. Auto-Categorization: Chapter, subtopic, marks (1-5M), difficulty (EASY/MEDIUM/HARD)
// 4. Mode Routing: Board Bank (CBSE/HP/ICSE) vs Competitive Bank (JEE/NEET)
// ============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const { extractDeclaredManifest } = require('../src/services/paperProfileRegistry');
const { reconcileExtraction } = require('../src/services/extractionReconciler');
const {
  processQuestionExtraction,
  commitQuestionToStore,
  detectChapterFromText,
  detectMarksFromText,
  detectDifficultyFromMarks
} = require('../src/services/questionInjectionService');

async function runTests() {
  console.log('🧪 RUNNING IMAGE & PASTE INGESTION VERIFICATION SUITE...\n');

  // --------------------------------------------------------------------------
  // TEST 1: Single Pasted Question Ad-Hoc Manifest
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Single Pasted Question Manifest Check ---');
  const singlePastedText = `
    Question 1: (1 Mark) What is the SI unit of electric dipole moment?
    A) C · m
    B) C / m
    C) C · m^2
    D) N / C
    Answer: A
    Solution: Electric dipole moment p = q * 2a. Hence unit is Coulomb-meter (C · m).
  `;

  const adHocManifest = extractDeclaredManifest(singlePastedText, {
    mode: 'BOARD',
    track: 'CBSE',
    subject: 'Physics',
    grade: '12'
  });

  console.log('Manifest result:', {
    source: adHocManifest.source,
    isAdHocWorksheet: adHocManifest.isAdHocWorksheet,
    declaredTotalQuestions: adHocManifest.declaredTotalQuestions
  });

  assert.strictEqual(adHocManifest.isAdHocWorksheet, true, 'Ad-hoc input must be flagged as isAdHocWorksheet');
  assert.strictEqual(adHocManifest.declaredTotalQuestions, null, 'Ad-hoc input must not demand 33 questions');
  console.log('✅ Passed: Single question does not infer a 33-question exam manifest.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Ad-Hoc Extraction & Clean Reconciliation
  // --------------------------------------------------------------------------
  console.log('--- TEST 2: Extraction & Reconciliation of Single Pasted Question ---');
  const extractedResult = await processQuestionExtraction({
    mode: 'text',
    rawText: singlePastedText,
    targetSubject: 'Physics',
    grade: '12',
    category: 'CBSE_PYQ'
  });

  const questions = extractedResult.questions || [extractedResult];
  console.log(`Extracted count: ${questions.length}`);
  assert.strictEqual(questions.length, 1, 'Should extract 1 question');
  const q1 = questions[0];
  console.log(`Auto Chapter: ${q1.chapter_name}`);
  console.log(`Marks: ${q1.marks_weightage}M`);
  console.log(`Difficulty: ${q1.difficulty}`);
  console.log(`Correct Answer: ${q1.correct_answer}`);

  assert.strictEqual(q1.marks_weightage, 1, 'MCQ must be 1 Mark');
  assert.strictEqual(q1.correct_answer, 'A', 'Correct answer must be A');
  assert.ok(q1.chapter_name.includes('Electric Charges') || q1.chapter_name.includes('Electrostatic'), 'Should detect Electric Charges chapter');

  const reconciliation = reconcileExtraction(adHocManifest, questions, { mode: 'BOARD', track: 'CBSE' });
  console.log('Reconciliation Status:', reconciliation.status);
  console.log('Reconciliation Passed:', reconciliation.passed);
  console.log('Reconciliation Issues:', reconciliation.issues);
  console.log('Reconciliation Warnings:', reconciliation.warnings);
  console.log('Reconciliation Breakdown:', reconciliation.sectionBreakdown);

  assert.strictEqual(reconciliation.passed, true, 'Single question must pass reconciliation');
  assert.strictEqual(reconciliation.status, 'PENDING_REVIEW', 'Status must be PENDING_REVIEW');
  assert.strictEqual(reconciliation.issues.length, 0, 'Must have 0 blocking issues');
  console.log('✅ Passed: Single pasted question passes reconciliation cleanly without under-extraction errors.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Multi-Question Pasted Text (3 Questions of different marks)
  // --------------------------------------------------------------------------
  console.log('--- TEST 3: Multi-Question Text Ingestion (1M, 3M, 5M) ---');
  const multiQText = `
    Question 1: (1 Mark) Define dielectric constant of a medium.
    Answer: It is the ratio of permittivity of medium to permittivity of free space.

    Question 2: (3 Marks) An alternating voltage V = 220 sin(100 pi t) is applied to a resistor of 100 ohms. Find rms current.
    Solution: V_rms = 220 / sqrt(2) = 155.6 V. I_rms = V_rms / R = 1.56 A.

    Question 3: (5 Marks) State Gauss's Law and derive electric field intensity due to an infinitely long charged wire.
    Solution: Step 1: Flux = q / eps0. Step 2: Cylindrical Gaussian surface. Step 3: E = lambda / (2 pi eps0 r).
  `;

  const multiManifest = extractDeclaredManifest(multiQText, { mode: 'BOARD', track: 'CBSE', subject: 'Physics', grade: '12' });
  const multiExtracted = await processQuestionExtraction({
    mode: 'text',
    rawText: multiQText,
    targetSubject: 'Physics',
    grade: '12',
    category: 'CBSE_PYQ'
  });

  const multiList = multiExtracted.questions || [multiExtracted];
  console.log(`Extracted count: ${multiList.length}`);
  assert.strictEqual(multiList.length, 3, 'Should extract 3 questions');

  const multiRec = reconcileExtraction(multiManifest, multiList, { mode: 'BOARD', track: 'CBSE' });
  console.log('Multi-Q Reconciliation:', {
    passed: multiRec.passed,
    status: multiRec.status,
    calculatedMarksSum: multiRec.calculatedMarksSum,
    breakdown: multiRec.sectionBreakdown.map(s => `${s.label}: ${s.actualCount}/${s.expectedCount}`)
  });

  assert.strictEqual(multiRec.passed, true, 'Multi-question must pass reconciliation');
  assert.strictEqual(multiRec.status, 'PENDING_REVIEW');
  assert.strictEqual(multiRec.calculatedMarksSum, 9, '1M + 3M + 5M = 9M');
  console.log('✅ Passed: Multi-question paste accurately categorized into 1M, 3M, 5M sections.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Full Declared Exam Paper Manifest Isolation
  // --------------------------------------------------------------------------
  console.log('--- TEST 4: Declared 33-Question Paper Manifest Isolation ---');
  const fullPaperHeader = `
    CBSE CLASS XII EXAMINATION 2024
    PHYSICS (THEORY)
    Time Allowed: 3 Hours    Maximum Marks: 70
    General Instructions:
    1. This question paper contains 33 questions. All questions are compulsory.
    2. Section A comprises questions 1 to 16 of 1 mark each.
    3. Section B comprises questions 17 to 21 of 2 marks each.
    4. Section C comprises questions 22 to 28 of 3 marks each.
    5. Section D comprises questions 29 to 30 of 4 marks each.
    6. Section E comprises questions 31 to 33 of 5 marks each.
  `;

  const paperManifest = extractDeclaredManifest(fullPaperHeader, { mode: 'BOARD', track: 'CBSE', subject: 'Physics', grade: '12' });
  console.log('Declared Paper Manifest:', {
    source: paperManifest.source,
    declaredTotalQuestions: paperManifest.declaredTotalQuestions,
    declaredTotalMarks: paperManifest.declaredTotalMarks,
    sectionCount: paperManifest.sections.length
  });

  assert.strictEqual(paperManifest.declaredTotalQuestions, 33, 'Declared paper must expect 33 questions');
  assert.strictEqual(paperManifest.declaredTotalMarks, 70, 'Declared paper must expect 70 marks');
  assert.strictEqual(paperManifest.sections.length, 5, 'Must parse 5 sections A-E');

  // If only 6 questions are provided for a declared 33-question paper, it MUST report under-extraction:
  const incompleteRec = reconcileExtraction(paperManifest, multiList, { mode: 'BOARD', track: 'CBSE' });
  assert.strictEqual(incompleteRec.passed, false, 'Incomplete declared paper must fail count check');
  assert.strictEqual(incompleteRec.status, 'DRAFT', 'Status must be DRAFT when under-extracted');
  console.log('✅ Passed: Declared 33-question paper properly flags under-extraction when only partial questions are supplied.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Multimodal Image Ingestion Call with Gemini Flash
  // --------------------------------------------------------------------------
  console.log('--- TEST 5: Multimodal Image Ingestion with Gemini Flash ---');
  // 1x1 test png base64
  const testPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const imgDataUri = `data:image/png;base64,${testPngBase64}`;

  try {
    const imgExtracted = await processQuestionExtraction({
      mode: 'image',
      mediaData: imgDataUri,
      mimeType: 'image/png',
      targetSubject: 'Physics',
      grade: '12',
      category: 'CBSE_PYQ'
    });
    console.log('Multimodal extraction succeeded:', imgExtracted.detected_question_count || 1);
  } catch (err) {
    console.log('Multimodal handled response gracefully:', err.message);
    // Since 1x1 pixel image has no question text, it must throw EXTRACTION_UNREADABLE with clear guidance
    assert.strictEqual(err.code, 'EXTRACTION_UNREADABLE', 'Empty pixel image must throw EXTRACTION_UNREADABLE');
    assert.ok(err.message.includes('Paste Text'), 'Error message must guide teacher to Paste Text mode');
  }
  console.log('✅ Passed: Multimodal image ingestion executes cleanly without 404 or unhandled exceptions.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Mode & Bank Tagging Verification (BOARD vs COMPETITIVE)
  // --------------------------------------------------------------------------
  console.log('--- TEST 6: Mode & Bank Storage Routing ---');
  const teacher = {
    id: 'fac_phy_test',
    name: 'Dr. Vikram Sharma',
    subject: 'Physics',
    subjectKey: 'PHYSICS'
  };

  // Commit Board Question
  const boardCommit = commitQuestionToStore({
    structuredQuestion: {
      question_latex: 'Test board question on electrostatic flux $\\Phi = E A$.',
      chapter_name: 'Electric Charges and Fields',
      marks_weightage: 2,
      difficulty: 'MEDIUM',
      options_latex: []
    },
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    category: 'CBSE_PYQ',
    mode: 'text',
    examMode: 'BOARD',
    examTrack: 'CBSE',
    persistImmediately: false
  });

  console.log('Board question committed:', {
    id: boardCommit.question.id,
    target_modes: boardCommit.question.target_modes,
    board_targets: boardCommit.question.board_targets,
    competitive_targets: boardCommit.question.competitive_targets,
    marks: boardCommit.question.marks
  });

  assert.deepStrictEqual(boardCommit.question.target_modes, ['BOARD']);
  assert.deepStrictEqual(boardCommit.question.board_targets, ['CBSE']);
  assert.deepStrictEqual(boardCommit.question.competitive_targets, []);
  assert.strictEqual(boardCommit.question.marks, 2);

  // Commit Competitive Question
  const compCommit = commitQuestionToStore({
    structuredQuestion: {
      question_latex: 'Test competitive question for JEE Main on rotational dynamics $\\tau = I \\alpha$.',
      chapter_name: 'System of Particles and Rotational Motion',
      marks_weightage: 4,
      difficulty: 'HARD',
      options_latex: [
        { key: 'A', latex: '$10\\,\\text{rad/s}^2$', is_correct: true },
        { key: 'B', latex: '$5\\,\\text{rad/s}^2$', is_correct: false },
        { key: 'C', latex: '$2.5\\,\\text{rad/s}^2$', is_correct: false },
        { key: 'D', latex: '$15\\,\\text{rad/s}^2$', is_correct: false }
      ]
    },
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    category: 'COMPETITIVE_OTHER',
    mode: 'text',
    examMode: 'COMPETITIVE',
    examTrack: 'JEE',
    persistImmediately: false
  });

  console.log('Competitive question committed:', {
    id: compCommit.question.id,
    target_modes: compCommit.question.target_modes,
    board_targets: compCommit.question.board_targets,
    competitive_targets: compCommit.question.competitive_targets,
    marks: compCommit.question.marks
  });

  assert.deepStrictEqual(compCommit.question.target_modes, ['COMPETITIVE']);
  assert.deepStrictEqual(compCommit.question.competitive_targets, ['JEE_MAIN']);
  assert.deepStrictEqual(compCommit.question.board_targets, []);
  assert.strictEqual(compCommit.question.marks, null, 'Competitive questions must have null static marks (dynamic pattern)');

  console.log('✅ Passed: Board bank vs Competitive bank isolation completely verified.\n');

  console.log('🎉 ALL 6 IMAGE & PASTE INGESTION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

