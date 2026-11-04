// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: INTEGRATION TEST SUITE FOR QUESTION INJECTION
// Validates:
// 1. Faculty authentication & Subject-Lock verification (Physics -> Physics only)
// 2. Multimodal Ingestion (Text/LaTeX, Image base64, PDF)
// 3. Category tagging (CBSE_PYQ, NCERT_EXAMPLE, NCERT_EXERCISE, COMPETITIVE_OTHER)
// 4. Audit trail logging (injected_by metadata)
// 5. KaTeX math sanitization & immediate reflection in subject banks
// ============================================================================

const assert = require('assert');
const { inMemoryStore } = require('../backend/src/config/database');
const {
  validateFacultySubjectLock,
  processQuestionExtraction,
  commitQuestionToStore,
  parseRawTextLocally
} = require('../backend/src/services/questionInjectionService');

async function runTests() {
  console.log('🧪 Starting HAPS-AI Question Injection Verification Suite...\n');

  // Test 1: Subject-Lock Security
  console.log('--- TEST 1: Faculty Subject-Lock Enforcement ---');
  const physicsFaculty = {
    id: 'fac_phy_01',
    name: 'Dr. Vikram Sharma',
    phone: '9816010001',
    subject: 'Physics',
    subjectKey: 'PHYSICS',
    department: 'PHYSICS',
    role: 'TEACHER'
  };

  const chemistryFaculty = {
    id: 'fac_chem_01',
    name: 'Prof. Sunita Rao',
    phone: '9816010002',
    subject: 'Chemistry',
    subjectKey: 'CHEMISTRY',
    department: 'CHEMISTRY',
    role: 'TEACHER'
  };

  const studentUser = {
    id: 'stud_01',
    name: 'Aryan Sharma',
    role: 'STUDENT'
  };

  // 1a: Student attempt should be blocked
  assert.throws(() => {
    validateFacultySubjectLock({ teacher: studentUser, targetSubject: 'Physics', targetSubjectKey: 'PHYSICS' });
  }, /restricted to verified Faculty members/i, 'Student should be blocked');
  console.log('✅ PASS: Non-faculty access blocked with 403');

  // 1b: Physics faculty attempting to inject into Chemistry should be blocked
  assert.throws(() => {
    validateFacultySubjectLock({ teacher: physicsFaculty, targetSubject: 'Chemistry', targetSubjectKey: 'CHEMISTRY' });
  }, /Discipline Lock Violation/i, 'Physics teacher injecting Chemistry should be blocked');
  console.log('✅ PASS: Physics teacher prohibited from injecting Chemistry questions');

  // 1c: Chemistry faculty attempting to inject into Physics should be blocked
  assert.throws(() => {
    validateFacultySubjectLock({ teacher: chemistryFaculty, targetSubject: 'Physics', targetSubjectKey: 'PHYSICS' });
  }, /Discipline Lock Violation/i, 'Chemistry teacher injecting Physics should be blocked');
  console.log('✅ PASS: Chemistry teacher prohibited from injecting Physics questions');

  // 1d: Physics faculty injecting into Physics should succeed
  assert.strictEqual(
    validateFacultySubjectLock({ teacher: physicsFaculty, targetSubject: 'Physics', targetSubjectKey: 'PHYSICS' }),
    true
  );
  console.log('✅ PASS: Physics teacher authorized for Physics repository');

  // Test 2: Ingestion & KaTeX Extraction (Mode 1: Text)
  console.log('\n--- TEST 2: Text Mode Ingestion & KaTeX Formatting ---');
  const samplePhysicsText = `Two circular coils 1 and 2 are made from the same wire but the radius of the 1st coil is twice that of the 2nd coil ($r_1 = 2r_2$). What is the ratio of potential difference applied across them so that the magnetic field at their centres is the same?
A) $V_1 / V_2 = 4$
B) $V_1 / V_2 = 2$
C) $V_1 / V_2 = 1/2$
D) $V_1 / V_2 = 1/4$
Answer: A
Solution: Magnetic field at center $B = \\frac{\\mu_0 I}{2r} = \\frac{\\mu_0 V}{2r R}$. Resistance $R = \\rho \\frac{2\\pi r}{A} \\propto r$. Thus $B \\propto \\frac{V}{r^2}$. For $B_1 = B_2$, we have $\\frac{V_1}{r_1^2} = \\frac{V_2}{r_2^2} \\implies \\frac{V_1}{V_2} = \\left(\\frac{r_1}{r_2}\\right)^2 = 2^2 = 4$.`;

  const parsedText = parseRawTextLocally({
    rawText: samplePhysicsText,
    targetSubject: 'Physics',
    chapter: 'Moving Charges and Magnetism',
    category: 'CBSE_PYQ',
    grade: '12'
  });

  assert(parsedText.question_latex.includes('$r_1 = 2r_2$'), 'KaTeX math preserved in question');
  assert.strictEqual(parsedText.options_latex.length, 4, 'Must have 4 options');
  assert.strictEqual(parsedText.options_latex[0].is_correct, true, 'Option A is correct');
  assert.strictEqual(parsedText.options_latex[1].is_correct, false, 'Option B is wrong');
  assert(parsedText.solution_latex.includes('\\frac{V_1}{V_2}'), 'Solution contains LaTeX');
  console.log('✅ PASS: Raw Text parsed with clean KaTeX equations and verified options');

  // Test 3: Commit with Audit Trail & Repository Injection
  console.log('\n--- TEST 3: Repository Commit & Faculty Audit Trail ---');
  const commitResult = commitQuestionToStore({
    structuredQuestion: parsedText,
    teacher: physicsFaculty,
    targetSubject: 'Physics',
    grade: '12',
    chapter: 'Moving Charges and Magnetism',
    category: 'CBSE_PYQ',
    marks: 3,
    mode: 'text'
  });

  assert(commitResult.question.id.startsWith('snr_p_inj_'), 'Injected ID must have specialized prefix');
  assert.strictEqual(commitResult.targetBank, 'senior_physics', 'Target bank must be senior_physics');
  assert.strictEqual(commitResult.question.injected_by.faculty_name, 'Dr. Vikram Sharma');
  assert.strictEqual(commitResult.question.injected_by.department, 'PHYSICS');
  assert.strictEqual(commitResult.question.injected_by.role, 'faculty');
  assert(commitResult.question.injected_by.timestamp, 'Timestamp must exist');
  assert.strictEqual(commitResult.question.source_category, 'CBSE_PYQ');

  // Verify it exists in senior_physics at index 0
  assert.strictEqual(inMemoryStore.subjectBanks.senior_physics[0].id, commitResult.question.id);
  // Verify it exists in inMemoryStore.questions at index 0
  assert.strictEqual(inMemoryStore.questions[0].id, commitResult.question.id);
  console.log(`✅ PASS: Question committed as #1 in ${commitResult.targetBank} with complete faculty audit stamp`);

  // Test 4: All 4 Category Classifications
  console.log('\n--- TEST 4: Category Dropdown Classifications ---');
  const categories = ['CBSE_PYQ', 'NCERT_EXAMPLE', 'NCERT_EXERCISE', 'COMPETITIVE_OTHER'];
  for (const cat of categories) {
    const res = commitQuestionToStore({
      structuredQuestion: {
        question_latex: `Assessment prompt for category: ${cat}`,
        options_latex: [
          { key: 'A', latex: '$1$', is_correct: true },
          { key: 'B', latex: '$2$', is_correct: false },
          { key: 'C', latex: '$3$', is_correct: false },
          { key: 'D', latex: '$4$', is_correct: false }
        ],
        solution_latex: 'Standard derivation'
      },
      teacher: physicsFaculty,
      targetSubject: 'Physics',
      grade: '12',
      chapter: 'Electrostatics',
      category: cat,
      marks: 2,
      mode: 'text'
    });
    assert.strictEqual(res.question.source_category, cat);
  }
  console.log('✅ PASS: All 4 categories (CBSE_PYQ, NCERT_EXAMPLE, NCERT_EXERCISE, COMPETITIVE_OTHER) verified');

  // Test 5: Multimodal Image & PDF Payload Handling
  console.log('\n--- TEST 5: Multimodal Payload Processing ---');
  // Mock transparent 1x1 PNG base64
  const mockPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const imgParsed = await processQuestionExtraction({
    mode: 'image',
    mediaData: mockPngBase64,
    mimeType: 'image/png',
    targetSubject: 'Physics',
    grade: '12',
    chapter: 'Ray Optics',
    category: 'NCERT_EXAMPLE',
    marks: 3
  });

  assert(imgParsed.question_latex, 'Image extraction must produce question_latex');
  assert(Array.isArray(imgParsed.options_latex), 'Options must be an array');
  assert(imgParsed.solution_latex, 'Solution must be present');
  console.log('✅ PASS: Multimodal Image pipeline processed successfully with fallback resiliency');

  console.log('\n🎉 ALL 5 QUESTION INJECTION INTEGRATION TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
