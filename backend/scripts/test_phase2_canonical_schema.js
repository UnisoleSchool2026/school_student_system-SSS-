// ============================================================================
// PHASE 2 VERIFICATION TEST: Canonical Schema, Invariants, Deduplication & Lifecycle
// ============================================================================

const assert = require('assert');
const { computeContentHash, validateQuestionInvariants, STATUS_LIFECYCLE } = require('../src/services/questionCanonicalSchema');
const { commitQuestionToStore } = require('../src/services/questionInjectionService');
const content = require('../src/services/canonicalContentService');

async function runTests() {
  console.log('--- RUNNING PHASE 2 CANONICAL SCHEMA & LIFECYCLE TESTS ---');

  const teacher = {
    id: 'fac_phy_01',
    name: 'Dr. Vikram Sharma',
    subject: 'Physics',
    subjectKey: 'PHYSICS',
    department: 'PHYSICS',
    role: 'TEACHER'
  };

  // TEST 1: Deterministic Content Hashing
  console.log('Test 1: Content hash is deterministic and ignores trivial spacing/casing...');
  const hash1 = computeContentHash({
    question_latex: 'State Gauss   law in electrostatics. ',
    options_latex: [
      { key: 'A', latex: '\\Phi = \\frac{q}{\\varepsilon_0}' },
      { key: 'B', latex: '\\Phi = 0' }
    ]
  });
  const hash2 = computeContentHash({
    question_latex: 'state gauss law in electrostatics.',
    options_latex: [
      { key: 'a', latex: ' \\Phi = \\frac{q}{\\varepsilon_0} ' },
      { key: 'b', latex: '\\Phi = 0' }
    ]
  });
  assert.strictEqual(hash1, hash2, 'Normalized content hashes must match identical semantic content');
  console.log('  Passed: Hashes are deterministic and case/whitespace-invariant.');

  // TEST 2: Invariant: Negative marking must NOT be on question
  console.log('Test 2: Question rejecting negative marks property (belongs to exam pattern)...');
  assert.throws(
    () => {
      validateQuestionInvariants({
        target_modes: ['COMPETITIVE'],
        competitive_targets: ['JEE_MAIN'],
        negative_marks: -1,
        question_latex: 'Test'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 422);
      assert(err.message.includes('Negative marking must NOT be stored on question record'));
      return true;
    }
  );
  console.log('  Passed: Storing negative marks on question rejected with 422.');

  // TEST 3: Invariant: Missing target arrays
  console.log('Test 3: Rejecting BOARD without board_targets, COMPETITIVE without competitive_targets...');
  assert.throws(
    () => {
      validateQuestionInvariants({
        target_modes: ['BOARD'],
        board_targets: [],
        question_latex: 'Test'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 422);
      assert(err.message.includes('board_target'));
      return true;
    }
  );
  assert.throws(
    () => {
      validateQuestionInvariants({
        target_modes: ['COMPETITIVE'],
        competitive_targets: [],
        question_latex: 'Test'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 422);
      assert(err.message.includes('competitive_target'));
      return true;
    }
  );
  console.log('  Passed: Missing target arrays rejected with 422.');

  // TEST 4: Invariant: MCQ with < 2 options
  console.log('Test 4: MCQ question with < 2 options rejected...');
  assert.throws(
    () => {
      validateQuestionInvariants({
        target_modes: ['BOARD'],
        board_targets: ['CBSE'],
        question_format: 'MCQ_SINGLE',
        options_latex: [{ key: 'A', latex: 'Only one' }],
        question_latex: 'Test'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 422);
      assert(err.message.includes('at least 2 options'));
      return true;
    }
  );
  console.log('  Passed: Insufficient MCQ options rejected with 422.');

  // TEST 5: Deduplication prevents duplicate insertion
  console.log('Test 5: Content hash deduplication blocks identical re-insertion...');
  const qPayload = {
    question_latex: 'Derive an expression for the capacitance of a parallel plate capacitor.',
    options_latex: [],
    chapter_name: 'Electrostatic Potential and Capacitance',
    marks_weightage: 3,
    difficulty: 'MEDIUM'
  };

  const firstCommit = commitQuestionToStore({
    structuredQuestion: qPayload,
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    examMode: 'BOARD',
    examTrack: 'CBSE',
    persistImmediately: false
  });
  assert(!firstCommit.duplicate, 'First commit must not be marked as duplicate');

  const secondCommit = commitQuestionToStore({
    structuredQuestion: qPayload,
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    examMode: 'BOARD',
    examTrack: 'CBSE',
    persistImmediately: false
  });
  assert(secondCommit.duplicate, 'Second commit of identical question must be flagged duplicate');
  assert.strictEqual(secondCommit.question.id, firstCommit.question.id, 'Duplicate returns the existing question ID');
  console.log('  Passed: Deduplication successfully prevented second insertion.');

  // TEST 6: Lifecycle status visibility isolation
  console.log('Test 6: Student queries only return APPROVED questions (DRAFT & PENDING_REVIEW hidden)...');
  const draftCommit = commitQuestionToStore({
    structuredQuestion: {
      question_latex: 'Unapproved draft question that failed reconciliation #draft_test_1',
      options_latex: [],
      chapter_name: 'Current Electricity',
      marks_weightage: 2,
      difficulty: 'EASY',
      status: STATUS_LIFECYCLE.DRAFT
    },
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    examMode: 'BOARD',
    examTrack: 'CBSE',
    persistImmediately: false
  });

  assert.strictEqual(draftCommit.question.status, 'DRAFT');

  // Verify canonicalContentService.query() does NOT return the DRAFT question to students
  const studentResults = content.query({
    mode: 'BOARD',
    board: 'CBSE',
    search: 'draft_test_1'
  });
  assert.strictEqual(studentResults.total, 0, 'DRAFT questions must not be returned in standard student queries');

  // Verify review query with status: 'ALL' DOES return it
  const teacherResults = content.query({
    mode: 'BOARD',
    board: 'CBSE',
    search: 'draft_test_1',
    status: 'ALL'
  });
  assert.strictEqual(teacherResults.total, 1, 'DRAFT questions must be visible when querying status: ALL');
  console.log('  Passed: Student queries strictly isolate APPROVED questions.');

  console.log('--- ALL PHASE 2 TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('Phase 2 test failed:', err);
  process.exit(1);
});

