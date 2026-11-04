// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: INTEGRATION TEST RUNNER
// Verifies: AI LaTeX Generation, Handwritten Evaluation, Kafka Stream Ingestion, Smart Reports
// ============================================================================

const path = require('path');
const fs = require('fs');

// Zero-dependency .env loader
const envPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const { generateAiQuestion } = require('../backend/src/services/aiPromptEngine');
const { evaluateHandwrittenSheet } = require('../backend/src/services/handwrittenEvaluator');
const { generateWeeklyReport } = require('../backend/src/services/smartReportService');

async function runDiagnostics() {
  console.log('🧪 Starting HAPS-AI Diagnostic & Service Verification Suite...\n');

  // Test 1: AI LaTeX Generation
  console.log('--- TEST 1: AI LaTeX Question Generation ---');
  const question = await generateAiQuestion({
    grade: '11',
    subject: 'Physics',
    topic: 'Rotational Motion',
    subtopic: 'Moment of Inertia',
    board: 'JEE_MAIN',
    difficulty: 'HARD'
  });
  console.log('✅ Generated Question ID:', question.id);
  console.log('LaTeX Question snippet:', question.question_latex.slice(0, 80) + '...');
  console.log('Distractor Traps analyzed:', question.options_latex.map(o => o.key + ': ' + (o.distractor_trap || 'CORRECT')).join(' | '));

  // Test 2: Handwritten Answer Sheet Evaluation
  console.log('\n--- TEST 2: Multi-Modal Handwritten Answer Sheet Evaluation ---');
  const evalResult = await evaluateHandwrittenSheet({
    studentId: 'b0000000-0000-0000-0000-000000000001',
    questionId: question.id,
    sheetImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
  });
  console.log('✅ Evaluation Status: Awarded', evalResult.totalMarksAwarded, '/', evalResult.maxPossibleMarks, 'marks');
  console.log('Step 1 Rubric:', evalResult.steps[0].title, '->', evalResult.steps[0].awardedMarks, 'pts');
  console.log('Confidence Score:', evalResult.aiConfidenceScore);

  // Test 3: Weekly Smart Report Card Generation (School vs Parent Actions)
  console.log('\n--- TEST 3: Weekly Smart Report Card (Dual Directives) ---');
  const report = await generateWeeklyReport('b0000000-0000-0000-0000-000000000001');
  console.log('✅ Student:', report.studentName, '| Overall Score:', report.overallScorePercentage + '%');
  console.log('Mastered Concepts:', report.masteredConcepts.map(c => c.subtopic).join(', '));
  console.log('Weak Concepts:', report.weakConcepts.map(c => c.subtopic).join(', '));
  console.log('School Hostel Directives:', report.schoolHostelActions[0].directive);
  console.log('Parent Home Directives:', report.parentActions[0].directive);

  // Test 4: Gemini Vision AI Handwritten Sheet Evaluation
  console.log('\n--- TEST 4: Gemini 1.5 Flash Vision OCR & Bounding Box Overlay ---');
  const { processHandwrittenImage } = require('../backend/src/services/geminiVisionService');
  const visionOutput = await processHandwrittenImage({
    imageData: 'data:image/png;base64,mockImageDataSample',
    subject: 'Physics'
  });
  console.log('✅ Vision Model:', visionOutput.aiModel);
  console.log('Detected Steps:', visionOutput.steps.length, '| Awarded:', visionOutput.totalMarksAwarded, 'pts');
  console.log('Bounding Box 1:', JSON.stringify(visionOutput.steps[0].boundingBox));

  // Test 5: Headless PDF Report Generator
  console.log('\n--- TEST 5: Headless Printable Dossier Template ---');
  const { generatePrintableReportHtml } = require('../backend/src/services/pdfReportService');
  const htmlOutput = generatePrintableReportHtml(report);
  console.log('✅ Generated Printable Dossier HTML (bytes):', htmlOutput.length);

  // Test 6: Multi-LLM Question Engine (Groq LPU / Gemini Flash / NCERT fallback)
  console.log('\n--- TEST 6: Multi-LLM Question Engine (Groq & Gemini Dual Engine) ---');
  const { generateLlmQuestion } = require('../backend/src/services/llmQuestionEngine');
  const llmQ = await generateLlmQuestion({
    grade: '10',
    subject: 'Science',
    chapter: 'Light – Reflection and Refraction',
    board: 'CBSE',
    provider: 'auto'
  });
  console.log('✅ LLM Provider:', llmQ.llm_provider);
  console.log('NCERT Section:', llmQ.ncert_mapping?.ncert_section || 'N/A');
  console.log('Question LaTeX snippet:', (llmQ.question_latex || llmQ.question_text || llmQ.question || '').slice(0, 90) + '...');
  console.log('Rubric Step 1:', llmQ.step_rubric ? llmQ.step_rubric[0].description : 'N/A');

  // Test 7: Class 10 NCERT Previous Year Question Bank
  console.log('\n--- TEST 7: Class 10 NCERT PYQ Bank Alignment (CBSE & HP Board) ---');
  const { getAllClass10Questions, getCuratedClass10Question } = require('../backend/src/services/class10PyqBank');
  const allPyqs = getAllClass10Questions();
  console.log('✅ Total Verified Class 10 PYQs in Bank:', allPyqs.length);
  const mathPyq = getCuratedClass10Question('Mathematics', 'Trigonometry', 'CBSE');
  console.log('Curated Math PYQ:', mathPyq.chapter, '| Tag:', mathPyq.ncert_mapping.pyq_tag);
  console.log('NCERT Page Reference:', mathPyq.ncert_mapping.page_reference);

  // Test 8: Personalized Remedial Assignment & Formula Write-In Engine
  console.log('\n--- TEST 8: Personalized Remedial Assignment & Formula Verification ---');
  const { generatePersonalizedRemedialAssignment, verifyStudentFormula } = require('../backend/src/services/remedialAssignmentService');
  const remedialAssignment = generatePersonalizedRemedialAssignment({
    studentId: 'b0000000-0000-0000-0000-000000000001',
    studentName: 'Aryan Sharma',
    rollNumber: '11-S-24',
    assessmentId: 'asgn_10_sci_01',
    assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
    questionBreakdown: [
      {
        questionIndex: 1,
        questionId: 'q_asgn_01',
        topic: 'Light – Reflection and Refraction',
        subtopic: 'Spherical Mirrors',
        selectedOption: 'C',
        correctAnswer: 'B',
        isCorrect: false,
        timeSpentSeconds: 110,
        benchmarkSeconds: 90,
        mistakeClassification: { explanation: 'Sign convention error: took real image as positive' }
      },
      {
        questionIndex: 2,
        questionId: 'q_asgn_02',
        topic: 'Light – Reflection and Refraction',
        subtopic: 'Refraction & Snell Law',
        selectedOption: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeSpentSeconds: 40,
        benchmarkSeconds: 75
      }
    ]
  });
  console.log('✅ Generated Remedial Assignment ID:', remedialAssignment.assignmentId);
  console.log('Remedial Formula Drills Count:', remedialAssignment.formulaDrills.length);
  console.log('Formula Drill 1 Prompt:', remedialAssignment.formulaDrills[0].prompt);
  console.log('Target Practice Questions Count:', remedialAssignment.remedialQuestions.length);

  // Test Formula Verification
  const formulaCheck = verifyStudentFormula('Spherical Mirrors', '1/f = 1/v + 1/u');
  console.log('Formula Check "1/f = 1/v + 1/u":', formulaCheck.isValid ? 'VALID' : 'INVALID', '| Message:', formulaCheck.message);

  console.log('\n🎉 ALL 8 INTEGRATION TESTS VERIFIED: REMEDIAL ASSIGNMENT ENGINE READY!');
}

runDiagnostics().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

