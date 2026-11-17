// ============================================================================
// TEST: NCERT AI STUDY ENGINE WITH ZERO-TOKEN CACHING VERIFICATION
// ============================================================================

const assert = require('assert');
const aiStudyService = require('../src/services/ncertAiStudyService');
const ncertService = require('../src/services/ncertReadingEngineService');

async function runTests() {
  console.log('🧪 Starting NCERT AI Study & Zero-Token Caching Suite...\n');

  // Test 1: Get sample topic
  const books = ncertService.listBooks();
  assert(books.length > 0, 'Books must be present');
  const tree = ncertService.getBookTree(books[0].id);
  assert(tree.chapters.length > 0, 'Chapters must be present');
  assert(tree.chapters[0].topics.length > 0, 'Topics must be present');

  const topicId = tree.chapters[0].topics[0].id;
  const topic = ncertService.getTopic(topicId);
  console.log(`[TEST 1] Testing with Topic: "${topic.title}" (${topic.id})`);

  // Test 2: Initial generation or retrieval
  console.log('[TEST 2] Invoking getTopicAiStudy...');
  const firstResult = await aiStudyService.getTopicAiStudy(topic, false);
  assert(firstResult, 'Result must be returned');
  assert(firstResult.summary_notes, 'summary_notes must be present');
  assert(firstResult.summary_notes.overview, 'overview must be present');
  assert(Array.isArray(firstResult.summary_notes.core_concepts), 'core_concepts must be array');
  assert(firstResult.bullet_points, 'bullet_points must be present');
  assert(Array.isArray(firstResult.bullet_points.high_yield_takeaways), 'high_yield_takeaways must be array');
  assert(Array.isArray(firstResult.bullet_points.governing_formulas), 'governing_formulas must be array');
  assert(Array.isArray(firstResult.quick_quiz), 'quick_quiz must be array');
  assert(firstResult.quick_quiz.length >= 3, 'quick_quiz must contain at least 3 questions');

  console.log('✅ Generated Study Aids:');
  console.log(`   - Summary Overview: "${firstResult.summary_notes.overview.slice(0, 80)}..."`);
  console.log(`   - Core Concepts Count: ${firstResult.summary_notes.core_concepts.length}`);
  console.log(`   - High Yield Points Count: ${firstResult.bullet_points.high_yield_takeaways.length}`);
  console.log(`   - Quick Quiz Questions: ${firstResult.quick_quiz.length}`);
  console.log(`   - Sample Quiz Question: "${firstResult.quick_quiz[0].question.slice(0, 80)}..."`);
  console.log(`   - Correct Answer: ${firstResult.quick_quiz[0].correct_answer}`);

  // Test 3: Zero-Token Caching Replay
  console.log('\n[TEST 3] Testing Zero-Token Cache Replay...');
  const cachedResult = await aiStudyService.getTopicAiStudy(topic, false);
  assert.strictEqual(cachedResult.cached, true, 'Result must be marked cached');
  assert(cachedResult.cache_hits >= 1, 'Cache hits must increment');
  assert(cachedResult.token_savings_description.includes('0 LLM tokens'), 'Must state 0 LLM tokens consumed');

  console.log(`✅ Cache Hit Confirmed!`);
  console.log(`   - Cached: ${cachedResult.cached}`);
  console.log(`   - Cache Hits: ${cachedResult.cache_hits}`);
  console.log(`   - Token Savings: ${cachedResult.token_savings_description}`);

  // Test 4: Subject Isolation Verification (Math Topic must have Math content, ZERO physics bias)
  console.log('\n[TEST 4] Testing Subject Isolation for Mathematics...');
  const mathBook = books.find(b => (b.subject || '').toLowerCase().includes('math') || (b.title || '').toLowerCase().includes('math'));
  if (mathBook) {
    const mathTree = ncertService.getBookTree(mathBook.id);
    const mathChap = mathTree.chapters.find(c => (c.title || '').toLowerCase().includes('matrices') || c.chapter_number === 3) || mathTree.chapters[0];
    const mathTopic = mathChap.topics.find(t => (t.title || '').toLowerCase().includes('matrix') || t.code === '3.2') || mathChap.topics[0];
    const fullMathTopic = ncertService.getTopic(mathTopic.id);
    console.log(`Testing Math Topic: "${fullMathTopic.title}" under "${mathChap.title}"`);

    const mathStudy = await aiStudyService.getTopicAiStudy(fullMathTopic, true);
    assert(mathStudy, 'Math study aid must be generated');
    const fullText = JSON.stringify(mathStudy).toLowerCase();
    assert(!fullText.includes('q = ne'), 'Math study aid must not contain physics formula q = ne');
    assert(!fullText.includes('coulomb'), 'Math study aid must not contain coulombs');
    assert(!fullText.includes('charge conservation'), 'Math study aid must not contain charge conservation');
    console.log(`✅ Mathematics Subject Isolation Verified!`);
    console.log(`   - Topic: ${mathStudy.topic_title}`);
    console.log(`   - Provider: ${mathStudy.llm_provider}`);
    console.log(`   - Formulas: ${JSON.stringify(mathStudy.bullet_points.governing_formulas.map(f => f.latex))}`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL NCERT AI STUDY & CACHING TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

