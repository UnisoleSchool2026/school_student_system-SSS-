// Automated verification for Class Progress Dashboard & Analytics across all subjects
const express = require('express');
const http = require('http');

async function runDashboardVerification() {
  console.log('--- STARTING CLASS PROGRESS DASHBOARD AUTOMATED VERIFICATION ---');

  // Load backend app
  const analyticsRouter = require('../src/routes/analytics');
  const curriculumRouter = require('../src/routes/curriculum');
  const { inMemoryStore } = require('../src/config/database');

  const app = express();
  app.use(express.json());
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/curriculum', curriculumRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      console.error(`FAILED: ${message}`);
      throw new Error(message);
    }
    passed++;
    console.log(`PASSED: ${message}`);
  }

  try {
    // 1. Verify Class 10 Mathematics Assessment & Submissions Seeded
    console.log('\n[1/6] Verifying Seeded Class 10 Math Assessment & Submissions');
    const mathAssessment = inMemoryStore.assessments.find(a => a.id === 'asgn_10_math_01');
    assert(!!mathAssessment, 'asgn_10_math_01 must be pre-seeded in database.js');
    assert(mathAssessment.subjectKey === 'CLASS10_MATHEMATICS', 'Assessment subjectKey is CLASS10_MATHEMATICS');
    assert(mathAssessment.questions.length === 4, 'Assessment has 4 questions');
    
    const mathSubmissions = inMemoryStore.submissions.filter(s => s.assessmentId === 'asgn_10_math_01');
    assert(mathSubmissions.length === 4, `Found ${mathSubmissions.length} submissions for asgn_10_math_01 (expected 4)`);

    // 2. Test GET /api/analytics/class-dashboard for CLASS10_MATHEMATICS
    console.log('\n[2/6] Testing GET /api/analytics/class-dashboard?subjectKey=CLASS10_MATHEMATICS');
    const mathRes = await fetch(`${baseUrl}/api/analytics/class-dashboard?subjectKey=CLASS10_MATHEMATICS`);
    assert(mathRes.status === 200, 'Status code is 200');
    const mathData = await mathRes.json();
    assert(mathData.success === true, 'Response success is true');
    assert(mathData.assessment.id === 'asgn_10_math_01', 'Loaded asgn_10_math_01 for Class 10 Math');
    assert(mathData.assessment.subjectKey === 'CLASS10_MATHEMATICS', 'Active assessment is Class 10 Math');
    assert(mathData.hasSubmissions === true, 'hasSubmissions is true');
    assert(mathData.classSummary.totalSubmissions === 4, 'totalSubmissions is 4');
    assert(mathData.classSummary.highestScore.score === 16, 'Highest score is 16');
    assert(mathData.studentRoster.length === 4, 'Student roster has 4 records');
    assert(mathData.questionAnalytics.length === 4, 'Question analytics has 4 questions');
    assert(Array.isArray(mathData.availableAssessments) && mathData.availableAssessments.length > 0, 'Available assessments list returned');

    // 3. Test GET /api/analytics/class-dashboard for CLASS10_SCIENCE
    console.log('\n[3/6] Testing GET /api/analytics/class-dashboard?subjectKey=CLASS10_SCIENCE');
    const sciRes = await fetch(`${baseUrl}/api/analytics/class-dashboard?subjectKey=CLASS10_SCIENCE`);
    assert(sciRes.status === 200, 'Status code is 200');
    const sciData = await sciRes.json();
    assert(sciData.success === true, 'Response success is true');
    assert(sciData.assessment.id === 'asgn_10_sci_01', 'Loaded asgn_10_sci_01 for Science');
    assert(sciData.hasSubmissions === true, 'hasSubmissions is true');
    assert(sciData.classSummary.totalSubmissions === 4, '4 Science submissions found (one per enrolled Class 10 student)');

    // 4. Test GET /api/analytics/class-dashboard for BIOLOGY
    console.log('\n[4/6] Testing GET /api/analytics/class-dashboard?subjectKey=BIOLOGY');
    const bioRes = await fetch(`${baseUrl}/api/analytics/class-dashboard?subjectKey=BIOLOGY`);
    assert(bioRes.status === 200, 'Status code is 200');
    const bioData = await bioRes.json();
    assert(bioData.success === true, 'Response success is true');
    assert(bioData.assessment.id === 'asgn_11_bio_01', 'Loaded asgn_11_bio_01 for Biology');
    assert(bioData.assessment.subjectKey === 'BIOLOGY', 'Active assessment subjectKey is BIOLOGY');
    assert(bioData.classSummary.totalSubmissions === 4, '4 Biology submissions found');

    // 5. Test GET /api/analytics/class-dashboard for PHYSICS
    console.log('\n[5/6] Testing GET /api/analytics/class-dashboard?subjectKey=PHYSICS');
    const physRes = await fetch(`${baseUrl}/api/analytics/class-dashboard?subjectKey=PHYSICS`);
    assert(physRes.status === 200, 'Status code is 200');
    const physData = await physRes.json();
    assert(physData.success === true, 'Response success is true');
    assert(physData.assessment.id === 'asgn_12_phy_01', 'Loaded asgn_12_phy_01 for Physics');
    assert(physData.assessment.subjectKey === 'PHYSICS', 'Active assessment subjectKey is PHYSICS');
    assert(physData.hasSubmissions === true, 'hasSubmissions is true for seeded physics test');
    assert(physData.classSummary.totalSubmissions === 8, '8 submissions for seeded physics test');
    assert(physData.questionAnalytics.length === 4, '4 questions in question analytics');
    assert(physData.studentRoster.length > 0, 'Enrolled students roster populated');

    // 5. Test Zero-Submissions Assessment Resilience
    console.log('\n[5/6] Testing Graceful Response on Assessment with 0 Submissions');
    // Create dummy assessment without submissions
    const emptyAsgnId = 'asgn_test_empty_zero_001';
    inMemoryStore.assessments.push({
      id: emptyAsgnId,
      title: 'Class 10th Math: Real Numbers Pop Quiz',
      subjectKey: 'CLASS10_MATHEMATICS',
      grade: '10',
      section: '10-Science-A',
      totalQuestions: 2,
      totalMarks: 8,
      questions: [
        { id: 'q_empty_1', topic: 'Real Numbers', subtopic: 'Euclid Division Lemma', marks: 4 },
        { id: 'q_empty_2', topic: 'Real Numbers', subtopic: 'Fundamental Theorem of Arithmetic', marks: 4 }
      ]
    });

    const emptyRes = await fetch(`${baseUrl}/api/analytics/class-dashboard?assessmentId=${emptyAsgnId}&subjectKey=CLASS10_MATHEMATICS`);
    assert(emptyRes.status === 200, 'Status code 200 for 0 submissions');
    const emptyData = await emptyRes.json();
    assert(emptyData.success === true, 'success is true');
    assert(emptyData.hasSubmissions === false, 'hasSubmissions is false');
    assert(emptyData.classSummary.totalSubmissions === 0, 'totalSubmissions is 0');
    assert(emptyData.questionAnalytics.length === 2, '2 questions returned in matrix');
    assert(emptyData.studentRoster.length >= 4, 'Enrolled students returned in roster with pending status');
    assert(emptyData.studentRoster[0].primaryMistake === 'Pending Attempt', 'Student primary mistake is Pending Attempt');

    // 6. Test POST /api/curriculum/simulate-attempts for the empty assessment
    console.log('\n[6/6] Testing POST /api/curriculum/simulate-attempts for Class 10');
    const simRes = await fetch(`${baseUrl}/api/curriculum/simulate-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId: emptyAsgnId })
    });
    assert(simRes.status === 200, 'simulate-attempts returns 200');
    const simData = await simRes.json();
    assert(simData.success === true, 'simulate-attempts success is true');
    assert(simData.submissionsCount >= 4, `${simData.submissionsCount} student submissions evaluated`);

    // Verify analytics immediately reflects the newly simulated submissions
    const postSimRes = await fetch(`${baseUrl}/api/analytics/class-dashboard?assessmentId=${emptyAsgnId}&subjectKey=CLASS10_MATHEMATICS`);
    const postSimData = await postSimRes.json();
    assert(postSimData.hasSubmissions === true, 'hasSubmissions is now true');
    assert(postSimData.classSummary.totalSubmissions >= 4, 'totalSubmissions is now populated');
    assert(postSimData.studentRoster.some(s => s.studentName === 'Rohit Verma'), 'Student roster contains Class 10 Rohit Verma');

    console.log(`\nALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
  } finally {
    server.close();
  }
}

runDashboardVerification().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
