// ==============================================================================
// TEST SUITE: Class 10 Math PYQ & NCERT Comprehensive Question Bank
// Verifies schema, data integrity, service methods, inMemoryStore, and API routes
// ==============================================================================

const assert = require('assert');
const http = require('http');

async function runTests() {
  console.log('[TEST] Starting Class 10 Math PYQ & NCERT Question Bank Verification...');

  // 1. Direct Service Verification
  console.log('[TEST 1] Verifying class10MathQuestionBank service module...');
  const mathBank = require('../src/services/class10MathQuestionBank');
  assert(mathBank, 'Failed to import class10MathQuestionBank module');
  assert(Array.isArray(mathBank.class10MathQuestions), 'class10MathQuestions is not an array');
  
  const total = mathBank.class10MathQuestions.length;
  console.log(`[TEST 1] Total questions in bank: ${total}`);
  assert(total >= 400, `Expected at least 400 questions, got ${total}`);

  // Summary check
  const summary = mathBank.getBankSummary();
  console.log('[TEST 1] Summary Chapter Breakdown:', summary.chaptersBreakdown);
  for (let ch = 1; ch <= 14; ch++) {
    assert(summary.chaptersBreakdown[ch] > 0, `Chapter ${ch} has no questions in summary!`);
    const chQuestions = mathBank.getQuestionsByChapter(ch);
    assert(chQuestions.length > 0, `getQuestionsByChapter(${ch}) returned empty!`);
  }
  console.log('PASS: All 14 chapters have questions.');

  // Source check
  const pyqs = mathBank.getQuestionsBySource('PYQ');
  const ncert = mathBank.getQuestionsBySource('NCERT');
  const pattern = mathBank.getQuestionsBySource('PATTERN');
  console.log(`[TEST 1] Sources: PYQs=${pyqs.length}, NCERT=${ncert.length}, Pattern=${pattern.length}`);
  assert(pyqs.length >= 300, `Expected >= 300 PYQs, got ${pyqs.length}`);
  assert(ncert.length >= 60, `Expected >= 60 NCERT questions, got ${ncert.length}`);
  console.log('PASS: All source categories verified.');

  // Format check
  const cases = mathBank.getQuestionsByFormat('CASE_BASED');
  const assertions = mathBank.getQuestionsByFormat('ASSERTION_REASON');
  console.log(`[TEST 1] Formats: Case-based=${cases.length}, Assertion-Reason=${assertions.length}`);
  assert(cases.length >= 15, `Expected >= 15 Case-based questions, got ${cases.length}`);
  assert(assertions.length >= 15, `Expected >= 15 Assertion-Reason questions, got ${assertions.length}`);
  console.log('PASS: Modern exam pattern formats verified.');

  // Search check
  const rootProof = mathBank.searchQuestions('irrational');
  console.log(`[TEST 1] Search 'irrational' returned ${rootProof.length} results.`);
  assert(rootProof.length > 0, 'Search for irrational returned no results');
  console.log('PASS: Search function verified.');

  // 2. Database In-Memory Store Verification
  console.log('[TEST 2] Verifying database inMemoryStore configuration...');
  const { inMemoryStore } = require('../src/config/database');
  assert(inMemoryStore.subjectBanks, 'subjectBanks missing from inMemoryStore');
  assert(Array.isArray(inMemoryStore.subjectBanks.class10_maths), 'class10_maths array missing from subjectBanks');
  assert(Array.isArray(inMemoryStore.subjectBanks.class10_math_pyq_ncert), 'class10_math_pyq_ncert array missing');
  assert.strictEqual(inMemoryStore.subjectBanks.class10_maths.length, total, 'inMemoryStore.class10_maths length mismatch');
  assert.strictEqual(inMemoryStore.subjectBanks.class10_math_pyq_ncert.length, total, 'inMemoryStore.class10_math_pyq_ncert length mismatch');
  console.log('PASS: Database inMemoryStore properly populated with full bank.');

  // 3. API Endpoints Verification
  console.log('[TEST 3] Testing backend server HTTP endpoints...');
  const PORT = process.env.PORT || 5050;

  function httpGet(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }).on('error', reject);
    });
  }

  // 3A. GET /api/questions/subject-banks
  const statsRes = await httpGet('/api/questions/subject-banks');
  assert.strictEqual(statsRes.status, 200, `Expected 200 from /api/questions/subject-banks, got ${statsRes.status}`);
  assert(statsRes.body.success, 'stats request failed');
  const mathStats = statsRes.body.stats.streams.FOUNDATION_CLASS_10.class10_math_pyq_ncert;
  assert(mathStats, 'class10_math_pyq_ncert missing from subject-banks stats');
  assert.strictEqual(mathStats.totalQuestions, total, `Stats totalQuestions mismatch: got ${mathStats.totalQuestions}, expected ${total}`);
  console.log(`PASS: /api/questions/subject-banks reports ${mathStats.totalQuestions} questions in table.`);

  // 3B. GET /api/questions/class10-math-bank
  const bankRes = await httpGet('/api/questions/class10-math-bank?limit=10');
  assert.strictEqual(bankRes.status, 200, 'Expected 200 from /api/questions/class10-math-bank');
  assert.strictEqual(bankRes.body.totalBankQuestions, total, 'Total bank questions mismatch in API');
  assert.strictEqual(bankRes.body.questions.length, 10, 'Limit pagination failed');
  console.log(`PASS: /api/questions/class10-math-bank endpoint working. Received ${bankRes.body.questions.length} sample items.`);

  // 3C. Filter by Chapter 1 (Real Numbers)
  const ch1Res = await httpGet('/api/questions/class10-math-bank?chapter=1&limit=100');
  assert.strictEqual(ch1Res.status, 200, 'Expected 200 for Chapter 1 filter');
  assert(ch1Res.body.filteredCount > 0, 'No questions found for Chapter 1');
  console.log(`PASS: Chapter 1 filter returned ${ch1Res.body.filteredCount} questions.`);

  // 3D. Filter by Source (NCERT)
  const ncertRes = await httpGet('/api/questions/class10-math-bank?source=NCERT&limit=100');
  assert.strictEqual(ncertRes.status, 200, 'Expected 200 for NCERT filter');
  assert(ncertRes.body.filteredCount >= 60, 'NCERT filter returned fewer than 60 questions');
  console.log(`PASS: NCERT source filter returned ${ncertRes.body.filteredCount} questions.`);

  // 3E. GET /api/curriculum/questions?grade=10&subjectKey=MATHEMATICS
  const currRes = await httpGet('/api/curriculum/questions?grade=10&subjectKey=MATHEMATICS&limit=10');
  assert.strictEqual(currRes.status, 200, 'Curriculum questions endpoint failed');
  assert(currRes.body.success, 'Curriculum questions not successful');
  console.log(`PASS: /api/curriculum/questions returns questions from full class10_maths bank (Total: ${currRes.body.totalCount}).`);

  console.log('\n======================================================');
  console.log('ALL TESTS PASSED! CLASS 10 MATH QUESTION BANK READY.');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('[TEST FAILURE]', err);
  process.exit(1);
});
