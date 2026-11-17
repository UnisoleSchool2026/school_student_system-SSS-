#!/usr/bin/env node
// ==============================================================================
// VERIFICATION SCRIPT: QUIZ CREATION, MODAL DISPLAY & PROFILE CHIP INTEGRITY
// ==============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('====================================================================');
console.log('TEST SUITE: QUIZ CREATION, MODAL DISPLAY & PROFILE DISPLAY VERIFICATION');
console.log('====================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Read frontend/index.html
const indexPath = path.join(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 2. Read frontend/js/app.js
const appJsPath = path.join(__dirname, '../js/app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

console.log('--- Step 1: Validating Modal Hierarchy in index.html ---');
assert(indexHtml.includes('id="modalGenerateCurriculumTest"'), 'index.html contains modalGenerateCurriculumTest');
assert(indexHtml.includes('id="modalQuizCreatedSuccess"'), 'index.html contains modalQuizCreatedSuccess');
assert(!indexHtml.includes('<div class="teacher-tab-content active" id="tabGenerator">\n        <div class="modal-overlay" id="modalGenerateCurriculumTest"'), 'modalGenerateCurriculumTest is not nested inside tabGenerator');
assert(indexHtml.includes('id="stripFacultyName"'), 'index.html contains stripFacultyName in streamCompactStrip');
assert(indexHtml.includes('id="stripFacultyDept"'), 'index.html contains stripFacultyDept in streamCompactStrip');
assert(indexHtml.includes('id="btnSuccessAttemptQuiz"'), 'modalQuizCreatedSuccess contains btnSuccessAttemptQuiz');
assert(indexHtml.includes('id="btnSuccessViewAnalytics"'), 'modalQuizCreatedSuccess contains btnSuccessViewAnalytics');

console.log('\n--- Step 2: Validating Safe Handlers & Functions in app.js ---');
assert(appJs.includes('openGenTestForChapterByNum('), 'app.js implements openGenTestForChapterByNum');
assert(appJs.includes('openGenTestForTopicByIndex('), 'app.js implements openGenTestForTopicByIndex');
assert(appJs.includes('openGenTestForSubtopicByIndex('), 'app.js implements openGenTestForSubtopicByIndex');
assert(appJs.includes('openCurriculumTestModal()'), 'app.js implements openCurriculumTestModal');
assert(appJs.includes('closeCurriculumTestModal()'), 'app.js implements closeCurriculumTestModal');
assert(appJs.includes('openQuizCreatedSuccessModal('), 'app.js implements openQuizCreatedSuccessModal');
assert(appJs.includes('closeQuizCreatedSuccessModal()'), 'app.js implements closeQuizCreatedSuccessModal');

console.log('\n--- Step 3: Validating Elimination of Blocking Browser Confirm ---');
assert(!appJs.includes('confirm(\n        `${modeLabel} Successfully Created & Assigned'), 'Blocking browser confirm popup has been replaced');
assert(appJs.includes('openQuizCreatedSuccessModal(data.assessment)'), 'submitGenerateCurriculumTest launches openQuizCreatedSuccessModal');

console.log('\n--- Step 4: Validating Student Portal Switching ---');
assert(appJs.includes("switchPortalRole('student')"), "attemptActiveTestInStudentPortal directly calls switchPortalRole('student')");
assert(!appJs.includes("const btnRoleStudent = document.getElementById('btnRoleStudent');\n  if (btnRoleStudent) btnRoleStudent.click();"), 'Non-existent btnRoleStudent query eliminated');

console.log('\n--- Step 5: Validating Educator Profile Workspace Strip Sync ---');
assert(appJs.includes("const stripFacultyName = document.getElementById('stripFacultyName');"), 'applyTeacherProfile queries stripFacultyName');
assert(appJs.includes("const stripFacultyDept = document.getElementById('stripFacultyDept');"), 'applyTeacherProfile queries stripFacultyDept');

console.log('\n--- Step 6: Validating Dynamic Exam Subject Switcher ---');
assert(appJs.includes("const examSwitcher = document.getElementById('examSubjectSwitcher');"), 'startAssignedTest updates examSubjectSwitcher');

console.log('\n--- Step 7: Validating Window Global Exports ---');
assert(appJs.includes('window.openGenTestForChapterByNum = openGenTestForChapterByNum;'), 'openGenTestForChapterByNum exposed to window');
assert(appJs.includes('window.openGenTestForTopicByIndex = openGenTestForTopicByIndex;'), 'openGenTestForTopicByIndex exposed to window');
assert(appJs.includes('window.openGenTestForSubtopicByIndex = openGenTestForSubtopicByIndex;'), 'openGenTestForSubtopicByIndex exposed to window');
assert(appJs.includes('window.openCurriculumTestModal = openCurriculumTestModal;'), 'openCurriculumTestModal exposed to window');
assert(appJs.includes('window.openQuizCreatedSuccessModal = openQuizCreatedSuccessModal;'), 'openQuizCreatedSuccessModal exposed to window');
assert(appJs.includes('window.closeQuizCreatedSuccessModal = closeQuizCreatedSuccessModal;'), 'closeQuizCreatedSuccessModal exposed to window');

console.log('\n--- Step 8: Validating Live Backend API Test Generation ---');
const postData = JSON.stringify({
  classKey: '11-Med',
  grade: '11',
  section: '11-Med',
  subjectKey: 'BIOLOGY',
  subjectName: 'Biology',
  chapterNumber: 1,
  chapterName: 'The Living World',
  subtopics: ['Taxonomic Categories: Species, Genus, Family, Order, Class, Phylum, Kingdom'],
  mode: 'QUIZ',
  questionCount: 3,
  difficulty: 'MEDIUM',
  title: 'Biology Verification Quiz: Taxonomic Hierarchy',
  autoAttempt: false
});

const targetBackend = process.env.BACKEND_URL ? new URL(process.env.BACKEND_URL) : null;
const httpModule = targetBackend && targetBackend.protocol === 'https:' ? require('https') : http;
const reqOptions = {
  hostname: targetBackend ? targetBackend.hostname : 'localhost',
  port: targetBackend ? (targetBackend.port || (targetBackend.protocol === 'https:' ? 443 : 80)) : 5050,
  path: targetBackend ? `${targetBackend.pathname.replace(/\/$/, '')}/api/curriculum/generate-test` : '/api/curriculum/generate-test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = httpModule.request(reqOptions, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    assert(res.statusCode === 200 || res.statusCode === 201, `API returns HTTP 200/201 (Got ${res.statusCode})`);
    try {
      const data = JSON.parse(body);
      assert(data.success === true, 'API response has success: true');
      assert(data.assessment && data.assessment.questions && data.assessment.questions.length >= 3, `API returned ${data.assessment?.questions?.length} questions`);
      assert(data.assessment.subject === 'Biology', `API generated assessment for subject Biology (Got ${data.assessment?.subject})`);
      assert(data.assignedStudentsCount >= 4, `Assessment assigned to ${data.assignedStudentsCount} class students`);
    } catch (e) {
      assert(false, `Failed to parse API response JSON: ${e.message}`);
    }

    console.log('\n====================================================================');
    console.log(`TOTAL RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
    console.log('====================================================================');
    process.exit(failCount === 0 ? 0 : 1);
  });
});

req.on('error', (err) => {
  assert(false, `HTTP request failed: ${err.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
