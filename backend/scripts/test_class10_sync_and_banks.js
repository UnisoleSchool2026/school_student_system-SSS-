/**
 * Automated Verification Script:
 * Class 10 Teacher Authentication, Both-Side Synchronization,
 * Syllabus Isolation & 438-Question Bank Verification
 */

const http = require('http');

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('CLASS 10 TEACHER AUTHENTICATION, SYLLABUS & QUESTION BANK TESTS');
  console.log('================================================================\n');

  // 1. Mobile Lookup: Class 10th Mathematics Faculty
  console.log('Step 1: Faculty Phone Lookup for Mrs. Meenakshi Sharma (9816010010)...');
  const lookupMath = await makeRequest('/api/curriculum/faculty/lookup?phone=9816010010');
  assert(lookupMath.status === 200, 'GET /api/curriculum/faculty/lookup returns HTTP 200');
  assert(lookupMath.data.exists === true, 'Faculty recognized by mobile number');
  assert(lookupMath.data.teacher.full_name === 'Mrs. Meenakshi Sharma', 'Full name is Mrs. Meenakshi Sharma');
  assert(lookupMath.data.teacher.subjectKey === 'CLASS10_MATHEMATICS', 'Subject key is CLASS10_MATHEMATICS');
  assert(lookupMath.data.teacher.defaultClass === '10-Science-A', 'Default class is 10-Science-A');
  assert(lookupMath.data.teacher.grade === '10', 'Grade is 10');

  // 2. Mobile Lookup: Class 10th Science Faculty
  console.log('\nStep 2: Faculty Phone Lookup for Er. Rakesh Thakur (9816010011)...');
  const lookupSci = await makeRequest('/api/curriculum/faculty/lookup?phone=9816010011');
  assert(lookupSci.status === 200, 'GET /api/curriculum/faculty/lookup returns HTTP 200');
  assert(lookupSci.data.exists === true, 'Science faculty recognized by mobile number');
  assert(lookupSci.data.teacher.full_name === 'Er. Rakesh Thakur', 'Full name is Er. Rakesh Thakur');
  assert(lookupSci.data.teacher.subjectKey === 'CLASS10_SCIENCE', 'Subject key is CLASS10_SCIENCE');
  assert(lookupSci.data.teacher.defaultClass === '10-Science-A', 'Default class is 10-Science-A');
  assert(lookupSci.data.teacher.grade === '10', 'Grade is 10');

  // 3. Teacher Login: Class 10th Mathematics
  console.log('\nStep 3: Authenticating as Class 10th Mathematics Faculty...');
  const loginMath = await makeRequest('/api/curriculum/auth/teacher-login', 'POST', {
    phone: '9816010010',
    name: 'Mrs. Meenakshi Sharma',
    subjectKey: 'CLASS10_MATHEMATICS'
  });
  assert(loginMath.status === 200, 'Class 10 Math login returns HTTP 200');
  assert(loginMath.data.teacher.subjectKey === 'CLASS10_MATHEMATICS', 'Authenticated subject is CLASS10_MATHEMATICS');
  assert(loginMath.data.teacher.defaultClass === '10-Science-A', 'Teacher default class is 10-Science-A');
  assert(loginMath.data.teacher.targetStream === 'CBSE_CLASS_10', 'Target stream is CBSE_CLASS_10');

  // 4. Scoped Classes for Class 10th Math Teacher
  console.log('\nStep 4: Verifying Scoped Classes for CLASS10_MATHEMATICS...');
  const classesRes = await makeRequest('/api/curriculum/classes?teacherSubjectKey=CLASS10_MATHEMATICS');
  assert(classesRes.status === 200, 'GET /api/curriculum/classes returns HTTP 200');
  assert(Array.isArray(classesRes.data.classes), 'Classes array returned');
  // The Class 10 maths teacher teaches 10-Science-A (4 students) and the seeded 10-Maths-A section.
  const c10Ids = classesRes.data.classes.map(c => c.id).sort();
  assert(JSON.stringify(c10Ids) === JSON.stringify(['10-Maths-A', '10-Science-A']), `Class 10 Math teacher sees 10-Science-A and 10-Maths-A (found ${c10Ids.join(', ')})`);
  assert(classesRes.data.classes.every(c => c.grade === '10' && c.subjects.length === 1 && c.subjects[0].key === 'CLASS10_MATHEMATICS'), 'Every class is grade 10 and scoped to CLASS10_MATHEMATICS');

  const c10Class = classesRes.data.classes.find(c => c.id === '10-Science-A');
  assert(c10Class.id === '10-Science-A', 'Class ID is 10-Science-A');
  assert(c10Class.grade === '10', 'Class grade is 10');
  assert(c10Class.subjects.length === 1 && c10Class.subjects[0].key === 'CLASS10_MATHEMATICS', 'Subjects scoped strictly to CLASS10_MATHEMATICS');
  assert(c10Class.students.length === 4, 'Enrolled students roster contains 4 students');
  const studentNames = c10Class.students.map(s => s.full_name);
  assert(studentNames.includes('Rohit Verma') && studentNames.includes('Tanvi Sood'), 'Class 10 students roster correctly attached');

  // 5. Scoped Students Endpoint for Class 10
  console.log('\nStep 5: Verifying Enrolled Students for CLASS10_MATHEMATICS...');
  const studentsRes = await makeRequest('/api/curriculum/students?teacherSubjectKey=CLASS10_MATHEMATICS');
  assert(studentsRes.status === 200, 'GET /api/curriculum/students returns HTTP 200');
  assert(studentsRes.data.students.length === 4, 'Returns 4 enrolled Class 10 students');
  for (const s of studentsRes.data.students) {
    assert(s.grade === '10', `Student ${s.full_name} is Grade 10`);
  }

  // 6. Complete 14-Chapter Syllabus for Class 10 Mathematics
  console.log('\nStep 6: Verifying Class 10 Mathematics Syllabus Taxonomy...');
  const taxRes = await makeRequest('/api/curriculum/taxonomy/CLASS10_MATHEMATICS?grade=10');
  assert(taxRes.status === 200, 'GET /api/curriculum/taxonomy/CLASS10_MATHEMATICS returns HTTP 200');
  assert(taxRes.data.totalChapters === 14, `Expected 14 chapters, found ${taxRes.data.totalChapters}`);
  
  // Verify chapter names match NCERT Class 10 syllabus
  const expectedChapters = [
    'Real Numbers',
    'Polynomials',
    'Pair of Linear Equations in Two Variables',
    'Quadratic Equations',
    'Arithmetic Progressions',
    'Triangles',
    'Coordinate Geometry',
    'Introduction to Trigonometry',
    'Some Applications of Trigonometry',
    'Circles',
    'Areas Related to Circles',
    'Surface Areas and Volumes',
    'Statistics',
    'Probability'
  ];

  taxRes.data.chapters.forEach((ch, idx) => {
    assert(ch.chapterNumber === idx + 1, `Chapter ${idx + 1} has correct chapter number`);
    assert(ch.chapterName === expectedChapters[idx], `Chapter ${idx + 1} title matches: ${ch.chapterName}`);
    assert(ch.topics.length > 0, `Chapter ${ch.chapterName} has topics`);
    assert(ch.totalQuestionsInChapter > 0, `Chapter ${ch.chapterName} has linked questions (found ${ch.totalQuestionsInChapter})`);
  });

  // 7. Class 10 Math 438-Question Bank Endpoint
  console.log('\nStep 7: Verifying Class 10 Math Question Bank API...');
  const qbRes = await makeRequest('/api/questions/class10-math-bank?limit=500');
  assert(qbRes.status === 200, 'GET /api/questions/class10-math-bank returns HTTP 200');
  assert(qbRes.data.totalBankQuestions === 438, `Expected 438 questions in bank, got ${qbRes.data.totalBankQuestions}`);
  assert(qbRes.data.questions.length === 438, `Expected 438 returned questions, got ${qbRes.data.questions.length}`);

  // Check chapter filtering
  const ch1Res = await makeRequest('/api/questions/class10-math-bank?chapter=1');
  assert(ch1Res.status === 200, 'Chapter 1 filter returns HTTP 200');
  assert(ch1Res.data.filteredCount >= 25, `Chapter 1 has ${ch1Res.data.filteredCount} questions`);

  // Check source filtering (Board PYQ)
  const pyqRes = await makeRequest('/api/questions/class10-math-bank?source=PYQ');
  assert(pyqRes.status === 200, 'PYQ source filter returns HTTP 200');
  assert(pyqRes.data.filteredCount >= 100, `Found ${pyqRes.data.filteredCount} Board PYQ questions`);

  // 8. Test Generation for Class 10 Mathematics
  console.log('\nStep 8: Generating a Class 10 Mathematics Test...');
  const genRes = await makeRequest('/api/curriculum/generate-test', 'POST', {
    classKey: '10-Science-A',
    grade: '10',
    section: '10-Science-A',
    subjectKey: 'CLASS10_MATHEMATICS',
    subjectName: 'Mathematics',
    chapterNumber: 1,
    chapterName: 'Real Numbers',
    mode: 'QUIZ',
    questionCount: 5,
    difficulty: 'MEDIUM',
    title: 'Class 10 Real Numbers Diagnostic Quiz'
  });
  assert(genRes.status === 200 || genRes.status === 201, 'POST /api/curriculum/generate-test returns HTTP 200/201');
  assert(genRes.data.success === true, 'Test generation succeeds');
  assert(genRes.data.assessment && genRes.data.assessment.questions.length === 5, 'Generated test has 5 questions');
  assert(genRes.data.assessment.grade === '10', 'Assessment grade is 10');
  assert(genRes.data.assessment.subjectKey === 'CLASS10_MATHEMATICS', 'Assessment subjectKey is CLASS10_MATHEMATICS');

  console.log('\n================================================================');
  console.log('ALL CLASS 10 SYNCHRONIZATION AND QUESTION BANK TESTS PASSED 100%');
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
