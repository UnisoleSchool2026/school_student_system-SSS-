// ============================================================================
// PHASE 1 VERIFICATION TEST: Ingestion Context Propagation & Authorization
// ============================================================================

const assert = require('assert');
const { validateIngestionPayload, authorizeIngestionContext } = require('../src/validators/questionIngestionValidator');
const { commitQuestionToStore, commitBatchQuestionsToStore } = require('../src/services/questionInjectionService');
const tenants = require('../src/services/tenantConfigService');

async function runTests() {
  console.log('--- RUNNING PHASE 1 INGESTION CONTEXT & AUTHORIZATION TESTS ---');

  const defaultTenant = tenants.getDefaultTenant();
  assert(defaultTenant, 'Default tenant should exist');

  const teacher = {
    id: 'fac_phy_01',
    name: 'Dr. Vikram Sharma',
    subject: 'Physics',
    subjectKey: 'PHYSICS',
    department: 'PHYSICS',
    role: 'TEACHER'
  };

  // TEST 1: Missing mode returns 400
  console.log('Test 1: Missing mode returns 400...');
  assert.throws(
    () => {
      validateIngestionPayload({
        track: 'CBSE',
        subject: 'Physics',
        payload: 'Q1. Calculate electric flux.'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 400);
      assert(err.message.includes('Mode') || err.message.includes('BOARD'));
      return true;
    }
  );
  console.log('  Passed: Missing mode rejected with 400.');

  // TEST 2: Missing track returns 400
  console.log('Test 2: Missing track returns 400...');
  assert.throws(
    () => {
      validateIngestionPayload({
        mode: 'BOARD',
        subject: 'Physics',
        payload: 'Q1. Calculate electric flux.'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 400);
      return true;
    }
  );
  console.log('  Passed: Missing track rejected with 400.');

  // TEST 3: Invalid track for mode returns 400
  console.log('Test 3: Invalid track for mode returns 400...');
  assert.throws(
    () => {
      validateIngestionPayload({
        mode: 'BOARD',
        track: 'NEET', // NEET is competitive, not board
        subject: 'Physics',
        payload: 'Q1. Calculate electric flux.'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 400);
      assert(err.message.includes('Invalid board track'));
      return true;
    }
  );
  console.log('  Passed: Cross-mode track rejected with 400.');

  // TEST 4: Unauthorized role returns 403
  console.log('Test 4: Student role cannot inject questions (403)...');
  assert.throws(
    () => {
      authorizeIngestionContext({
        tenant: defaultTenant,
        user: { id: 'stud_001', role: 'STUDENT' },
        mode: 'BOARD',
        track: 'CBSE'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 403);
      assert.strictEqual(err.code, 'FORBIDDEN_ROLE');
      return true;
    }
  );
  console.log('  Passed: Student role blocked with 403.');

  // TEST 5: Disabled mode on tenant returns 403
  console.log('Test 5: Disabled mode on tenant returns 403...');
  const boardOnlyTenant = {
    ...defaultTenant,
    name: 'Board Only Academy',
    activeModes: ['BOARD']
  };
  assert.throws(
    () => {
      authorizeIngestionContext({
        tenant: boardOnlyTenant,
        user: teacher,
        mode: 'COMPETITIVE',
        track: 'JEE'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 403);
      assert.strictEqual(err.code, 'MODE_DISABLED');
      return true;
    }
  );
  console.log('  Passed: Disabled tenant mode blocked with 403.');

  // TEST 6: Disabled board/track returns 403
  console.log('Test 6: Disabled board on tenant returns 403...');
  const cbseOnlyTenant = {
    ...defaultTenant,
    name: 'CBSE Exclusive School',
    activeModes: ['BOARD'],
    boardConfig: { enabledBoards: ['CBSE'] }
  };
  assert.throws(
    () => {
      authorizeIngestionContext({
        tenant: cbseOnlyTenant,
        user: teacher,
        mode: 'BOARD',
        track: 'ICSE'
      });
    },
    (err) => {
      assert.strictEqual(err.status, 403);
      assert.strictEqual(err.code, 'BOARD_DISABLED');
      return true;
    }
  );
  console.log('  Passed: Disabled board track blocked with 403.');

  // TEST 7: Commit BOARD question to store
  console.log('Test 7: Commit BOARD CBSE question to store...');
  const boardQ = commitQuestionToStore({
    structuredQuestion: {
      question_latex: 'State Gauss law in electrostatics.',
      options_latex: [],
      chapter_name: 'Electric Charges and Fields',
      marks_weightage: 2,
      difficulty: 'MEDIUM'
    },
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    examMode: 'BOARD',
    examTrack: 'CBSE',
    persistImmediately: false
  });

  assert.strictEqual(boardQ.question.target_modes[0], 'BOARD');
  assert.deepStrictEqual(boardQ.question.board_targets, ['CBSE']);
  assert.deepStrictEqual(boardQ.question.competitive_targets, []);
  assert.strictEqual(boardQ.question.curriculum_board, 'CBSE');
  console.log('  Passed: BOARD question correctly tagged and isolated.');

  // TEST 8: Commit COMPETITIVE NEET question to store
  console.log('Test 8: Commit COMPETITIVE NEET question to store...');
  const compQ = commitQuestionToStore({
    structuredQuestion: {
      question_latex: 'A body falls freely under gravity from rest. The ratio of distances travelled in 1st, 2nd, and 3rd second is:',
      options_latex: [
        { key: 'A', latex: '1 : 2 : 3', is_correct: false },
        { key: 'B', latex: '1 : 3 : 5', is_correct: true },
        { key: 'C', latex: '1 : 4 : 9', is_correct: false },
        { key: 'D', latex: '9 : 4 : 1', is_correct: false }
      ],
      chapter_name: 'Motion in a Straight Line',
      marks_weightage: 4,
      difficulty: 'MEDIUM'
    },
    teacher,
    targetSubject: 'Physics',
    grade: '11',
    examMode: 'COMPETITIVE',
    examTrack: 'NEET',
    persistImmediately: false
  });

  assert.strictEqual(compQ.question.target_modes[0], 'COMPETITIVE');
  assert.deepStrictEqual(compQ.question.competitive_targets, ['NEET']);
  assert.deepStrictEqual(compQ.question.board_targets, []);
  console.log('  Passed: COMPETITIVE NEET question correctly tagged without CBSE default.');

  // TEST 9: Batch commit with COMPETITIVE JEE
  console.log('Test 9: Batch commit with COMPETITIVE JEE...');
  const batchRes = commitBatchQuestionsToStore({
    questions: [
      {
        question_latex: 'Two coherent sources have intensity ratio 100:1. The ratio between maximum and minimum intensities in interference pattern is:',
        options_latex: [
          { key: 'A', latex: '121:81', is_correct: true },
          { key: 'B', latex: '100:1', is_correct: false },
          { key: 'C', latex: '10:1', is_correct: false },
          { key: 'D', latex: '49:25', is_correct: false }
        ],
        chapter_name: 'Wave Optics',
        marks_weightage: 4
      }
    ],
    teacher,
    targetSubject: 'Physics',
    grade: '12',
    examMode: 'COMPETITIVE',
    examTrack: 'JEE'
  });

  assert.strictEqual(batchRes.count, 1);
  assert.strictEqual(batchRes.questions[0].target_modes[0], 'COMPETITIVE');
  assert.deepStrictEqual(batchRes.questions[0].competitive_targets, ['JEE_MAIN']);
  assert.deepStrictEqual(batchRes.questions[0].board_targets, []);
  console.log('  Passed: Batch commit tags COMPETITIVE JEE accurately.');

  console.log('--- ALL PHASE 1 TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('Phase 1 test failed:', err);
  process.exit(1);
});

