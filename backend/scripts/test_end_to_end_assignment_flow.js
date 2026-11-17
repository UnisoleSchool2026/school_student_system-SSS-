// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: END-TO-END ASSIGNMENT & DIAGNOSTIC FLOW TEST SUITE
// Validates full academic lifecycle:
// 1. Question generation & drafting
// 2. Test publishing & assignment to class roster
// 3. Student assessment delivery & taking
// 4. Sub-second telemetry ingestion & category classification
// 5. Dynamic concept mastery categorization (Mastered / Needs Recap / Weak)
// 6. Automatic Weekly Smart Report Card generation with School & Parent actions
// 7. WhatsApp notification dispatch
// ============================================================================

const assert = require('assert');

const API_BASE = 'http://localhost:5050';

async function runEndToEndTest() {
  console.log('============================================================');
  console.log('🧪 RUNNING END-TO-END HAPS-AI TEST & DIAGNOSTIC SUITE');
  console.log('============================================================\n');

  // STEP 1: Verify API Gateway Health
  console.log('Step 1: Checking HAPS-AI API Gateway Health...');
  const healthRes = await fetch(`${API_BASE}/api/health`);
  assert.strictEqual(healthRes.status, 200, 'Gateway should return HTTP 200');
  const healthData = await healthRes.json();
  console.log(`✅ Gateway Healthy: ${healthData.service} (Uptime: ${healthData.uptimeSeconds}s)`);

  // STEP 2: Teacher generates questions & drafts an assignment
  console.log('\nStep 2: Teacher publishes new Class 10 Science Assessment...');
  const testPayload = {
    title: 'Class 10 Science: Reflection, Refraction & Electricity Diagnostic',
    description: 'Weekly CBSE/HP Board diagnostic assessment compiled by Er. Rajesh Kumar.',
    grade: '10',
    section: '10-Science-A',
    board: 'CBSE',
    subject: 'Science',
    durationMinutes: 30,
    totalMarks: 12,
    questions: [
      {
        id: 'q_test_e2e_01',
        topic: 'Light – Reflection and Refraction',
        subtopic: 'Spherical Mirrors',
        benchmark_time_seconds: 90,
        question_latex: 'An object is placed at a distance of $30\\,\\text{cm}$ in front of a concave mirror of focal length $15\\,\\text{cm}$. The distance of the image is:',
        options_latex: [
          { key: 'A', latex: '$v = -15\\,\\text{cm}$', is_correct: false },
          { key: 'B', latex: '$v = -30\\,\\text{cm}$', is_correct: true },
          { key: 'C', latex: '$v = +30\\,\\text{cm}$', is_correct: false },
          { key: 'D', latex: '$v = -60\\,\\text{cm}$', is_correct: false }
        ],
        correct_answer: 'B'
      },
      {
        id: 'q_test_e2e_02',
        topic: 'Light – Reflection and Refraction',
        subtopic: 'Refraction & Snell Law',
        benchmark_time_seconds: 75,
        question_latex: 'Light enters from air into glass with refractive index $n = 1.50$. What is the speed of light in glass?',
        options_latex: [
          { key: 'A', latex: '$v = 2.0 \\times 10^8\\,\\text{m/s}$', is_correct: true },
          { key: 'B', latex: '$v = 3.0 \\times 10^8\\,\\text{m/s}$', is_correct: false },
          { key: 'C', latex: '$v = 4.5 \\times 10^8\\,\\text{m/s}$', is_correct: false },
          { key: 'D', latex: '$v = 1.5 \\times 10^8\\,\\text{m/s}$', is_correct: false }
        ],
        correct_answer: 'A'
      },
      {
        id: 'q_test_e2e_03',
        topic: 'Electricity',
        subtopic: 'Joule Heating & Resistance',
        benchmark_time_seconds: 90,
        question_latex: 'An electric heater of resistance $R = 50\\,\\Omega$ is connected to $220\\,\\text{V}$ for $2\\,\\text{hours}$. Calculate heat energy in joules.',
        options_latex: [
          { key: 'A', latex: '$H = 6.97 \\times 10^6\\,\\text{J}$', is_correct: true },
          { key: 'B', latex: '$H = 1.94 \\times 10^3\\,\\text{J}$', is_correct: false, distractor_trap: 'Forgot to convert hours to seconds' },
          { key: 'C', latex: '$H = 3.48 \\times 10^6\\,\\text{J}$', is_correct: false },
          { key: 'D', latex: '$H = 1.39 \\times 10^7\\,\\text{J}$', is_correct: false }
        ],
        correct_answer: 'A'
      }
    ]
  };

  const publishRes = await fetch(`${API_BASE}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });
  assert.strictEqual(publishRes.status, 201, 'Should publish assessment with status 201');
  const publishData = await publishRes.json();
  const assessmentId = publishData.assessment.id;
  console.log(`✅ Assessment Published: ID "${assessmentId}" with ${publishData.assessment.questions.length} questions`);

  // STEP 3: Student lists assessments and fetches assigned test
  console.log('\nStep 3: Student fetches published assessment list...');
  const listRes = await fetch(`${API_BASE}/api/assessments`);
  const listData = await listRes.json();
  assert(listData.assessments.some(a => a.id === assessmentId), 'Published assessment should appear in student list');
  console.log(`✅ Student view displays ${listData.count} active assessments.`);

  // STEP 4: Student takes test with sub-second telemetry and submits
  console.log('\nStep 4: Student (Aryan Sharma) attempts test and submits responses with timers...');
  const submitRes = await fetch(`${API_BASE}/api/assessments/${assessmentId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: 'b0000000-0000-0000-0000-000000000001',
      studentName: 'Aryan Sharma',
      answers: [
        { questionId: 'q_test_e2e_01', selectedOption: 'B', timeSpentSeconds: 42, hesitationSeconds: 5 }, // Correct, Fast
        { questionId: 'q_test_e2e_02', selectedOption: 'A', timeSpentSeconds: 48, hesitationSeconds: 6 }, // Correct, Fast
        { questionId: 'q_test_e2e_03', selectedOption: 'B', timeSpentSeconds: 145, hesitationSeconds: 28 } // Incorrect, Slow (Distractor trap)
      ]
    })
  });

  assert.strictEqual(submitRes.status, 200, 'Submit endpoint should succeed with HTTP 200');
  const submitData = await submitRes.json();
  console.log(`✅ Test Evaluated: Total Score = ${submitData.results.totalScore} / ${submitData.results.totalMarks} (${submitData.results.percentage}%)`);
  
  // STEP 5: Verify Telemetry Classifications & Diagnostic Matrix
  console.log('\nStep 5: Verifying Sub-Second Telemetry & Diagnostic Matrix...');
  const breakdown = submitData.results.questionBreakdown;
  assert.strictEqual(breakdown[0].category, 'FAST_ACCURATE', 'Q1 should be FAST_ACCURATE');
  assert.strictEqual(breakdown[1].category, 'FAST_ACCURATE', 'Q2 should be FAST_ACCURATE');
  assert.strictEqual(breakdown[2].category, 'SLOW_MISCONCEPTION', 'Q3 should be SLOW_MISCONCEPTION');
  console.log(`   Q1: ${breakdown[0].subtopic} -> ${breakdown[0].category} (+${breakdown[0].marksAwarded}M in ${breakdown[0].timeSpentSeconds}s)`);
  console.log(`   Q2: ${breakdown[1].subtopic} -> ${breakdown[1].category} (+${breakdown[1].marksAwarded}M in ${breakdown[1].timeSpentSeconds}s)`);
  console.log(`   Q3: ${breakdown[2].subtopic} -> ${breakdown[2].category} (${breakdown[2].marksAwarded}M in ${breakdown[2].timeSpentSeconds}s)`);

  const matrix = submitData.results.diagnosticMatrix;
  console.log(`✅ Diagnostic Classification:`);
  console.log(`   🟢 Mastered Concepts (${matrix.masteredCount}): ${matrix.mastered.join(', ')}`);
  console.log(`   🟡 Needs Recap (${matrix.recapCount}): ${matrix.recap.join(', ')}`);
  console.log(`   🔴 Critical Weakness (${matrix.weakCount}): ${matrix.weak.join(', ')}`);
  assert(matrix.weak.includes('Joule Heating & Resistance'), 'Joule heating should be flagged as weak concept');

  // STEP 6: Verify Auto-Generated Weekly Smart Report Card
  console.log('\nStep 6: Verifying Updated Weekly Smart Report Card...');
  const reportRes = await fetch(`${API_BASE}/api/reports/weekly/b0000000-0000-0000-0000-000000000001`);
  const reportData = await reportRes.json();
  assert.strictEqual(reportData.success, true, 'Report fetch should succeed');
  const report = reportData.report;

  console.log(`✅ Weekly Smart Report Generated for ${report.studentName}:`);
  console.log(`   🏫 School Hostel Directives (${report.schoolHostelActions.length}):`);
  report.schoolHostelActions.forEach(a => console.log(`      • [${a.priority}] ${a.directive}`));
  
  console.log(`   🏡 Parent Weekend Directives (${report.parentActions.length}):`);
  report.parentActions.forEach(a => console.log(`      • ${a.directive} (${a.frequency})`));

  assert(report.schoolHostelActions.length > 0, 'School directives must be populated');
  assert(report.parentActions.length > 0, 'Parent directives must be populated');

  // STEP 7: Verify WhatsApp Webhook Dispatch
  console.log('\nStep 7: Testing Parent WhatsApp Webhook Dispatch...');
  const waRes = await fetch(`${API_BASE}/api/notifications/dispatch-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: 'b0000000-0000-0000-0000-000000000001',
      recipientPhone: '+919816012345',
      parentName: 'Mr. Ramesh Sharma'
    })
  });
  assert.strictEqual(waRes.status, 200, 'WhatsApp dispatch should succeed');
  const waData = await waRes.json();
  console.log(`✅ WhatsApp Notification Dispatched: ${waData.message} (Dispatch ID: ${waData.dispatchId})`);

  console.log('\n============================================================');
  console.log('🎉 100% COMPLETE: ALL 7 END-TO-END FLOW TESTS PASSED!');
  console.log('============================================================');
}

runEndToEndTest().catch(err => {
  console.error('\n❌ End-to-end test failed:', err);
  process.exit(1);
});
