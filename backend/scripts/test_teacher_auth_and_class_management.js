/**
 * Automated Verification Script:
 * Teacher Dummy Sign-In, Subject Scoping, Class 11 & Student Roster Management
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
  console.log('TEACHER AUTHENTICATION, SUBJECT SCOPE & CLASS MANAGEMENT TESTS');
  console.log('================================================================\n');

  // 1. Verify Faculty Directory Listing
  console.log('Step 1: Fetching Departmental Faculty Directory...');
  const facultyRes = await makeRequest('/api/curriculum/faculty');
  assert(facultyRes.status === 200, 'GET /api/curriculum/faculty returns HTTP 200');
  assert(Array.isArray(facultyRes.data.faculty), 'Faculty array returned');
  assert(facultyRes.data.faculty.length >= 4, `Found ${facultyRes.data.faculty.length} faculty profiles`);
  
  const phyTeacher = facultyRes.data.faculty.find(f => f.subjectKey === 'PHYSICS');
  const bioTeacher = facultyRes.data.faculty.find(f => f.subjectKey === 'BIOLOGY');
  assert(phyTeacher && (phyTeacher.full_name === 'Dr. Vikram Sharma' || phyTeacher.name === 'Dr. Vikram Sharma'), 'Dr. Vikram Sharma configured as Physics Faculty');
  assert(bioTeacher && (bioTeacher.full_name === 'Dr. Ananya Mukherjee' || bioTeacher.name === 'Dr. Ananya Mukherjee'), 'Dr. Ananya Mukherjee configured as Biology Faculty');

  // 2. Teacher Dummy Login - Physics Faculty
  console.log('\nStep 2: Authenticating as Physics Faculty (Dr. Vikram Sharma)...');
  const phyLogin = await makeRequest('/api/curriculum/faculty/login', 'POST', { facultyId: 'fac_phy_01' });
  assert(phyLogin.status === 200, 'Physics login succeeds with HTTP 200');
  assert(phyLogin.data.faculty.subjectKey === 'PHYSICS', 'Authenticated user subjectKey is PHYSICS');
  assert(phyLogin.data.faculty.designation.includes('Physics'), 'Correct designation assigned');

  // 3. Subject Scoping for Physics Teacher
  console.log('\nStep 3: Verifying Subject Isolation for Physics Faculty...');
  const phyClasses = await makeRequest('/api/curriculum/classes?teacherSubjectKey=PHYSICS');
  assert(phyClasses.status === 200, 'GET /api/curriculum/classes?teacherSubjectKey=PHYSICS returns HTTP 200');
  assert(Array.isArray(phyClasses.data.classes), 'Classes array returned for Physics faculty');
  assert(phyClasses.data.classes.length > 0, `Physics faculty has ${phyClasses.data.classes.length} classes available`);

  // Assert every single class in the Physics view has ONLY Physics in subjects array
  for (const c of phyClasses.data.classes) {
    const isOnlyPhy = c.subjects.length === 1 && (c.subjects[0] === 'Physics' || c.subjects[0]?.name === 'Physics' || c.subjects[0]?.key === 'PHYSICS');
    assert(isOnlyPhy, 
      `Class ${c.id} (${c.name}) exposes ONLY Physics (Found: ${JSON.stringify(c.subjects)})`);
  }

  // 4. Subject Scoping for Biology Faculty
  console.log('\nStep 4: Verifying Subject Isolation for Biology Faculty...');
  const bioClasses = await makeRequest('/api/curriculum/classes?teacherSubjectKey=BIOLOGY');
  assert(bioClasses.status === 200, 'GET /api/curriculum/classes?teacherSubjectKey=BIOLOGY returns HTTP 200');
  
  // Non-Med classes (without biology) must NOT appear in Biology teacher scope
  const nonMedFoundInBio = bioClasses.data.classes.some(c => c.id === '11-NonMed' || c.id === '12-NonMed');
  assert(!nonMedFoundInBio, 'Non-Medical classes are strictly excluded from Biology faculty scope');

  // And all classes in Biology view must have ONLY Biology
  for (const c of bioClasses.data.classes) {
    const isOnlyBio = c.subjects.length === 1 && (c.subjects[0] === 'Biology' || c.subjects[0]?.name === 'Biology' || c.subjects[0]?.key === 'BIOLOGY');
    assert(isOnlyBio,
      `Class ${c.id} exposes ONLY Biology (Found: ${JSON.stringify(c.subjects)})`);
  }

  // 5. Creating a New Class (e.g. Class 11 Section C)
  console.log('\nStep 5: Testing Teacher Dynamic Class Section Creation...');
  const uniqueSec = `Sec-${Date.now().toString(36)}`;
  const newClassPayload = {
    id: `11-Sci-${uniqueSec}`,
    name: `Class 11 Science - Section ${uniqueSec}`,
    grade: 11,
    section: uniqueSec,
    stream: 'Science Composite',
    subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics']
  };

  const createClassRes = await makeRequest('/api/curriculum/classes', 'POST', newClassPayload);
  assert(createClassRes.status === 201, 'POST /api/curriculum/classes returns HTTP 201 Created');
  assert(createClassRes.data.class.id === newClassPayload.id, 'New class Section registered with correct ID');

  // Verify newly created class appears in Physics faculty query
  const updatedPhyClasses = await makeRequest('/api/curriculum/classes?teacherSubjectKey=PHYSICS');
  const foundNewClass = updatedPhyClasses.data.classes.find(c => c.id === newClassPayload.id);
  assert(foundNewClass !== undefined, 'Newly created Class 11 section appears in Physics teacher class list');
  const isFoundOnlyPhy = foundNewClass.subjects.length === 1 && (foundNewClass.subjects[0] === 'Physics' || foundNewClass.subjects[0]?.name === 'Physics' || foundNewClass.subjects[0]?.key === 'PHYSICS');
  assert(isFoundOnlyPhy, 
    'Newly created class respects Physics subject scoping');

  // 6. Adding / Enrolling Student to Database for Activity Tracking
  console.log('\nStep 6: Enrolling New Student into Class 11th Database...');
  const uniqueRoll = `11-SC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newStudentPayload = {
    classId: newClassPayload.id,
    rollNumber: uniqueRoll,
    fullName: 'Himanshu Thakur',
    email: 'himanshu.t@himacademy.ac.in',
    hostelResident: true,
    roomNumber: 'D-304'
  };

  const enrollRes = await makeRequest('/api/curriculum/students', 'POST', newStudentPayload);
  assert(enrollRes.status === 201, 'POST /api/curriculum/students returns HTTP 201 Created');
  assert(enrollRes.data.student.roll_number === uniqueRoll, 'Student roll number recorded');
  assert(String(enrollRes.data.student.grade) === '11', 'Student grade automatically assigned as 11');
  assert(enrollRes.data.student.hostel_resident === true, 'Hostel resident status recorded');
  assert(enrollRes.data.totalStudentsInClass >= 1, 'Class roster count updated in database');

  // 7. Verify Remedial Feedback Professionalism (No Emojis)
  console.log('\nStep 7: Verifying Remedial Feedback Quality & Emoji Absence...');
  const formulaCheck = await makeRequest('/api/assessments/remedial/verify-formula', 'POST', {
    subtopic: 'Simple Harmonic Motion',
    formulaInput: 'T = 2 * pi * sqrt(m / k)',
    subject: 'Physics'
  });
  assert(formulaCheck.status === 200, 'Formula verification endpoint succeeds');
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
  assert(!emojiRegex.test(formulaCheck.data.feedback || ''), 'No emojis in formula feedback response');
  assert(!emojiRegex.test(formulaCheck.data.message || ''), 'No emojis in formula message response');

  // 8. Mobile Number + Name + Subject Expert Authentication
  console.log('\nStep 8: Authenticating Biology Faculty with Mobile Number, Name & Subject Expertise...');
  const bioPhoneLogin = await makeRequest('/api/curriculum/auth/teacher-login', 'POST', {
    phone: '9816010003',
    name: 'Dr. Ananya Mukherjee',
    subjectKey: 'BIOLOGY'
  });
  assert(bioPhoneLogin.status === 200, 'POST /api/curriculum/auth/teacher-login succeeds with HTTP 200');
  assert(bioPhoneLogin.data.teacher.phone === '9816010003', 'Teacher mobile number stored & returned');
  assert(bioPhoneLogin.data.teacher.subjectKey === 'BIOLOGY', 'Teacher subject is strictly BIOLOGY');
  assert(bioPhoneLogin.data.teacher.targetStream === 'NEET', 'Default target stream is NEET');
  assert(bioPhoneLogin.data.teacher.defaultClass === '12-Med', 'Default class is 12-Med (seed data: fac_bio_01)');

  // Verify Phone Number Lookup
  console.log('\nStep 8b: Testing Phone Number Lookup Endpoint...');
  const phoneLookup = await makeRequest('/api/curriculum/faculty/lookup?phone=9816010003');
  assert(phoneLookup.status === 200, 'GET /api/curriculum/faculty/lookup returns HTTP 200');
  assert(phoneLookup.data.exists === true, 'Registered faculty recognized by phone');
  assert(phoneLookup.data.teacher.subjectKey === 'BIOLOGY', 'Recognized faculty subject is BIOLOGY');

  // 9. Dynamic New Teacher Registration via Mobile Number
  console.log('\nStep 9: Registering New Faculty via Mobile Number...');
  const newPhone = `98160${Math.floor(10000 + Math.random() * 90000)}`;
  const newTeacherLogin = await makeRequest('/api/curriculum/auth/teacher-login', 'POST', {
    phone: newPhone,
    name: 'Dr. Ritu Dogra',
    subjectKey: 'BIOLOGY'
  });
  assert(newTeacherLogin.status === 200, 'New teacher registration succeeds with HTTP 200');
  assert(newTeacherLogin.data.teacher.name === 'Dr. Ritu Dogra', 'New teacher full name recorded');
  assert(newTeacherLogin.data.teacher.phone === newPhone, 'New teacher phone recorded');
  assert(newTeacherLogin.data.teacher.subjectKey === 'BIOLOGY', 'New teacher scoped to BIOLOGY');

  // 10. Biology Syllabus, Questions & PYQs Isolation
  console.log('\nStep 10: Verifying Biology Syllabus, Questions & PYQs Scoping...');
  const bioTaxonomy = await makeRequest('/api/curriculum/taxonomy/BIOLOGY?grade=11');
  assert(bioTaxonomy.status === 200, 'GET /api/curriculum/taxonomy/BIOLOGY?grade=11 returns HTTP 200');
  assert(Array.isArray(bioTaxonomy.data.chapters), 'Chapters array returned for Biology');
  assert(bioTaxonomy.data.chapters.length > 0, `Found ${bioTaxonomy.data.chapters.length} Biology chapters`);
  // Verify chapters belong to Biology
  const firstBioChap = bioTaxonomy.data.chapters[0];
  assert(firstBioChap.chapterName && !firstBioChap.chapterName.includes('Coulomb') && !firstBioChap.chapterName.includes('Gravitation'),
    `Chapter "${firstBioChap.chapterName}" is authentic Biology chapter`);

  // Verify Biology Questions and PYQs
  const bioQuestions = await makeRequest('/api/curriculum/questions?subject=Biology&teacherSubjectKey=BIOLOGY');
  assert(bioQuestions.status === 200, 'GET /api/curriculum/questions for Biology returns HTTP 200');
  assert(bioQuestions.data.count > 0, `Returned ${bioQuestions.data.count} authentic Biology questions`);
  for (const q of bioQuestions.data.questions.slice(0, 10)) {
    const isBio = (q.subject && q.subject.toLowerCase().includes('bio')) || (q.branch && (q.branch === 'BOTANY' || q.branch === 'ZOOLOGY'));
    assert(isBio, `Question "${q.id}" belongs strictly to Biology discipline (Found: ${q.subject || q.branch})`);
  }

  // 11. Medical-Only Student Roster Verification for Biology Teacher
  console.log('\nStep 11: Verifying Medical Students Scoping for Biology Teacher...');
  const bioStudents = await makeRequest('/api/curriculum/students?subjectKey=BIOLOGY');
  assert(bioStudents.status === 200, 'GET /api/curriculum/students?subjectKey=BIOLOGY returns HTTP 200');
  assert(bioStudents.data.count > 0, `Found ${bioStudents.data.count} medical students`);
  for (const stu of bioStudents.data.students) {
    // Composite classes created by step 5 (this run or earlier runs against the same server) include
    // Biology, so their students rightly appear here too.
    if (/^11-Sci-Sec-/.test(stu.section)) continue;
    const isMed = stu.section.includes('Med') && !stu.section.includes('NonMed');
    assert(isMed, `Student ${stu.full_name} (${stu.roll_number}) is in Medical class ${stu.section}`);
  }

  // 12. Biology-Scoped Class Progress Dashboard Analytics
  console.log('\nStep 12: Verifying Biology Class Progress Dashboard Analytics...');
  const bioAnalytics = await makeRequest('/api/analytics/class-dashboard?subjectKey=BIOLOGY');
  assert(bioAnalytics.status === 200, 'GET /api/analytics/class-dashboard?subjectKey=BIOLOGY returns HTTP 200');
  assert(bioAnalytics.data.assessment && (bioAnalytics.data.assessment.subject === 'Biology' || bioAnalytics.data.assessment.title.includes('Biology')),
    `Active assessment "${bioAnalytics.data.assessment.title}" is strictly Biology`);
  assert(Array.isArray(bioAnalytics.data.studentRoster), 'Student performance roster returned');
  for (const r of bioAnalytics.data.studentRoster) {
    assert(r.rollNumber.startsWith('11-M') || r.rollNumber.startsWith('12-M'),
      `Roster student ${r.studentName} (${r.rollNumber}) is Medical student`);
  }
  for (const a of bioAnalytics.data.availableAssessments) {
    const aSub = (a.subject || a.title || '').toLowerCase();
    assert(aSub.includes('bio') || a.subjectKey === 'BIOLOGY', `Available assessment "${a.title}" is Biology assessment`);
  }

  console.log('\n================================================================');
  console.log('ALL TEACHER AUTH & CLASS MANAGEMENT VERIFICATIONS PASSED (12/12)');
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
