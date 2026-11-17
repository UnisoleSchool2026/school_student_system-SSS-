// ==============================================================================
// VERIFICATION SUITE: SUBJECT-ISOLATED REMEDIAL & QUIZ PIPELINE
// Tests:
// 1. Biology Quiz Generation: authentic Biology options (no genetic jumbling, no physics)
// 2. Biology Submission: 100% Biology remedial assignment (no Spherical Mirrors/Physics)
// 3. Pipeline Tools: quizTool, testTool, assignmentTool context preservation
// 4. Formula Verification: Biology mathematical equations (dN/dt = rN(K-N)/K, p^2+2pq+q^2=1)
// 5. DOCX Export: Biology remedial assignment Word export
// ==============================================================================

const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('==============================================================================');
  console.log('🔬 RUNNING HAPS-AI SUBJECT & REMEDIAL PIPELINE INTEGRATION TEST SUITE');
  console.log('==============================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------------------
  // TEST 1: Biology Quiz Generation has Authentic Biology Options
  // ----------------------------------------------------------------------------
  console.log('📌 Test 1: Generate Biology Quiz for Chapter 1 (Sexual Reproduction in Flowering Plants)...');
  const quizRes = await request({
    hostname: 'localhost',
    port: 5050,
    path: '/api/curriculum/generate-test',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    classKey: '12-Med',
    grade: '12',
    section: '12-Med',
    subjectKey: 'BIOLOGY',
    subjectName: 'Biology',
    chapterNumber: 1,
    chapterName: 'Sexual Reproduction in Flowering Plants',
    mode: 'QUIZ',
    questionCount: 3,
    difficulty: 'MEDIUM'
  });

  assert(quizRes.status === 201, `Status code is 201 (Got ${quizRes.status})`);
  const quiz = quizRes.data?.assessment;
  assert(quiz && quiz.subject === 'Biology', `Quiz subject is strictly Biology (Got "${quiz?.subject}")`);
  assert(quiz && quiz.questions && quiz.questions.length >= 1, `Quiz contains questions (${quiz?.questions?.length})`);

  // Check the first question options
  const q1 = quiz?.questions[0];
  console.log(`     Question 1: "${q1?.question_latex?.slice(0, 70)}..."`);
  assert(Array.isArray(q1?.options) && q1.options.length === 4, `Question 1 has 4 distinct options`);
  
  const optLatexStrings = (q1?.options || []).map(o => o.latex).join(' ');
  const hasBiologyContent = /sporopollenin|synergid|pollen|filiform|embryo/i.test(optLatexStrings) ||
                           /ovulation|progesterone|estrogen|LH/i.test(optLatexStrings) ||
                           /nematode|dsRNA|Agrobacterium/i.test(optLatexStrings) ||
                           /carrying capacity|dN\/dt|logistic/i.test(optLatexStrings) ||
                           /physiological|cellular|pathway|species/i.test(optLatexStrings);
  assert(hasBiologyContent, `Options contain authentic biological terms, NOT physics sign conventions`);

  const hasPhysicsContamination = /spherical mirror|focal length|refractive index|joule heating|angular acceleration/i.test(optLatexStrings);
  assert(!hasPhysicsContamination, `Options have ZERO Physics contamination`);

  // ----------------------------------------------------------------------------
  // TEST 2: Submit Biology Quiz & Verify Remedial Assignment is 100% Biology
  // ----------------------------------------------------------------------------
  console.log('\n📌 Test 2: Submit Biology Quiz with wrong answers and check remedial assignment...');
  const submitRes = await request({
    hostname: 'localhost',
    port: 5050,
    path: `/api/assessments/${quiz.id}/submit`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentId: 'b0000000-0000-0000-0000-000000000011',
    studentName: 'Ananya Thakur',
    answers: quiz.questions.map((q, idx) => ({
      questionId: q.id,
      selectedOption: 'D', // deliberately miss question
      timeSpentSeconds: 85,
      hesitationSeconds: 12,
      hintsUsed: 0
    }))
  });

  assert(submitRes.status === 200, `Submit status is 200 (Got ${submitRes.status})`);
  const results = submitRes.data?.results;
  assert(results?.subject === 'Biology', `Submission results subject is Biology (Got "${results?.subject}")`);

  const remedial = results?.personalizedAssignment;
  assert(remedial && remedial.subject === 'Biology', `Remedial assignment subject is strictly Biology (Got "${remedial?.subject}")`);
  assert(!remedial?.title?.includes('Light'), `Remedial title is NOT Physics Light (Title: "${remedial?.title}")`);

  // Check formula drills
  const drills = remedial?.formulaDrills || [];
  console.log(`     Remedial Formula Drills Count: ${drills.length}`);
  drills.forEach((d, idx) => {
    console.log(`     Drill ${idx + 1}: [${d.subject}] ${d.subtopic} -> ${d.formulaName}`);
    assert(d.subject === 'Biology', `Drill ${idx + 1} is Biology (Got "${d.subject}")`);
    assert(!/mirror|snell|joule|torque|physics/i.test(d.formulaName), `Drill ${idx + 1} has NO Physics formula names`);
  });

  // Check remedial practice questions
  const remQs = remedial?.remedialQuestions || [];
  console.log(`     Remedial Practice Questions Count: ${remQs.length}`);
  remQs.forEach((rq, idx) => {
    console.log(`     Remedial Q${idx + 1}: ${rq.subtopic} (${rq.subject})`);
    assert(rq.subject === 'Biology', `Practice Q${idx + 1} is Biology (Got "${rq.subject}")`);
    assert(!/mirror|refraction|joule|cylinder/i.test(rq.questionLatex), `Practice Q${idx + 1} question text has NO Physics questions`);
  });

  // Check faculty proctor
  const faculty = remedial?.dualActionPlan?.hostelPrepAction?.faculty;
  console.log(`     Faculty Proctor: "${faculty}"`);
  assert(/biology|medical|neet/i.test(faculty), `Faculty proctor is Biology/NEET Medical proctor, NOT Physics/Math proctor`);

  // ----------------------------------------------------------------------------
  // TEST 3: Pipeline Tools Endpoints (quizTool, testTool, remedialTool)
  // ----------------------------------------------------------------------------
  console.log('\n📌 Test 3: Verify dedicated Pipeline Tools endpoints...');
  const toolQuizRes = await request({
    hostname: 'localhost',
    port: 5050,
    path: '/api/assessments/tools/quiz',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    grade: '12',
    section: '12-Med',
    subjectName: 'Biology',
    subjectKey: 'BIOLOGY',
    chapterNumber: 11,
    chapterName: 'Organisms and Populations',
    subtopics: ['Verhulst-Pearl Logistic Growth Equation'],
    questionCount: 3
  });

  assert(toolQuizRes.status === 201, `quizTool status is 201 (Got ${toolQuizRes.status})`);
  assert(toolQuizRes.data?.quiz?.subject === 'Biology', `quizTool produced Biology quiz`);

  // ----------------------------------------------------------------------------
  // TEST 4: Formula Verification for Biology Formulas
  // ----------------------------------------------------------------------------
  console.log('\n📌 Test 4: Verify student input for Biology formulas & principles...');
  const verify1 = await request({
    hostname: 'localhost',
    port: 5050,
    path: '/api/assessments/remedial/verify-formula',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    subtopic: 'Verhulst-Pearl Logistic Growth Equation',
    formulaInput: 'dN/dt = rN((K-N)/K)',
    subject: 'Biology'
  });

  assert(verify1.status === 200, `verify-formula status is 200`);
  assert(verify1.data?.isValid === true, `Verhulst-Pearl dN/dt = rN((K-N)/K) accurately verified (isValid: true)`);
  console.log(`     Model feedback: "${verify1.data?.message}"`);

  const verify2 = await request({
    hostname: 'localhost',
    port: 5050,
    path: '/api/assessments/remedial/verify-formula',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    subtopic: 'Hardy-Weinberg Principle & Carrier Frequency',
    formulaInput: 'p^2 + 2pq + q^2 = 1',
    subject: 'Biology'
  });

  assert(verify2.data?.isValid === true, `Hardy-Weinberg p^2 + 2pq + q^2 = 1 accurately verified (isValid: true)`);

  // ----------------------------------------------------------------------------
  // TEST 5: Word Document (.docx) Export for Biology Remedial Assignment
  // ----------------------------------------------------------------------------
  console.log('\n📌 Test 5: Verify Word DOCX export of Biology Remedial Assignment...');
  const docxRes = await request({
    hostname: 'localhost',
    port: 5050,
    path: '/api/assessments/remedial/export-docx',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    assignment: remedial
  });

  assert(docxRes.status === 200, `DOCX export status is 200 (Got ${docxRes.status})`);
  assert(
    docxRes.headers['content-type']?.includes('openxmlformats-officedocument.wordprocessingml.document'),
    `Content-Type is valid Word .docx document`
  );
  assert(Number(docxRes.headers['content-length'] || 0) > 1000, `DOCX file size > 1000 bytes (${docxRes.headers['content-length']} bytes)`);

  // ----------------------------------------------------------------------------
  // FINAL SUMMARY
  // ----------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(`🏁 TEST COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('==============================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
