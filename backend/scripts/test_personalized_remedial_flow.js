// ==============================================================================
// TEST: COMPLETE STUDENT ATTEMPT & PERSONALIZED REMEDIAL ASSIGNMENT FLOW
// ==============================================================================

const assert = require('assert');
const { app } = require('../src/server');
const { generatePersonalizedRemedialAssignment, verifyStudentFormula } = require('../src/services/remedialAssignmentService');

async function testRemedialFlow() {
  console.log('🧪 Running Test: Student Attempt & Personalized Remedial Flow...\n');

  // 1. Simulate Student Attempt Telemetry
  const simulatedBreakdown = [
    {
      questionIndex: 1,
      questionId: 'q_asgn_01',
      topic: 'Light – Reflection and Refraction',
      subtopic: 'Spherical Mirrors',
      selectedOption: 'C', // WRONG OPTION: Sign convention error
      correctAnswer: 'B',
      isCorrect: false,
      timeSpentSeconds: 112,
      benchmarkSeconds: 90,
      mistakeClassification: { explanation: 'Sign convention error: took real image as positive' }
    },
    {
      questionIndex: 2,
      questionId: 'q_asgn_02',
      topic: 'Light – Reflection and Refraction',
      subtopic: 'Refraction & Snell Law',
      selectedOption: 'A', // CORRECT OPTION
      correctAnswer: 'A',
      isCorrect: true,
      timeSpentSeconds: 45,
      benchmarkSeconds: 75
    },
    {
      questionIndex: 3,
      questionId: 'q_asgn_03',
      topic: 'Electricity',
      subtopic: 'Joule Heating & Resistance',
      selectedOption: 'B', // WRONG OPTION: Forgot hours to seconds conversion
      correctAnswer: 'A',
      isCorrect: false,
      timeSpentSeconds: 128,
      benchmarkSeconds: 90,
      mistakeClassification: { explanation: 'Forgot to convert hours to seconds (3600s)' }
    }
  ];

  console.log('1. Generating Personalized Remedial Assignment based on test errors...');
  const assignment = generatePersonalizedRemedialAssignment({
    studentId: 'b0000000-0000-0000-0000-000000000001',
    studentName: 'Aryan Sharma',
    rollNumber: '11-S-24',
    assessmentId: 'asgn_10_sci_01',
    assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
    questionBreakdown: simulatedBreakdown
  });

  assert.ok(assignment.assignmentId, 'Assignment ID should be present');
  console.log('✅ Remedial Assignment Created:', assignment.assignmentId);
  console.log('   Title:', assignment.title);
  console.log('   Accuracy:', assignment.performanceSummary.accuracyPercentage + '%');
  console.log('   Identified Concept Gaps:', assignment.conceptGaps.length);

  // 2. Validate Part 1: Formula Drills
  console.log('\n2. Validating Formula Recall & Derivation Drills (Write That Formula)...');
  assert.strictEqual(assignment.formulaDrills.length, 2, 'Should create 2 formula drills for the 2 wrong subtopics');
  
  const mirrorDrill = assignment.formulaDrills.find(f => f.subtopic === 'Spherical Mirrors');
  assert.ok(mirrorDrill, 'Mirror formula drill must exist');
  console.log('   Formula Drill 1:', mirrorDrill.formulaName);
  console.log('   Prompt:', mirrorDrill.prompt);
  console.log('   Sign Rules:', mirrorDrill.rulesAndTraps);

  const jouleDrill = assignment.formulaDrills.find(f => f.subtopic === 'Joule Heating & Resistance');
  assert.ok(jouleDrill, 'Joule formula drill must exist');
  console.log('   Formula Drill 2:', jouleDrill.formulaName);
  console.log('   Prompt:', jouleDrill.prompt);

  // 3. Test Formula Input Verification
  console.log('\n3. Testing Formula Write-In Verification Engine...');
  const correctCheck = verifyStudentFormula('Spherical Mirrors', '1/f = 1/v + 1/u');
  assert.strictEqual(correctCheck.isValid, true, 'Standard mirror formula should be valid');
  console.log('   Input: "1/f = 1/v + 1/u" ->', correctCheck.isValid ? '✅ VALID' : '❌ INVALID', '|', correctCheck.message);

  const correctCheck2 = verifyStudentFormula('Joule Heating & Resistance', 'H = I^2 * R * t');
  assert.strictEqual(correctCheck2.isValid, true, 'Joule heating formula should be valid');
  console.log('   Input: "H = I^2 * R * t" ->', correctCheck2.isValid ? '✅ VALID' : '❌ INVALID', '|', correctCheck2.message);

  const incorrectCheck = verifyStudentFormula('Spherical Mirrors', 'f = v * u');
  assert.strictEqual(incorrectCheck.isValid, false, 'Invalid formula should be rejected');
  console.log('   Input: "f = v * u" (wrong) ->', incorrectCheck.isValid ? '❌ INVALID' : '✅ CORRECTLY REJECTED');

  // 4. Validate Part 2: Targeted Practice Questions
  console.log('\n4. Validating Targeted Practice Questions (Questions on that Formula)...');
  assert.strictEqual(assignment.remedialQuestions.length, 2, 'Should create 2 targeted practice questions');
  for (const q of assignment.remedialQuestions) {
    console.log(`   • ${q.subtopic}: "${q.questionLatex.slice(0, 60)}..."`);
    assert.ok(q.options && q.options.length === 4, 'Each remedial question should have 4 options');
    assert.ok(q.solutionLatex, 'Each remedial question should provide a step-by-step LaTeX derivation');
  }

  // 5. Validate Part 3: Dual Action Directives
  console.log('\n5. Validating Dual Action Directives...');
  assert.ok(assignment.dualActionPlan.hostelPrepAction.directive, 'Hostel prep directive must exist');
  assert.ok(assignment.dualActionPlan.parentHomeAction.directive, 'Parent home directive must exist');
  console.log('   Hostel Directive:', assignment.dualActionPlan.hostelPrepAction.directive);
  console.log('   Parent Directive:', assignment.dualActionPlan.parentHomeAction.directive);

  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED: END-TO-END REMEDIAL ENGINE VERIFIED!');
}

testRemedialFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
