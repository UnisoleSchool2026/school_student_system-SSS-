// ============================================================================
// TEST: NCERT Reading Engine Verification
// Tests authentication, upload pipeline, and extracted tree & topic inspection.
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ncertService = require('../src/services/ncertReadingEngineService');

async function runTests() {
  console.log('🧪 Starting NCERT Reading Engine Verification Suite...\n');

  // Test 1: Authentication
  console.log('--- TEST 1: Admin Authentication ---');
  const auth = ncertService.login('ncert-admin@example.com', 'Admin@12345678');
  assert(auth.access_token, 'Access token should be issued');
  assert.strictEqual(auth.user.role, 'admin');
  console.log('✅ Admin signed in successfully. Token type:', auth.token_type);

  // Test 2: Token verification
  console.log('\n--- TEST 2: Token Verification ---');
  const verified = ncertService.verifyToken(`Bearer ${auth.access_token}`);
  assert.strictEqual(verified.email, 'ncert-admin@example.com');
  assert.strictEqual(verified.role, 'admin');
  console.log('✅ Token decoded and verified.');

  // Test 3: Ingestion Pipeline (Upload PDF)
  console.log('\n--- TEST 3: Ingestion Pipeline Execution (Upload PDF) ---');
  const samplePdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Title (NCERT Sample Chapter) >>\nendobj\n' +
    'Chapter 1: Units and Measurements\n1.1 Introduction\nMeasurement of any physical quantity involves comparison with a standard.\n' +
    '1.2 The International System of Units\nIn earlier time scientists of different countries were using different systems of units.\n%%EOF'
  );

  const uploadResult = await ncertService.uploadBook({
    fileBuffer: samplePdfBuffer,
    originalName: 'Class11_Physics_Units.pdf',
    class_no: 11,
    subject: 'Physics',
    language: 'en',
    edition: '2026',
    reprocess: true
  });

  assert(uploadResult.job_id, 'Job ID must be returned');
  console.log(`✅ Upload accepted. Job ID: ${uploadResult.job_id}`);

  // Wait for ingestion pipeline stages to complete
  let jobState = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 100));
    jobState = ncertService.getJob(uploadResult.job_id);
    if (jobState.status === 'succeeded' || jobState.status === 'failed') break;
  }

  assert.strictEqual(jobState.status, 'succeeded', `Job should succeed, got: ${jobState.status}`);
  console.log(`✅ Job finished successfully! Final stage: ${jobState.current_stage} (100%)`);
  console.log(`   Completed stages: ${jobState.stages.map(s => s.stage).join(' -> ')}`);

  // Test 4: Book Tree Navigation on Uploaded Book
  console.log('\n--- TEST 4: Uploaded Book Tree Hierarchy ---');
  const tree = ncertService.getBookTree(jobState.book_id, true);
  assert(tree.chapters.length > 0, 'Chapters should be present');
  const ch1 = tree.chapters[0];
  assert(ch1.topics.length > 0, 'Topics should be present in chapter 1');
  console.log(`✅ Loaded tree for "${tree.title}": ${tree.chapters.length} chapter(s).`);
  console.log(`   Sample Chapter: "${ch1.title}" with ${ch1.topics.length} topics:`);
  ch1.topics.forEach(t => console.log(`     ↳ ${t.code} ${t.title} (${t.word_count} words, confidence ${Math.round(t.confidence * 100)}%)`));

  // Test 5: Topic Content & Extraction Details
  console.log('\n--- TEST 5: Topic Content Inspection ---');
  const top1 = ncertService.getTopic(ch1.topics[0].id);
  assert(top1.content_text && top1.content_text.length > 10, 'Topic must contain extracted text');
  console.log(`✅ Topic ${top1.code} (${top1.title}):`);
  console.log(`   Review Status: ${top1.review_status} | Word Count: ${top1.word_count}`);
  console.log(`   Content Preview: "${top1.content_text.slice(0, 140).replace(/\n/g, ' ')}..."`);

  console.log('\n======================================================');
  console.log('🎉 ALL NCERT READING ENGINE TESTS VERIFIED 100%!');
  console.log('======================================================');

  // Clean up only the temporary test book from store
  if (jobState && jobState.book_id) {
    ncertService.books.delete(jobState.book_id);
    ncertService.saveToDisk();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
