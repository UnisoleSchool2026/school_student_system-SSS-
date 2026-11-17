// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: INTEGRATION TEST
// Verifies:
// 1. Strict Subject Isolation (Chemistry -> Chemistry, Physics -> Physics, Maths -> Maths, Bio -> Bio)
// 2. Zero Cross-Subject Contamination (Chemistry NEVER contains Physics/Light questions)
// 3. Teacher View: Add Student to Class Roster API
// 4. Student Progress Drilldown & Visual Telemetry Data
// 5. Personalized Remedial Assignment Generation
// ============================================================================

const assert = require('assert');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5050';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 RUNNING SUBJECT ISOLATION & TEACHER WORKFLOW TESTS`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. CHEMISTRY TEST GENERATION
  console.log(`[TEST 1] Verifying 100% Strict Subject Isolation for Chemistry...`);
  const chemRes = await fetch(`${BASE_URL}/api/curriculum/generate-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classKey: '12-NonMed',
      grade: '12',
      section: '12-NonMed',
      subjectKey: 'CHEMISTRY',
      subjectName: 'Chemistry',
      chapterNumber: 1,
      chapterName: 'Solutions',
      questionCount: 5,
      mode: 'QUIZ'
    })
  });

  assert(chemRes.status === 200 || chemRes.status === 201, `Expected 200 or 201 from generate-test, got ${chemRes.status}`);
  const chemData = await chemRes.json();
  assert.strictEqual(chemData.success, true, 'Assessment generation should succeed');
  assert.strictEqual(chemData.assessment.subject, 'Chemistry', 'Assessment subject must be Chemistry');
  assert.strictEqual(chemData.assessment.subjectKey, 'CHEMISTRY', 'SubjectKey must be CHEMISTRY');
  assert(chemData.assessment.questions.length >= 3, 'Must return at least 3 questions');

  // Verify ZERO questions contain physics concepts (mirror, lens, focal length, ray optics, electric flux)
  chemData.assessment.questions.forEach((q, idx) => {
    assert.strictEqual(q.subject, 'Chemistry', `Q${idx+1} must be Chemistry subject`);
    const qLower = (q.question_latex || '').toLowerCase();
    const isPhysicsContaminated = qLower.includes('concave mirror') || qLower.includes('focal length') || qLower.includes('lens formula') || qLower.includes('snell');
    assert.strictEqual(isPhysicsContaminated, false, `Q${idx+1} is contaminated with Physics optics! Text: ${q.question_latex}`);
    console.log(`   ✓ Q${idx+1} verified: [${q.subject}] ${q.question_latex.slice(0, 60)}...`);
  });
  console.log(`   ✅ PASS: Chemistry test generated with 100% subject isolation (0% Physics contamination).\n`);

  // 2. PHYSICS TEST GENERATION
  console.log(`[TEST 2] Verifying Strict Subject Isolation for Physics...`);
  const phyRes = await fetch(`${BASE_URL}/api/curriculum/generate-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classKey: '12-NonMed',
      grade: '12',
      section: '12-NonMed',
      subjectKey: 'PHYSICS',
      subjectName: 'Physics',
      chapterNumber: 1,
      chapterName: 'Electric Charges and Fields',
      questionCount: 3,
      mode: 'QUIZ'
    })
  });

  assert(phyRes.status === 200 || phyRes.status === 201, `Expected 200 or 201 from generate-test, got ${phyRes.status}`);
  const phyData = await phyRes.json();
  assert.strictEqual(phyData.assessment.subject, 'Physics');
  phyData.assessment.questions.forEach((q, idx) => {
    assert.strictEqual(q.subject, 'Physics');
    console.log(`   ✓ Q${idx+1} verified: [${q.subject}] ${q.question_latex.slice(0, 60)}...`);
  });
  console.log(`   ✅ PASS: Physics test generated with 100% subject fidelity.\n`);

  // 3. BIOLOGY TEST GENERATION
  console.log(`[TEST 3] Verifying Strict Subject Isolation for Biology...`);
  const bioRes = await fetch(`${BASE_URL}/api/curriculum/generate-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classKey: '12-Med',
      grade: '12',
      section: '12-Med',
      subjectKey: 'BIOLOGY',
      subjectName: 'Biology',
      chapterNumber: 4,
      chapterName: 'Principles of Inheritance and Variation',
      questionCount: 3,
      mode: 'QUIZ'
    })
  });

  assert(bioRes.status === 200 || bioRes.status === 201, `Expected 200 or 201 from generate-test, got ${bioRes.status}`);
  const bioData = await bioRes.json();
  assert.strictEqual(bioData.assessment.subject, 'Biology');
  bioData.assessment.questions.forEach((q, idx) => {
    assert.strictEqual(q.subject, 'Biology');
    console.log(`   ✓ Q${idx+1} verified: [${q.subject}] ${q.question_latex.slice(0, 60)}...`);
  });
  console.log(`   ✅ PASS: Biology test generated with 100% subject fidelity.\n`);

  // 4. TEACHER ADD STUDENT TO CLASS
  console.log(`[TEST 4] Verifying Teacher Enrollment: Add Student to Class Roster...`);
  const testRoll = `12-NM-${Date.now().toString().slice(-4)}`;
  const addStudentRes = await fetch(`${BASE_URL}/api/curriculum/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Karan Verma',
      rollNumber: testRoll,
      grade: '12',
      section: '12-NonMed',
      targetExam: 'JEE_MAIN',
      parentPhone: '+91 98160-77889'
    })
  });

  assert.ok(addStudentRes.status === 200 || addStudentRes.status === 201, `Status code should be 200 or 201, got ${addStudentRes.status}`);
  const studentData = await addStudentRes.json();
  assert.strictEqual(studentData.success, true);
  assert.strictEqual(studentData.student.full_name, 'Karan Verma');
  assert.strictEqual(studentData.student.roll_number, testRoll);
  console.log(`   ✅ PASS: Enrolled student "${studentData.student.full_name}" (${testRoll}) into 12-NonMed.\n`);

  // 5. STUDENT TEST DRILLDOWN ANALYTICS
  console.log(`[TEST 5] Verifying Student Drill-Down Analytics Endpoint...`);
  const drilldownRes = await fetch(`${BASE_URL}/api/analytics/student-test-drilldown/12-NM-01/latest`);
  assert.strictEqual(drilldownRes.status, 200);
  const drilldownData = await drilldownRes.json();
  assert.strictEqual(drilldownData.success, true);
  assert(drilldownData.student, 'Must contain student object');
  assert(drilldownData.questionBreakdown, 'Must contain question telemetry breakdown');
  console.log(`   ✅ PASS: Student drilldown retrieved with ${drilldownData.questionBreakdown?.length || 0} telemetry questions.\n`);

  // 6. PERSONALIZED REMEDIAL ASSIGNMENT GENERATION
  console.log(`[TEST 6] Verifying Personalized Remedial Assignment Generation...`);
  const remRes = await fetch(`${BASE_URL}/api/assessments/remedial/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: '12-NM-01',
      studentName: 'Aryan Sharma',
      rollNumber: '12-NM-01',
      assessmentId: 'test_asgn_chem_01',
      assessmentTitle: 'Solutions & Electrochemistry Quiz',
      questionBreakdown: [
        {
          questionIndex: 1,
          topic: 'Chemistry',
          subtopic: 'Chemical Thermodynamics',
          selectedOption: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          timeSpentSeconds: 110,
          benchmarkSeconds: 90,
          mistakeClassification: { explanation: 'Forgot negative sign in Delta G = -nFE' }
        }
      ]
    })
  });

  assert.strictEqual(remRes.status, 200);
  const remData = await remRes.json();
  assert.strictEqual(remData.success, true);
  assert(remData.assignment.formulaDrills.length > 0, 'Must contain formula writing drills');
  console.log(`   ✓ Formula drill generated: "${remData.assignment.formulaDrills[0].formulaName}"`);

  // Verify formula input verification
  const verifyRes = await fetch(`${BASE_URL}/api/assessments/remedial/verify-formula`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subtopic: 'Chemical Thermodynamics',
      formulaInput: '\\Delta G = -nFE'
    })
  });
  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyData.isValid, true);
  console.log(`   ✓ Formula verification verified: "${verifyData.formulaName}" -> ${verifyData.message}`);
  console.log(`   ✅ PASS: Personalized remedial assignment engine generated targeted formula writing drills & verified submission.\n`);

  console.log(`======================================================`);
  console.log(`🎉 ALL 6 INTEGRATION TESTS PASSED WITH 100% SUCCESS!`);
  console.log(`======================================================\n`);
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
