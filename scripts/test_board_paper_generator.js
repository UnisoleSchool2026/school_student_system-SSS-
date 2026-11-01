const assert = require('assert');
const {
  BOARD_BLUEPRINTS,
  generateBoardQuestionPaper,
  swapPaperQuestion,
  getAlternativeQuestions,
  addCustomQuestionToPaper,
  updatePaperQuestion,
  deletePaperQuestion
} = require('../backend/src/services/boardPaperGeneratorService');

console.log('--- TESTING FULL-LENGTH BOARD QUESTION PAPER GENERATOR ---');

// 1. Test CBSE Class 10 Science Paper Generation
console.log('[TEST 1] Generating CBSE Class 10 Science Paper (80 Marks)...');
const cbse10Sci = generateBoardQuestionPaper({
  board: 'CBSE',
  grade: '10',
  subject: 'Science'
});
assert.strictEqual(cbse10Sci.board, 'CBSE');
assert.strictEqual(cbse10Sci.grade, '10');
assert.strictEqual(cbse10Sci.totalMarks, 80);
assert.strictEqual(cbse10Sci.sections.length, 5);
console.log(`[PASS] CBSE Class 10 Science Paper generated: ${cbse10Sci.totalQuestions} Questions, ${cbse10Sci.totalMarks} Marks.`);

// 2. Test HP Board Class 12 Physics Paper Generation
console.log('[TEST 2] Generating HP Board (HPBOSE) Class 12 Physics Paper (60 Marks)...');
const hp12Phy = generateBoardQuestionPaper({
  board: 'HP_BOARD',
  grade: '12',
  subject: 'Physics'
});
assert.strictEqual(hp12Phy.board, 'HP_BOARD');
assert.strictEqual(hp12Phy.totalMarks, 60);
assert.strictEqual(hp12Phy.sections.length, 4);
assert.strictEqual(hp12Phy.totalQuestions, 28);
assert(hp12Phy.sections[0].name.includes('खण्ड-क'), 'HP Board paper includes Hindi section name');
console.log(`[PASS] HP Board Class 12 Physics Paper generated: ${hp12Phy.totalQuestions} Questions, ${hp12Phy.totalMarks} Marks (Bilingual खण्ड-क to खण्ड-घ).`);

// 3. Test Teacher Swapping a Question
console.log('[TEST 3] Testing Question Swap...');
const qToSwap = hp12Phy.sections[0].questions[0];
const swapRes = swapPaperQuestion({
  paper: hp12Phy,
  questionId: qToSwap.id
});
assert.strictEqual(swapRes.paper.sections[0].questions[0].question_number, 1);
assert.strictEqual(swapRes.paper.isCustomizedByTeacher, true);
console.log(`[PASS] Question Q1 swapped successfully.`);

// 4. Test Teacher Adding Custom Question
console.log('[TEST 4] Testing Teacher Custom Question Addition...');
const addRes = addCustomQuestionToPaper({
  paper: hp12Phy,
  sectionId: 'sec_b',
  questionData: {
    question_latex: 'Derive an expression for the energy stored in a parallel plate capacitor of capacitance C and potential difference V.',
    marks: 2,
    solution: 'U = 1/2 C V^2'
  }
});
assert.strictEqual(addRes.paper.totalQuestions, 29);
assert.strictEqual(addRes.paper.totalMarks, 62);
console.log(`[PASS] Custom question added. Total questions now: ${addRes.paper.totalQuestions}, Marks: ${addRes.paper.totalMarks}.`);

// 5. Test Teacher Editing Question In-Place
console.log('[TEST 5] Testing Question Edit In-Place...');
const editedPaper = updatePaperQuestion({
  paper: hp12Phy,
  questionId: addRes.addedQuestion.id,
  updatedData: {
    question_latex: 'Updated Question: Calculate the electrostatic potential energy of capacitor.',
    marks: 3
  }
});
const updatedQ = editedPaper.sections.find(s => s.id === 'sec_b').questions.find(q => q.id === addRes.addedQuestion.id);
assert.strictEqual(updatedQ.marks, 3);
assert.strictEqual(editedPaper.totalMarks, 63);
console.log(`[PASS] Question edited in-place with updated marks.`);

// 6. Test Teacher Deleting Question
console.log('[TEST 6] Testing Question Deletion & Auto-Resequence...');
const finalPaper = deletePaperQuestion({
  paper: hp12Phy,
  questionId: addRes.addedQuestion.id
});
assert.strictEqual(finalPaper.totalQuestions, 28);
assert.strictEqual(finalPaper.totalMarks, 60);
console.log(`[PASS] Question deleted and questions re-sequenced back to 28 questions, 60 marks.`);

console.log('ALL BOARD QUESTION PAPER GENERATOR TESTS PASSED 100%!');
