# Project Change Log (`log.md`)

All structural, architectural, configuration, and code changes made in this workspace are recorded below in chronological order.

---

## [2026-11-17 20:45] Study Board: Opens Instantly, Doubts Answer the Student's Own Question

### Problems reported
- The board took too long to open a topic.
- Asking a doubt gave back the same old content instead of answering the doubt.

### Causes and fixes
- **Slow lessons**: the board waited for the whole detailed explanation before showing anything, the AI "thought" before answering (slow), preview models could be picked first, and each model got its own 45-60 s wait (up to 6 models). Now: the board opens at once with the syllabus lesson and the detailed explanation (diagrams, examples) is slipped in when ready (usually a few seconds), keeping the student on the part they are reading; thinking is turned off (`thinkingBudget: 0`, or `thinkingLevel: low` on Gemini 3, retried without it if a model refuses); stable models before previews; at most 4 models and one total time limit (lesson 45 s, doubt 30 s). Files: `backend/src/services/geminiClient.js`, `backend/src/services/studyBoardService.js`, `frontend/js/studyBoard.js` (`pollDetailed`).
- **Doubts repeating old content**: the board added the lesson name to the doubt text, so when the answer service was slow the fallback search always matched the same lesson question. The lesson is now sent separately (`context`), the AI is told to answer exactly the student's question, the fallback search uses only the student's words, and if the answer service is busy the board says so clearly. Solve-my-doubt now also uses the chosen language.
- **Voice teacher**: a doubt asked while the teacher is talking now cuts off the rest of that old answer instead of letting it play on (`js/liveTutor.js`, `say(text, true)`), the teacher is told to answer exactly the doubt and never repeat the lesson instead, and after a doubt it continues the part without repeating it (`backend/src/services/tutorService.js`).
- Cache versions: `studyBoard.js?v=2.1`, `liveTutor.js?v=1.1`.

### How to revert
- Previous copies are in `_revert_backups/2026-11-17_board-speed-doubts/` (same folder layout); copy them back.

---

## [2026-11-17 21:30] Voice Teacher on the Study Board (AI Tutor merged in), Detailed Board Diagrams, In-Depth Lessons, Photo Question Import Fixed

### Teammate's photo import ("as I upload the image it does not work quite well")
- Causes found: the AI model list started with a weak "lite" model and used model names that were never checked; the prompt was written for typed text, so options were invented for photos; only one photo could be sent; diagrams in the paper were lost; the PDF size label showed a literal `&bull;`.
- New `backend/src/services/geminiClient.js`: one Gemini client for the whole backend. It asks Google which models exist (ListModels), uses the best one, skips any that answer 404, and can be pinned with `GEMINI_VISION_MODEL` / `GEMINI_TEXT_MODEL`.
- `questionInjectionService.js`: photos are read with photo-specific rules (read every page in order, never invent options, mark unreadable words `[unclear]`, give the box of any figure). Up to 6 photos at once (`mediaList` in `questionIngestionValidator.js`, `routes/questions.js`).
- Figures: the figure box is cropped in the browser and saved with the question (new `questionFigureService.js`, `POST /api/questions/figures`, `GET /api/questions/figures/:id`, files in `data/question_figures/`). The question text keeps a `[[figure:fig_...]]` token that `renderLatexString` shows as the picture everywhere.
- Frontend (`js/app.js`, `index.html`): choose or paste (Ctrl+V) up to 6 photos, thumbnails with remove, figure and `[unclear]` notes on the preview cards.

### AI Tutor merged into the Study Board (one board)
- The separate "AI Voice Smartboard" tab is removed from the menu and the phone tab bar; the Study Board is now the tutor. The old board's page still exists but its iframes load only if opened (`data-src`), so it no longer loads on every page view.
- **Explain with voice** (new `js/liveTutor.js`, backend `src/services/tutorService.js`, `src/routes/tutor.js`, `POST /api/tutor/live-session`): a Gemini Live native-audio teacher with a natural human voice (female "Kore" / male "Charon", changeable with `GEMINI_LIVE_VOICE_FEMALE/MALE`). It explains each board part in depth while the lines are written on the board, then moves to the next part on its own. Language: Hinglish (default), English or Hindi, chosen on the board; the choice is remembered on that device.
- **Interrupt any time**: press Speak and just talk; the teacher stops at once and answers (speaking over the teacher works; background noise only lowers the voice). Or type a doubt in the bar under the board. The answer appears in a doubt box on the board; the teacher can draw a new diagram and write steps on the board while answering, then says "shall we continue?" and goes on from the same part. "Continue the lesson" and "Ask my teacher" buttons on every doubt.
- One-tap requests while the voice is on: "Explain it more simply", "Give a real-life example", "Repeat slowly", "Quiz me on this".
- The browser never sees the API key: the backend creates a short-lived single-use token (`@google/genai` authTokens). Without a key the board says so and reads the lesson aloud with the school's neural voices instead (`/api/voice-tutor/audio`); typed doubts still work.
- Teachers get the same voice in class (Present mode), speaking to the whole class.

### Detailed diagrams that are easy to understand
- New `frontend/js/boardDiagrams.js`: draws 18 kinds of board diagrams as clean SVG, stage by stage in step with the lesson (charges and true field lines, capacitor, circuits, lens and mirror ray diagrams with correct physics, refraction / TIR, vectors, free-body forces, waves incl. EM waves, projectile, graphs from formulas, energy profile, atom, flow chart, labelled diagram, compare, concept map, geometry). Formulas are read by its own safe parser (no `eval`); all text is escaped.
- New `backend/src/services/diagramLibrary.js`: picks the right diagram for each syllabus topic (with a concept map when none fits) and cleans every diagram spec (unknown types dropped, numbers clamped, only known maths words allowed in formulas).
- Diagrams show beside the text on PC and above it on phones, in Full notes and in the printed notes.

### In-depth explanations for a student starting from zero
- `studyBoardService.js`: AI lessons (version 2, old cached lessons are rebuilt) now have: why it matters (an everyday question), what you need to know first, the idea in simple words with an analogy, each point explained with its reason and a diagram, a worked example with the reason for every step, common mistakes, and what to remember. Doubts are answered in the chosen language and can include a diagram.

### Tests
- New `backend/scripts/test_voice_tutor_and_diagrams.js` (8 checks: session setup, language and voice, class isolation, teacher mode, size caps, no-key 503, diagram cleaning, topic diagrams). All existing backend suites pass.
- Offline test kit: `backend/scripts/mock_gemini_server.js` + `mock_gemini_tutor_replies.js` imitate Gemini (models list, photo reading, lessons, doubts, and the Live voice session with tool calls and interruptions). Run it and start the backend with `GEMINI_API_BASE=http://127.0.0.1:8787 GEMINI_LIVE_WS_BASE=ws://127.0.0.1:8787`.
- Browser tests passed against the mock: voice lesson, typed doubt, spoken interruption (microphone), board tools, quick requests, read-aloud fallback, phone layout, teacher mode, all roles and tabs, photo import with figure, NCERT, sign out. Real Gemini voice quality could not be tested here (no internet access to Google from this machine).

### Files
- Backend new: `src/services/geminiClient.js`, `src/services/questionFigureService.js`, `src/services/diagramLibrary.js`, `src/services/tutorService.js`, `src/routes/tutor.js`, `scripts/mock_gemini_server.js`, `scripts/mock_gemini_tutor_replies.js`, `scripts/test_voice_tutor_and_diagrams.js`.
- Backend changed: `.env.example` (new optional settings), `src/server.js` (`/api/tutor` + its request limit), `src/routes/questions.js`, `src/services/questionInjectionService.js`, `src/services/studyBoardService.js`, `src/validators/questionIngestionValidator.js`.
- Frontend new: `js/boardDiagrams.js`, `js/liveTutor.js`. Changed: `js/studyBoard.js`, `js/app.js`, `js/appShell.js`, `css/features.css`, `index.html` (menu, scripts, cache versions: app.js 11.8, appShell 1.4, studyBoard 2.0, features.css 2.0).

### How to revert
- Previous copies of every changed file are in `_revert_backups/2026-11-17_voice-tutor/` (same folder layout). Copy them back and delete the new files listed above.
- With git: `git checkout -- <file>` for changed files and delete the new files, in `backend/` and `frontend/` separately.

---

## [2026-11-17 18:00] Merged Teammates' main (NCERT Reading Engine, Mode-Aware Question Ingestion) With Local Work, Conflict-Free Push Setup, Post-Merge Bug Check and Fixes

### What was merged
- Frontend `main` up to `3111a55` (PR #11 NCERT Reading Engine UI, PR #12 mode-aware question ingestion UI) and backend `main` up to `df4a5c5` (PR #19 NCERT Reading Engine, PR #20 mode-aware ingestion and reconciliation) were merged with the local work (Study Board, Class Desk, PostgreSQL persistence, hardening).
- Conflicts and how they were resolved (both sides kept everywhere): `frontend/js/appShell.js` (their `placeModeBar()` + our More-menu `fitTabs()`), `backend/package.json` (their `test:ncert`, `test:ai-study` + our `test:board`, `test:postgres`, `db:status`), `backend/src/server.js` (their NCERT router at `/api/v1` and `/v1` + our Study Board / doubts / notices / mistakes routers), and the logs. The duplicated `missingKey` block fix in `app.js` was already in their `main` too.
- Local `main` now points at `origin/main` and the working tree holds the merged result, so committing and pushing is a fast-forward with no merge conflicts.

### Bugs found after the merge, and fixed
- **Running the app or the tests changed files tracked by git** (`src/database/ncert_reading_books.json` 15 MB, `ncert_ai_study_cache.json`, `custom_injected_questions.json`, plus an untracked `teacher_dpps.json`). Every teammate would get different copies and merge conflicts. New `backend/src/config/dataPaths.js`: runtime changes now go to `backend/data/` (git-ignored, configurable with `DATA_DIR`); the committed JSON files are only read as starting data. Writes are atomic (temp file + rename). Used by `ncertReadingEngineService.js`, `ncertAiStudyService.js`, `teacherDppService.js`, `questionInjectionService.js`, `config/database.js`. Verified: all backend suites leave `git status` clean.
- **NCERT admin tokens were never checked**: `verifyToken()` accepted any or no token as admin, so anyone could edit topics and chapters. Tokens are now checked (HMAC signature + expiry); missing or forged tokens get 401. Refresh tokens still work. Reading content needs no token (unchanged).
- **NCERT routes had no request limits**: `/v1` now has the general limit; PDF upload and AI study aids (`/api/v1/admin/books/upload`, `/api/v1/admin/topics/:id/ai-study`, and the `/v1` copies) use the strict AI/upload limit. Upload errors (file too large, bad multipart) now return 413/400 instead of 500.
- **Students saw the NCERT admin tools** (Upload a Book PDF, Admin Session, Sign In). Students now get a reader only ("Read your NCERT textbook"); teachers keep the upload console. The session pill no longer claims "Admin Session Active" when not signed in.
- **Default admin password was prefilled** in the NCERT sign-in forms (`js/dualModeEngine.js`, `test_ui.html`); removed.
- **Uploaded file name was used in a temp path** for the PDF extractor; now a random name.
- **Frontend `server.js`** (our locked-down file list) would have blocked their NCERT page: `test_ui.html` (also `/ncert`, `/test-ui`) is now allowed.
- **Backend Docker image** would have included `.env` (secrets), `node_modules`, `data/`, logs: new `backend/.dockerignore`.
- **Adding questions by "Paste Text" always failed** after the mode-aware ingestion update: the page sent `mediaData: null`, which the new validator rejected ("expected string, received null"). The validator now treats null optional fields as not sent, and the page no longer sends a file field for text imports (`js/app.js`).
- **Teacher DPP "Read questions" (typed / PDF / photo) broke** because `/api/questions/inject/preview` now needs the exam mode, track and `sourceType`; `js/teacherDpp.js` now sends them from the header Board / Competitive switch.
- `/api/questions/generate-ai` and `/generate-llm` (AI calls) now use the strict AI rate limit.
- `npm run test:ingestion` rewrote `docs/extraction-benchmarks.md` (new timestamp) on every run; the report now goes to `backend/data/`, and `npm run benchmarks:update-docs` updates the committed copy on purpose.
- `scripts/test_question_injection.js` was out of date with the new rules (mode/track now required, new message wording) and depended on earlier runs; it now passes mode + track and uses its own temporary data folder.
- Cache versions bumped in `index.html` (`dual-mode.css` 1.2, `dualModeEngine.js` 1.3, `appShell.js` 1.3, `app.js` 11.7, `teacherDpp.js` 1.1).

### Checked on the merged code
- Backend: every suite passes (incl. their NCERT reading engine, AI study, phase 1/2 ingestion and image/paste ingestion tests, Study Board + Class Desk 14/14, PostgreSQL persistence 5/5, dual-mode 35/35, DPP + principal 10/10, class progress 45/45); CI database job replayed on a fresh PostgreSQL (schema + seed + curriculum sync + server health = `postgresql`, durable). The two long-failing tests were out of date with the seed data and are fixed (`test_teacher_auth_and_class_management.js`: biology default class is `12-Med`, composite classes created by the test include Biology; `test_class10_sync_and_banks.js`: the Class 10 maths teacher also has the seeded `10-Maths-A` section), so every backend suite now passes; only the voice-tutor TTS test needs internet. `npm audit --audit-level=high`: passes (moderate only).
- Frontend: all scripts pass (static guards, buttons, solution card, LaTeX, quiz modal, screenshot case, overflow at 360/768/1024/1440 px); `npm audit`: 0 vulnerabilities.
- Headless Chrome PC + phone: role isolation, question import by pasted text (preview + push to bank), DPP end-to-end (typed questions), navigation (incl. NCERT tab and More menu), sign out for all roles, Study Board, Class Desk, mistake notebook, all printable reports, principal notices, NCERT Reading Engine for teacher and student; no JS errors.

### How to Revert
- Everything on disk before this step is in `_revert_backups/2026-11-17_merge-main/` (`frontend/` and `backend/` with the same layout). To undo the merge state: `git reset --hard 2d61782` (frontend) / `git reset --hard 611156e` (backend), then copy the backup files back.
---

## [2026-11-17 16:45] Study Board, Class Desk (Doubts, Notices & Homework, Mistake Notebook), Printable Reports, PostgreSQL Persistence and Production Hardening

The existing AI Smartboard (AI Tutor tab, `whiteboard.html`, `src_whiteboard/`, `js/geminiLiveVoiceTutor.js`, voice-tutor backend) was NOT changed. Login is unchanged (to be updated later). Full illustrated guide: `Unisole_New_Features_Guide_2026-11-17.pdf` in the project root.

### New for students and teachers
- **Study Board** (new tab, separate from the AI Smartboard; plain whiteboard look with a handwriting font, no AI styling). Students: Learn a topic step by step (key ideas, derivations, worked examples from the bank, common mistakes, check yourself), Solve my doubt (typed or photo; AI-worked if `GEMINI_API_KEY` is set, otherwise the closest solved bank question; one tap sends it to the teacher), Practice with hints (general -> specific, answer only on request), full notes to print, "I understood this topic" progress. Teachers: same board for their subject with Present (full-screen classroom mode, arrow keys / clicker).
- **Class Desk** (new tab). Students: notices and homework for their class (due dates, tick Done), My doubts (ask the subject teacher with text/photo, see replies). Teachers: doubts inbox (own subject only), post homework/notices to own classes (see "x of y done"), Reports.
- **Mistake notebook** (student Practice tab, second switch): wrong/skipped answers from tests, DPPs and Study Board practice; retry until Mastered; topics to work on.
- **Printable reports (print / save as PDF, school letterhead, in-app preview, no pop-ups)**: question paper, answer key, class result sheet, student report card (teacher and student), school report (principal), study notes.
- **Principal**: new Notices tab (school-wide or per-class notices; sees all notices and homework) and "Print school report" button.
- **PC top bar**: at most 7 tabs, the rest under a "More" menu; icons dropped if the row is still too wide.

### Production
- **PostgreSQL persistence** (`backend/src/services/persistence.js`): all school data saved to table `school_records` (collection, id, JSONB) after every change, every 60 s and on shutdown; loaded on start. `DATABASE_REQUIRED=true` refuses to start without the DB; otherwise memory-only with a loud warning. `/api/health` shows `storage`. One backend instance per database.
- **Security / reliability**: security headers, per-IP rate limits (general + costly AI/upload routes), JSON 404 and error handler (no internals in production), graceful shutdown with final save, Kafka only when `KAFKA_ENABLED=true`, DB TLS via `sslmode`/`DATABASE_SSL`.
- **Frontend `server.js`**: serves only `index.html`, `whiteboard.html`, `assets`, `css`, `js`, `vendor` (previously `.git`, logs, docs, scripts and package files were downloadable); no dot-files, GET/HEAD only, no crash on read errors. New `frontend/.dockerignore`.

### Files
- Backend new: `src/services/persistence.js`, `src/services/studyBoardService.js`, `src/services/classDeskService.js`, `src/middleware/security.js`, `src/routes/_handle.js`, `src/routes/studyBoard.js`, `src/routes/doubts.js`, `src/routes/notices.js`, `src/routes/mistakes.js`, `scripts/db_status.js`, `scripts/test_postgres_persistence.js`, `scripts/test_study_board_and_class_desk.js`.
- Backend changed: `src/server.js`, `src/config/database.js`, `src/services/questionInjectionService.js`, `src/kafka/producer.js`, `src/kafka/consumer.js`, `src/registry/workspace_tabs.json` (v1.2.0: teacher tabs `classDesk`, `studyBoard`), `src/registry/tenants/sch_unisole_001.json`, `src/registry/tenants/sch_demo_board_only.json` (flags `studyBoard`, `classDesk`), `database/schema.sql` (`school_records`), `.env.example` (new settings), `package.json` (`test:board`, `test:postgres`, `db:status`), `scripts/test_dual_mode_registry.js` (new tabs).
- Frontend new: `js/studyBoard.js`, `js/classDesk.js`, `css/features.css`, `css/print-report.css`, `assets/fonts/kalam-latin-400-normal.woff2`, `assets/fonts/kalam-latin-700-normal.woff2`, `assets/fonts/OFL-kalam.txt`, `.dockerignore`.
- Frontend changed: `index.html` (new drawer cards and tab containers, Practice switch, principal Notices card/panel and print button, CSS/script tags, cache versions), `js/app.js` (tab titles for the 4 new tabs only), `js/appShell.js` (labels, More menu), `js/principalDashboard.js` (Notices panel), `server.js`.

### New API
`GET /api/study-board/catalog|lesson|practice`, `POST /api/study-board/practice/hint|practice/check|doubt|progress`; `GET|POST /api/doubts`, `POST /api/doubts/:id/reply|resolve`; `GET|POST /api/notices`, `POST /api/notices/:id/done`, `DELETE /api/notices/:id`; `GET /api/mistakes`, `POST /api/mistakes/retry|status`.

### Checked
- Backend: Study Board + Class Desk 14/14, PostgreSQL persistence 5/5 (real PostgreSQL 16, server restarted 3 times), dual-mode registry 35/35, teacher DPP + principal 10/10, all other suites pass (2 pre-existing failures unchanged: teacher-auth defaults, Class 10 class list).
- Frontend scripts all pass (static guards, buttons, solution card, LaTeX, quiz modal 32/32).
- Headless Chrome, PC 1440 px and phone 390 px: every new flow for student, teacher and principal; role isolation + DPP end-to-end; navigation incl. More menu and bottom bar; sign out for all roles; no JS errors; no sideways scroll on phone.
- Not testable here: the Gemini-powered parts of the Study Board (no network/key) and your own `DATABASE_URL`.

### After pulling
- Restart the backend (it creates `school_records` and copies current data into it on first start). Check `GET /api/health` -> `storage.mode = postgresql`, or `npm run db:status`. Press Ctrl+F5 in the browser.

### How to Revert
- Previous versions of every replaced file: `_revert_backups/2026-11-17_study-board-class-desk/` (same folder layout). Copy them back and delete the new files listed above. Optional DB clean-up: `DROP TABLE school_records;`.

---

## [2026-11-17 09:15] Merge-Conflict Repair: Sign-Out and Whole Frontend Broken by a Duplicated Block in app.js

After merging `main`, nothing in the frontend responded (including Sign Out). Cause: the merge kept the "MCQs need an answer key" block twice inside `commitInjectedQuestionToBank()` in `frontend/js/app.js`, so `const missingKey` was declared twice. That is a JavaScript syntax error, so the browser refused to run the entire `app.js` (no sign-out, no tabs, no buttons).

### Fix
- `frontend/js/app.js`: removed the second copy of the 8-line block (lines 21350-21357). No other change. The file is now identical to the last working version.

### Checked
- No conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) anywhere in frontend or backend.
- `node --check` passes for every `.js` file in `frontend/js`, `frontend/server.js`, `backend/src`, `backend/scripts`; every registry / package JSON parses; every script and stylesheet referenced by `index.html` exists.
- All other merged code files match the last working version except `backend/src/services/aiVoiceTutorService.js` (your team's new Smartboard AC-circuit / Gauss-law boards), which is valid.
- Browser run of the merged code (headless Chrome, PC 1440px and phone 390px): sign in and **Sign Out** work for teacher, student and principal (header button on PC, menu on phone; returns to the sign-in page and clears the saved role); role lock holds; every tab opens; teacher DPP create (typed and bank) and results, student Practice attempt, principal dashboard and Smartboard header work; 0 JS errors.

### How to Revert
- The broken merged file is saved at `_revert_backups/2026-11-17_merge-fix/frontend/js/app.js`; a snapshot of the merged `frontend` + `backend` (before this fix) is `_revert_backups/2026-11-17_merge-fix/team_snapshot_after_merge.tgz`.

---

## [2026-11-17 01:30] Role Lock (No Portal Switching), Principal Live Dashboard, Teacher-Created DPPs, Balanced Answer Keys

### What changed for users
- **Each login sees only its own portal.** The "Portal Views" menu section (Teacher Dashboard / Student Test Portal / School Overview) is gone. The role chosen at sign-in is locked for the session: a teacher cannot open the student or principal portal, a student cannot open teacher or principal screens, and the principal cannot open teacher or student workspaces. Changing portal means **Sign Out** and signing in again ("Switch Portal" buttons became "Sign Out"). The lock survives a page reload.
- **Principal portal rebuilt with live telemetry** (tabs: Overview, Classes, Teachers, Tests & Topics), read-only:
  - Overview: students, teachers, test participation, school average, DPPs assigned and attempted, students needing support; classes at a glance; students below 50% or with missed tests; hardest topics school-wide.
  - Classes: every class with subjects, students, tests, participation, average and DPPs; top students.
  - Teachers: classes taught, tests published, submissions received, class average, DPPs created and attempts, last activity, "No tests yet" flag.
  - Tests & Topics: every published test with teacher, submitted / enrolled, average, lowest / highest; hardest and strongest topics.
  - The old principal page was static text with made-up numbers (94.2%, 18.5 hrs, +26%); it is replaced entirely.
- **Teachers create DPPs instead of solving them.** The teacher's DPP tab (Competitive mode) now has "Create DPP" and "My DPPs & results":
  - Choose class (only the teacher's own classes), title, chapter, time limit, due date, marking (+4/-1 or +1/0).
  - Questions from the question bank (random chapter MCQs with verified answers), or the teacher's own questions by typing / pasting, uploading a PDF, or a photo. Own questions are read by the Add Questions pipeline; the teacher picks the correct option where the text has no answer; non-MCQ questions are skipped.
  - Results per DPP: submitted / enrolled, class average, every student's status, score, correct / wrong / skipped and time, and question-wise accuracy. A DPP can be deleted.
- **Students get the DPPs in "Practice".** The student Practice tab (previously two hardcoded drill cards "Assigned by Dr. Vikram" on Class 11 topics) lists the DPPs assigned to their class with due dates. A DPP is attempted once with a timer; answers and solutions appear only after submitting.
- **Smartboard header** shows "Live AI Smartboard Session" (no teacher name).

### Similar bugs found and fixed
1. A saved teacher profile in the browser turned any later session (principal or student) back into a teacher session on reload. Restoring a profile no longer changes the signed-in role, and every sign-out clears the saved teacher profile.
2. Clicking the header profile chip opened the teacher's "Profile & Classes" window for students and the principal; it now does nothing for them.
3. Teachers had "Attempt Test as Student", "Start Attempt", "Re-take in Student Portal" and the post-publish "attempt" button, which switched them into the student portal.
4. Teachers had "Submit Class Attempts & Generate Dashboard", which created fake student submissions (`/api/curriculum/simulate-attempts`). The button is removed; the pending card says results appear when students submit.
5. **Every Class 12 Physics bank MCQ (516 of 517) had the correct answer as option A**, as did most Chemistry/Biology/Maths bank MCQs, so "always pick A" scored 100% in tests and DPPs. Bank MCQs now get a fixed option order derived from the question id (same order on every restart); teacher-added questions keep their own order. Physics now: A 138, B 122, C 116, D 133.
6. The Class 10 Science seed test was attributed to "Er. Rajesh Kumar" (not a teacher in the school) instead of Er. Rakesh Thakur, and `POST /api/assessments` defaulted any test without a teacher name to "Er. Rajesh Kumar".
7. The "Active Faculty Test Assignment" label in the student portal is now "Assigned test".

### Backend repository (`backend/`)
**New files**
- `src/services/teacherDppService.js`: create (BANK or CUSTOM questions, teacher scope + class checks via `subjectScope`), teacher list / detail / delete (subject-scoped), student list / detail (own class only, answers hidden until submitted), submit (once per student, marking per DPP). Persists to `src/database/teacher_dpps.json` (created on first save).
- `src/routes/dpp.js`: `POST /api/dpp`, `GET /api/dpp?teacherSubjectKey=`, `GET /api/dpp/assigned?studentId=`, `GET /api/dpp/:id?teacherSubjectKey=|studentId=`, `POST /api/dpp/:id/submit`, `DELETE /api/dpp/:id?teacherSubjectKey=`.
- `scripts/test_teacher_dpp_and_principal.js` (`npm run test:dpp`): balanced keys, DPP create / isolation / student flow / results, principal totals and teacher attribution.

**Modified files**
- `src/server.js`: mounts `/api/dpp`.
- `src/routes/analytics.js`: new `GET /api/analytics/principal-overview` (`buildPrincipalOverview`): totals, classes, teachers, tests, weak / strong topics, students needing support, top students, all computed from the live store.
- `src/config/database.js`: bank MCQ option order balanced after the option-enrichment step; Class 10 Science seed test teacher name.
- `src/routes/assessments.js`: `teacherName` default is empty instead of "Er. Rajesh Kumar".
- `package.json`: `test:dpp` script.

### Frontend repository (`frontend/`)
**New files**
- `js/teacherDpp.js`: teacher DPP manager (create / list / results) and student Practice list / attempt / result.
- `js/principalDashboard.js`: principal panels (Overview, Classes, Teachers, Tests & Topics) from `/api/analytics/principal-overview`.

**Modified files**
- `index.html`: "Portal Views" section removed; student menu "Switch Portal" removed; header "Switch Portal" is now "Sign Out" (`signOutCurrentUser`); header chip uses `handleRoleBadgeClick`; principal profile card + "Principal Portal" menu (`#drawerSectionPrincipalNav`); principal view replaced by live panels; Practice tab content replaced by `#studentAssignedDppList`; menu item "Personalized Assignments" renamed "Practice"; post-publish "attempt" button hidden; new scripts loaded; cache versions bumped.
- `js/app.js`: role lock (`normalizePortalRole`, `setSessionRole`, `sessionAllows`, `signOutCurrentUser`); `switchPortalRole`, `switchTeacherTab`, `switchStudentTab`, `openFacultyClassSwitcherModal`, `handleGoToSmartReport`, `attemptActiveTestInStudentPortal` refuse other roles; principal / teacher / student menu sections per role; `applyTeacherProfile` sets the role only on an explicit sign-in; sign-outs clear the saved teacher profile; teacher "attempt as student" and "simulate attempts" buttons removed; Smartboard header text; Practice tab loads assigned DPPs.
- `js/dualModeEngine.js`: teacher DPP tab renders `TeacherDpp` instead of the solve view.
- `js/appShell.js`: principal tabs come from the principal menu.
- `css/unisole-theme.css`: principal dashboard and DPP styles.

### Not covered (needs real accounts)
The lock is enforced in the app (every screen and function checks the signed-in role) and the DPP / analytics APIs check subject, class and student ownership. The backend still has no login tokens (sign-in is a phone lookup), so a technical user calling the API directly could still request data. Real server-side isolation needs authenticated sessions (e.g. signed tokens with role, subject and class), which is a separate piece of work.

### Verification Results (Post-Final Edit)
- Role test (headless Chrome): teacher, student and principal each see only their own menu sections; forced calls to `switchPortalRole`, `switchTeacherTab`, `switchStudentTab`, `openFacultyClassSwitcherModal` and "attempt as student" from another role are refused; principal role survives a reload; Sign Out returns to the sign-in page.
- DPP flow: teacher created a typed-question DPP (2 MCQs kept, 1 subjective skipped, assignment blocked until the missing key was chosen) and a 6-question bank DPP; student saw both in Practice, attempted the bank DPP (score 4 / 24 with +4/-1, answers hidden until submit); teacher results and principal totals updated.
- `npm run test:dpp` 10/10; `test_dual_mode_registry.js` 35/35; `test_question_injection.js`, `test_evaluator.js`, `test_class_progress_dashboard.js`, `test_latex_rendering_and_options.js`, `test_question_bank_solution_studio.js`, `test_board_paper_generator.js`, `test_subject_isolation_and_teacher_workflow.js`, `test_math_question_bank.js`, `test_end_to_end_assignment_flow.js` pass. The same 2 known old failures remain (`test_teacher_auth_and_class_management.js`, `test_class10_sync_and_banks.js`).
- Frontend: navigation test (all tabs, PC + phone) passes; feature regression (Question Bank filters, NCERT sets, Add Questions) passes; `test_static_guards.js`, `test_overflow_viewports.js`, `test_buttons.js`, `test_quiz_creation_and_modal_display.js` pass. 0 JS errors.

### How to Revert
- **Full revert:** copy everything inside `_revert_backups/2026-11-17_role-lock-principal-dpp/` back over the workspace root (PowerShell: `Copy-Item -Recurse -Force _revert_backups\2026-11-17_role-lock-principal-dpp\* .`), then delete `backend/src/services/teacherDppService.js`, `backend/src/routes/dpp.js`, `backend/scripts/test_teacher_dpp_and_principal.js`, `backend/src/database/teacher_dpps.json` (if created), `frontend/js/teacherDpp.js` and `frontend/js/principalDashboard.js`.
- **Answer-key balancing only:** restore `backend/src/config/database.js` from that folder.

---

## [2026-11-16 23:59] Frontend Redesign: "Sky Blue & White" Theme, PC Top Tabs + Phone Bottom Tab Bar, Decluttered Screens

Redesigned the frontend for schools (students and teachers) on PC and phone, as chosen from the mockups: **Sky Blue & White** theme, **top tabs + menu on PC** (layout 2C) and **bottom tab bar on phones** (layout 2A). All features, data, scoping and Board/Competitive logic are unchanged; the redesign only changes how screens look and how you move between them. The AI Smartboard (AI Tutor tab) was not modified.

### What users see
- **PC:** header with the Unisole logo, portal name, profile chip, class pill and theme toggle; below it one tab row with every feature of the role (teacher: Create Test, Class Progress, Question Bank, Scan Sheets, NCERT, plus Roadmap / DPP / Cheat Sheet in Competitive; student: Tests, Report Card, My Results, Practice, AI Tutor, NCERT...; principal: School Overview). The Board/Competitive switch sits at the right end of the tab row as one slim control. The menu button (top left) still opens everything else: profile, switch class, class actions, portal views, sign out.
- **Phone:** one-line top bar (logo, page title, class pill, theme). Board/Competitive row under it. Bottom tab bar with 4 main features + **More** (opens the menu). If a feature beyond the first 4 is open, it takes the 4th slot so the active page is always highlighted.
- **Tablet / small laptop (900-1279px):** tab icons hidden and the mode switch drops to its own row so every tab stays visible.
- **Sign-in:** new light page: logo, "Welcome to Unisole", teachers as simple name cards (subject + classes), "Sign in with mobile number" folded away, Student and Principal cards. Same functions and element ids as before.
- **Calmer screens:** flat near-white background, white cards with one thin border, one blue for actions, sentence-case labels instead of ALL-CAPS, neutral badges, white modal headers instead of gradient bars, lighter exam question grid and palette, tables scroll sideways on phones instead of squeezing.
- **Plain language:** "Inject Question (AI Ingest)" -> "Add Questions"; "Faculty Question Ingestion Studio" -> "Add Questions to the Bank"; "AI Extract & Auto-Categorize" -> "Read Questions"; "Push All Questions to Bank" -> "Save to Question Bank"; "Switch Scope" -> "Switch"; "Recorded Assessments & Test Telemetry" -> "Recorded Tests"; sign-in toast "Signed in as <name> • <subject>, Class <n>".
- **Noise removed:** "Test Started" toast that popped up on the sign-in screen (background preload is now silent), internal question ids in the Question Bank, "KaTeX formatting enabled" / "1 Question Per Page Mode" notes, duplicate in-page student tab strip, the old "Curriculum & Exam Tracks" menu section (the Board/Competitive switch replaces it), emojis in Add Questions buttons and tabs.
- **Header class pill:** students now see their own class ("Class 12 Non-Medical") instead of the last teacher's class; hidden for the principal.
- **Dark mode** still available from the moon button, re-tuned to navy (#0B1226).

### Frontend repository (`frontend/`)
**New files**
- `css/unisole-theme.css`: design tokens (palette, radius, shadows; old variables mapped onto them), self-hosted fonts, header, PC tab bar, phone bottom bar, cards, buttons, forms, tables, modals, menu drawer, sign-in page, student test grid/palette, tablet and phone rules, dark-mode fixes for inline colours left from the old dark design (Smartboard excluded). Loaded last in `<head>`.
- `js/appShell.js`: renders the PC tabs (`#shellTabs`) and phone bottom bar (`#shellBottomNav`) by mirroring the role's menu cards (each tab clicks the original card, so existing handlers run); moves `#modeSwitchBar` into `#shellModeSlot`; turns the Create Test "assessment type" dropdown into a two-button switch (`#shellPaperModeSwitch`, drives the original select); sets the phone page title and the header class pill per role. Exposes `window.UnisoleShell.refresh()`.
- `assets/fonts/`: Plus Jakarta Sans 600/700/800 and Inter 400-700 (woff2, OFL licence files included), so fonts work offline.

**Modified files**
- `index.html`: Google Fonts link replaced by local font preloads; `theme-color` white; `css/unisole-theme.css` linked at the end of `<head>`; header gets `.shell-brand`, `#shellPageTitle` and the `#shellTabbar` row; `#shellBottomNav` added after the header; `js/appShell.js` loaded last; `app.js?v=11.4` so browsers fetch the new script; sign-in gateway markup rewritten (same ids/handlers: `portalRoleGatewayModal`, `formGatewayTeacherLogin`, `inputGatewayTeacherPhone`, `gatewayPhoneLookupStatus`, `inputGatewayTeacherName`, `selectGatewayTeacherSubject`, `selectGatewayTeacherGrade`, `btnGatewayStudentQuick`, `btnGatewayDirectorQuick`); Add Questions modal and class switcher wording simplified; auto-categorization banner removed (message moved to the modal subtitle); Question Bank button labels; "Recorded Tests" title; KaTeX note removed.
- `js/app.js`: `startAssignedTest(assessment, { silent })` (background preload no longer toasts); sign-in toast text; inject badge/button texts; "Switch" label in the class switcher; Question Bank "Q<n> of <total>" without the internal id; student tag "Student"; `haps:modechange` listener guarded for non-browser test runners.

### Backend repository (`backend/`)
- `scripts/test_question_injection.js`: one log line uses "PASS:" instead of an emoji (frontend static guard checks added emojis).

### Verification Results (Post-Final Edit)
- Navigation test (headless Chrome, PC 1440px and phone 390px): every PC tab and every phone bottom-bar button opens the right page and highlights itself, for teacher (Board and Competitive) and student; "More" opens the menu; picking a 6th feature from the menu shows it in the bottom bar. 0 JS errors.
- Feature regression (same script as the previous entry): Board/Competitive teacher tabs, Create Test class list, Question Bank filter counts exact, chapter DPP, Board NCERT sets, Add Questions preview, answer-key block and save all unchanged and passing.
- Frontend scripts: `test_overflow_viewports.js` (no horizontal overflow at 360/768/1024/1440), `test_static_guards.js`, `test_buttons.js`, `test_quiz_creation_and_modal_display.js` (32/32), `test_latex_*`, `test_intuitive_solution_card.js`, `test_screenshot_case.js`, `test_user_snippet.js` pass. `test_interactive_clicks.js` fails the same way as before this entry (Smartboard `window.addEventListener('message')` in a non-browser runner).
- Screens checked visually on PC, tablet (1024px) and phone, light and dark: sign-in, all teacher tabs, Competitive tools, all student tabs, principal, Add Questions modal, class switcher, test report, board paper.

### How to Revert
- **Full revert:** copy everything inside `_revert_backups/2026-11-16_ui-redesign-sky-blue/` back over the workspace root (PowerShell: `Copy-Item -Recurse -Force _revert_backups\2026-11-16_ui-redesign-sky-blue\* .`), then delete `frontend/css/unisole-theme.css`, `frontend/js/appShell.js` and `frontend/assets/fonts/`.
- **Look only (keep text changes):** remove the `css/unisole-theme.css` link and the `js/appShell.js` script tag from `frontend/index.html`.

---

## [2026-11-16 21:10] Mode Features per Diagram, Teacher Tab Cleanup, Question Bank Filters, Working Question Injection & Unisole Logo

Checked every annotation on the review screenshots against the code and finished what was missing. The AI Smartboard was not modified.

### What was checked and what changed
| Annotation | Status before | Now |
|---|---|---|
| Competitive = Roadmap, NCERT, chapter-wise PYQ, chapter-wise DPP, Cheat Sheet | Rank Analytics extra, DPP not chapter-wise, NCERT not a teacher tab | Exactly these tabs; DPP has a chapter picker |
| Board = NCERT (exercise + exemplar), chapter-wise PYQ | Roadmap, Cheat Sheet cards and DPP also shown; NCERT not split | Board shows Create Test, Class Progress, Question Bank, Scan Sheets, NCERT (Exercise / Solved Examples / Exemplar) |
| Remove Scan Paper Sheets from Competitive | Already hidden | Kept hidden (test asserts it) |
| Add NCERT tab in both modes | In a separate "Mode Tools" list | Inside "Teacher Workspace Tabs" in both modes |
| Class 12 Physics teacher sees 12-A, 11-NonMed, 10-Science, 11-Med, 12-Med with fake counts | Create Test listed every class with invented counts | Only the active grade's sections, e.g. "Class 12 Non-Medical • Physics (8 students)", "Class 12 Medical • Physics (5 students)"; real enrolment |
| Remove faculty welcome strip and "Official Board & NTA Schema" badge | Present | Removed |
| Question Bank dropdowns should match the backend design | Fixed options that did not match the data (e.g. "Source Pool" values that never matched) | Built from the loaded questions with counts; classification mirrors `canonicalContentService` |
| Inject Question should work properly | Parser swallowed questions containing the word "solution", missed (a)-(d) options, invented answer keys ("A"), solutions and PYQ years, tagged every senior question as JEE | Fixed end to end (details below) |
| Add the Unisole logo where important | Letter "U" badges and an "H" favicon | Logo in favicon, sign-in gateway, header, drawer and principal dashboard |

### Backend repository (`backend/`)
**Modified files**
- `src/registry/tenants/sch_unisole_001.json`: Board flags: `topicRoadmap`, `cheatSheets`, `dailyPracticeProblems`, `rankAnalytics` off; `chapterWisePYQ`, `ncertExemplar`, `scanPaperSheets` on. Competitive flags: `topicRoadmap`, `cheatSheets`, `dailyPracticeProblems`, `ncertExemplar`, `chapterWisePYQ` on; `scanPaperSheets`, `rankAnalytics` off.
- `src/registry/workspace_tabs.json` (v1.1.0): `questionBank` is now a registry tab (both modes, flag `chapterWisePYQ`); `ncertCore` labelled "NCERT"; Competitive DPP labelled "Chapter-wise DPP", cheat sheets "Cheat Sheet"; tab order = list order.
- `src/modules/dpp.js`: chapter-wise DPP. `chapter` (a chapter code) filters the pool; payload adds `chapter` and `chapters` (options with counts); the chapter joins the seed only when chosen, so whole-subject DPP ids are unchanged; attempts record `chapter`.
- `src/modules/ncertCore.js`: Board payload adds `ncertSets` (exercise / example / exemplar: count + up to 15 items with solutions) and per-chapter `exerciseCount`, `exampleCount`, `exemplarCount`.
- `src/services/canonicalContentService.js`: canonical record gains `source_raw` (upper-cased `question_source`).
- `src/services/questionInjectionService.js`:
  - Solution detection anchored to line start ("Solution:", "Sol.", "Explanation:", "Step 1:"); before, any question containing the word "solution" was swallowed.
  - Options accept `(a)`/`a)`/`(A)`/`A)`, inline or one per line; kept only as a clean A-B / A-C / A-D run, so "(a) define ... (b) derive ..." sub-parts are not mistaken for options.
  - Answer key read only from an explicit "Answer:/Ans:/Correct:/Key:" line; otherwise `correct_answer` is `null` with `answer_key_missing: true` (no invented "A"). Assertion-Reason no longer pre-marks option A.
  - No invented solution text; format from content (MCQ_SINGLE, ASSERTION_REASON, CASE_STUDY, VERY_SHORT_ANSWER, SHORT_ANSWER, LONG_ANSWER).
  - New `detectExamYearFromText` (e.g. "[CBSE 2023]", "JEE Main 2024") sets `exam_tag` / `pyq_year`.
  - New `buildInjectedAppearance`: "CBSE Board 2023 PYQ", "CBSE Board PYQ (year not tagged)", "NCERT Textbook Exercise", "NCERT Solved Example", "NCERT Exemplar", "CBSE Sample Paper Pattern", "JEE Main 2024" / "JEE Main Practice"; no invented year.
  - `target_exam` is `CBSE_BOARD` / `CBSE_CLASS_10` for board categories and JEE_MAIN / NEET_UG only for the Competitive category (before, every senior injection was tagged JEE_MAIN and leaked into Competitive mode).
  - New categories `NCERT_EXEMPLAR` and `CBSE_SAMPLE_PATTERN`.
  - An image (no `GEMINI_API_KEY`, or nothing found) or a PDF with no text layer now fails with `EXTRACTION_UNREADABLE` and tells the teacher to paste the text, instead of inventing a placeholder question.
- `src/services/llmQuestionEngine.js`: `sanitizeOptionFormula` keeps plain-word options ("Osmotic pressure", "Viscosity") as text instead of wrapping them in `$...$`.
- `src/routes/questions.js`: inject preview / commit return 422 for `EXTRACTION_UNREADABLE`.
- `scripts/test_dual_mode_registry.js`: asserts the new tab sets per mode, Board Roadmap / Cheat Sheet / Rank Analytics gated off (403), Board NCERT sets, chapter-wise DPP; ICSE no-content check uses `ncert_core`.
- `scripts/test_question_injection.js`: TEST 5 expects real extraction or a clear `EXTRACTION_UNREADABLE` refusal for a blank image.

### Frontend repository (`frontend/`)
**New files**
- `assets/brand/`: `unisole-logo-original.png` (as supplied), `unisole-logo-on-dark.png` (transparent), `unisole-logo-on-light.png` (navy + brand blue), `unisole-mark-on-dark.png`, `unisole-mark-on-light.png`, `favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`, `unisole-icon-512.png`.
- `css/brand.css`: `.unisole-mark` (shows the light or dark version by `data-theme`), header / drawer / card sizes, gateway logo, print rule.

**Modified files**
- `index.html`:
  - Favicon and apple-touch icon use the Unisole mark; `css/brand.css` linked; cache versions bumped (`dual-mode.css?v=1.1`, `app.js?v=11.3`, `dualModeEngine.js?v=1.1`).
  - Logo placed in the sign-in gateway (replaces the "UNISOLE" text badge), the header (next to the menu button; hidden under 640px), the drawer brand (replaces "U") and the principal dashboard card (replaces "U").
  - Removed `#teacherWelcomeStrip` (name / "Physics Expert" / "Active Scope: Class 12-A" strip) and the "Official Board & NTA Schema" badge. JS references were already null-guarded.
  - Question Bank "Source Pool" label renamed "Exam & Year".
  - Inject Question category options: Previous Year Question, NCERT Exercise, NCERT Solved Example, NCERT Exemplar, CBSE Sample / Board Pattern, JEE / NEET / Competitive.
  - "Class 12-A" defaults renamed "Class 12 Non-Medical" (paper title, take-test header, select option).
- `js/app.js`:
  - Question Bank: new `qbModeQueryString`, `qbCategoryOf`, `qbExamYearTags`, `qbFormatGroupOf`, `qbGradeScoped`, `populateQbFilterOptions` (Category, Exam & Year, Difficulty, Format built from loaded data with counts). `filterQuestionBankCards` uses the same classifiers (exact match). The senior subject-bank fetch sends the active mode (`mode`, `board` / `stream`), the cache key includes it, and the bank reloads on `haps:modechange`. Browser-cached injected questions also respect the mode.
  - Create Test: new `scopedPaperClassList`, `paperClassLabel`, `refreshPaperClassOptions` (active grade only, clear names, real counts); called on class load and after live sync.
  - Inject Question: grade options limited to the teacher's grades; preview shows a "Correct option" picker (`setInjectAnswerKey`) and flags MCQs without a key; push is blocked until every MCQ has a key; preview shows format and exam year and says when no solution exists; after push the filter options are rebuilt.
  - "Class 12-A" / invented counts ("48 Students", "42 Students", "45 Students") in fallback labels replaced.
- `js/dualModeEngine.js`: teacher mode tools render inside "Teacher Workspace Tabs" (`#drawerTeacherModeTools`) and the separate Mode Tools section is hidden for teachers (students unchanged); opening a tool clears the core-tab highlight; DPP chapter picker (`#dmDppChapter`, "All chapters (mixed)") with the chapter sent on submit; Board NCERT shows Exercise / Solved Examples / Exemplar sections with counts and solutions, and chapter options show the three counts.
- `css/dual-mode.css`: `.dm-inline-tools`.

### Line endings
`backend/src/routes/questions.js` kept CRLF as on disk. All other modified files keep their existing endings; new files are LF.

### Verification Results (Post-Final Edit)
- Backend: `test_dual_mode_registry.js` 35/35, `test_question_injection.js` 7/7, `test_evaluator.js`, `test_class_progress_dashboard.js`, `test_latex_rendering_and_options.js`, `test_question_bank_solution_studio.js`, `test_board_paper_generator.js` passed; with a live server `test_subject_isolation_and_teacher_workflow.js`, `test_math_question_bank.js`, `test_end_to_end_assignment_flow.js` passed. Same 2 pre-existing failures as before (`test_teacher_auth_and_class_management.js`, `test_class10_sync_and_banks.js`).
- API: injection of 3 pasted Chemistry questions (inline lowercase options + "Ans: (a)", a 3-mark subjective, an MCQ without a key) gives MCQ / key A / CBSE 2023, SHORT_ANSWER, MCQ with `answer_key_missing`; after commit all 3 appear in the Board bank, only the 2 keyed MCQs in Competitive JEE; a Physics teacher pushing Chemistry gets 403. Test entries were removed from `custom_injected_questions.json` afterwards.
- Headless Chrome (Physics teacher): Board tabs = Create Test, Class Progress, Question Bank, Scan Sheets, NCERT; Competitive tabs = Create Test, Class Progress, Question Bank, NCERT, Roadmap, Chapter-wise DPP, Cheat Sheet; Create Test class list = 12 Non-Medical and 12 Medical only; every Question Bank option's count equals the filtered result; the bank reloads with `mode=COMPETITIVE&stream=JEE`; chapter DPP returns only that chapter; Board NCERT shows Exercise (4), Solved Examples (7), Exemplar (36) for Electric Charges and Fields; inject preview blocks push until a key is chosen, then the bank grows by 2 and "CBSE 2023" count increases; all logo images load in light and dark theme; 0 JS errors (only blocked CDN requests in the sandbox).

### How to Revert
- **Full revert:** copy everything inside `_revert_backups/2026-11-16_logo-modes-qb-inject/` back over the workspace root (paths preserved; PowerShell: `Copy-Item -Recurse -Force _revert_backups\2026-11-16_logo-modes-qb-inject\* .`), then delete `frontend/assets/brand/` and `frontend/css/brand.css`.
- **Mode features only:** restore `backend/src/registry/tenants/sch_unisole_001.json` and `backend/src/registry/workspace_tabs.json` from that folder.
- **Logo only:** restore `frontend/index.html` from that folder and delete `frontend/assets/brand/` and `frontend/css/brand.css`.

---

## [2026-11-16 19:23] Full-Project Bug Audit: Per-User Content Isolation, Live Class Data & Seed Fixes

Ran a full audit of every role (6 faculty, student, principal) with a headless-Chrome explorer (every tab, button, dropdown and modal, in Board and Competitive mode), an end-to-end data-flow test (teacher publishes, student submits, teacher sees results) and an API isolation sweep. Fixed every confirmed bug below. The AI Smartboard was not modified.

### Bugs Found & Fixed

**Content isolation (backend)**
1. Senior Physics, Chemistry and Mathematics teachers received Class 10 students from `GET /api/curriculum/students?subjectKey=...` (the Maths filter even included `Science-A`; Physics/Chemistry had no filter).
2. `GET /api/assessments` matched by subject name only, so senior Mathematics saw Class 10 Maths tests; the class filter also matched loosely (`includes`), and the `teacherSubjectKey` parameter was ignored.
3. `GET /api/analytics/class-dashboard` fell back to all subjects when a teacher had no tests, listed every subject's tests in its dropdown, and opened any test id.
4. `POST /api/curriculum/generate-test`, `POST /api/assessments/unit-test/generate-draft` and `POST /api/assessments/board-paper/generate` accepted tests for another subject or class (e.g. a Biology teacher created a Physics test for 12-NonMed; Biology could be assigned to a Non-Medical class).

**Content isolation (frontend)**
5. Student portal listed every published test in the school (Class 10, Class 11 Medical, etc.) and merged local tests with a default class of 12-NonMed.
6. Teacher "Assigned Tests" (Take / Conduct) was a hardcoded Physics list shown to every faculty.
7. Class Progress "Recorded Tests" fell back to other subjects' / 12-NonMed tests when the teacher's class had none; report detail and two other report views also fell back to another subject's test.
8. Rosters fell back to the 12-NonMed roster for any unknown class.
9. Class pickers offered classes outside the teacher's scope: `FACULTY_SUBJECT_CLASSES.PHYSICS` included `10-Science-A`; the drawer class dropdown listed all five classes to every teacher; non-existent `10-Maths-B` / `10-Science-B` appeared in the class switcher; custom classes saved in the browser were shown to every teacher; Create Class allowed any grade/stream and re-using an existing section id.
10. Board Paper studio offered other subjects' papers (and a Physics paper to Biology, which has no board-paper blueprint).
11. Scan Paper Sheets always graded "Aryan Sharma" (a Class 12 Physics student) for every teacher and sent subject "Physics".

**Data not updating / fabricated data**
12. Publishing a test inserted fabricated results (44 attempts, invented students and scores) into Class Progress and copied the test into 12-NonMed.
13. Class Progress, Assigned Tests and Rosters never showed real tests or real student submissions (demo arrays only), so a student's submission never reached the teacher.
14. Student "Record of Previous Tests" was 4 hardcoded HTML rows.
15. Analytics reported a hardcoded class size of 32 (12-NonMed has 8 students).
16. Class switcher cards showed made-up enrolment counts (44, 45, 48 students).

**Seed data**
17. `asgn_10_sci_01` (Class 10 Science test) had section `Science-A` (no such class), and its 6 seeded submissions used the student ids of six Class 12 Non-Medical students under other names, which leaked a Class 10 test into Aryan's history and senior students into Class 10 analytics.
18. Class 10 Mathematics faculty defaulted to `10-Maths-A`, a section with no students or tests; all Class 10 data lives in `10-Science-A`.

### Backend repository (`backend/`)
**New file**
- `src/services/subjectScope.js`: single source of truth for teacher scope, derived from each class's `subjects` list (Physics/Chemistry: 11-12 Medical + Non-Medical; Mathematics: 11-12 Non-Medical; Biology: 11-12 Medical; CLASS10_*: Class 10 sections). Exposes `studentInScope`, `assessmentInScope`, `checkTeacherWrite`, `classTeachesSubject`, `allowedGrades`, `allowedSections`.

**Modified files**
- `src/routes/curriculum.js`: imports `subjectScope`; `/students` filters by scope (fixes 1); `/generate-test` returns 403 for out-of-scope `teacherSubjectKey` writes and 400 when the class does not study the subject (fixes 4).
- `src/routes/assessments.js`: imports `subjectScope`; `GET /` honours `teacherSubjectKey`/`subjectKey` with subject + class/grade scope and exact class matching (fixes 2); `unit-test/generate-draft` and `board-paper/generate` validate `teacherSubjectKey` (fixes 4).
- `src/routes/analytics.js`: imports `subjectScope`; class-dashboard is scoped with no cross-subject fallback, 403 for out-of-scope `assessmentId`, scoped dropdown list, empty state when a subject has no tests (fixes 3); enrolled count is the real class size (fixes 15); new `GET /api/analytics/student/:id/submissions` returns a student's own-class submissions (fixes 14).
- `src/config/database.js`: `asgn_10_sci_01` section set to `10-Science-A`; its submissions remapped to the four real Class 10 students (Rohit Verma, Aditya Chauhan, Tanvi Sood, Nikhil Rana) and the two extra mismatched rows removed (fixes 17); Class 10 Mathematics faculty `defaultClass` set to `10-Science-A` (fixes 18).
- `scripts/test_class_progress_dashboard.js`: expects 4 Class 10 Science submissions (one per enrolled student) instead of 6.

### Frontend repository (`frontend/`)
**Modified files**
- `js/app.js`:
  - New live class sync (`syncTeacherClassDataFromBackend`, `refreshTeacherLiveViews`, `buildRecordedTestFromBackend`) builds Recorded Tests, Assigned Tests and Rosters from `/api/assessments`, `/api/analytics/class-dashboard` and `/api/curriculum/students` scoped to the teacher; runs on teacher sign-in and whenever Class Progress / Create Test opens (fixes 6, 13).
  - Strict scoping helpers `getScopedRecordedTests`, `findScopedRecordedTest`, `getScopedRoster`; all `12-NonMed` / other-subject fallbacks removed from `renderClassProgressDashboard`, `renderRecordedTestsTable`, `viewTestReportDetail`, `renderClassRoster` and two report views (fixes 7, 8). Clearer empty state when a class has no tests.
  - Publish no longer fabricates results or duplicates into 12-NonMed; it re-syncs real data (fixes 12).
  - Student portal: `ACTIVE_STUDENT_PROFILE` (Aryan Sharma, 12-NonMed); assigned tests requested with `classId` and filtered to the student's class (fixes 5); new `loadStudentPreviousTests()` + `updateStudentCompletedCounters()` render Previous Tests from real submissions, refreshed after each submit (fixes 14).
  - `FACULTY_SUBJECT_CLASSES` aligned with backend scope, without hardcoded counts; class switcher cards built from it with real roster counts; drawer class dropdown restricted (`restrictDrawerClassScope`); `switchFacultyClassScope` rejects out-of-scope classes; custom classes filtered by creator subject; Create Class limited to the teacher's grades/streams and rejects existing section ids (fixes 9, 16).
  - Board Paper studio subject options restricted (`restrictStudioSubjectOptions`); Full Board Paper mode disabled for subjects without a blueprint (`teacherHasBoardPaper`) (fixes 10).
  - Scan Paper Sheets: `handwrittenState` + `populateHandwrittenStudentSelect()`; upload sends the selected student id, teacher subject and `teacherSubjectKey`; prompts and toasts name the selected student (fixes 11).
  - `teacherSubjectKey` is sent with generate-draft, both generate-test calls and board-paper generate.
- `index.html`: Scan Paper Sheets header now has a "Student" selector (`#selectHandwrittenStudent`) instead of the fixed "Student: Aryan Sharma" line.
- `js/dualModeEngine.js`: Full Board Paper option also respects `teacherHasBoardPaper()`.

### Line-ending repair
The previous entry's Python edits had converted these Windows (CRLF) files to LF: `backend/database/schema.sql`, `backend/database/seed_data.sql`, `backend/package.json`, `backend/src/server.js`, `backend/src/routes/questions.js`, `backend/src/routes/assessments.js`, `frontend/index.html`. All restored to CRLF (content unchanged), so Git diffs only show real changes. Every file written in this entry keeps its original line endings.

### Verification Results (Post-Final Edit)
- Headless Chrome explorer (1440x900), all 6 faculty + student + principal, Board and Competitive modes: final runs 0 JS errors, 0 HTTP 4xx/5xx, 0 bad text, 0 cross-subject data. Remaining items are expected: Smartboard iframe polling aborted on navigation (not modified), WhatsApp links opening, and native confirm/prompt dialogs.
- End-to-end flow: Physics teacher publishes to 12-NonMed, the test appears in Assigned Tests and Recorded Tests (real 0/8, then 1/8 after submit); roster shows the real 8 students; Biology teacher sees only Biology; student sees only 12-NonMed tests; student Previous Tests goes 1 to 2 after submitting.
- API isolation (all 6 subjects): students, tests and analytics stay in scope; cross-subject analytics 403; cross-subject test creation 403; Biology into 12-NonMed 400.
- Backend: `test_dual_mode_registry.js` 34/34, `test_evaluator.js` 8/8, `test_board_paper_generator.js` passed, `test_class_progress_dashboard.js` 45/45, `test_latex_rendering_and_options.js` passed, `test_subject_isolation_and_teacher_workflow.js` 6/6, `test_end_to_end_assignment_flow.js` 7/7.
- Frontend: `test_static_guards.js` passed (0 bare APIs, 0 sibling paths, 0 added emojis), `test_buttons.js` 100% bound, `test_intuitive_solution_card.js`, `test_latex_formatter.js`, `test_latex_rendering.js` passed.
- Pre-existing failures, unchanged and not caused by this work: `test_teacher_auth_and_class_management.js` (expects Biology default class 11-Med; data uses 12-Med) and `test_class10_sync_and_banks.js` (expects 1 class for Class 10 Maths; data has 10-Science-A and 10-Maths-A). Both failed identically on the code before this entry.

### How to Revert
- **Full revert:** copy everything inside `_revert_backups/2026-11-16_bugfix-isolation-live-data/` back over the workspace root (paths preserved; PowerShell: `Copy-Item -Recurse -Force _revert_backups\2026-11-16_bugfix-isolation-live-data\* .`), then delete `backend/src/services/subjectScope.js`.
- **Seed only:** restore `backend/src/config/database.js` from that folder.
- Line-ending repairs are content-neutral and need no revert.

---

## [2026-11-16 17:56] Multi-Tenant Dual-Mode Architecture (Board vs Competitive): Tenant Registry, Exam Pattern Templates, Module Registry & Header Mode Switcher

Implemented the `multi-tenant-dual-mode-architecture.md` blueprint across both standalone repositories. Schools are now defined by JSON profiles (no code changes per school); Board vs Competitive mode, the board/stream sub-selector, the visible workspace tabs, exam scoring patterns and the new workspace tools are all driven by registry data served by the backend. The AI Smartboard feature was not modified. `frontend/js/app.js` was not modified.

### Backend repository (`backend/`)

**New files**
- `src/registry/tenants/sch_unisole_001.json`: HAPS school profile (activeModes BOARD + COMPETITIVE; boards CBSE, HP_BOARD, ICSE; streams JEE, NEET; per-mode feature flags; DPP settings; Competitive limited to Classes 11-12).
- `src/registry/tenants/sch_demo_board_only.json`: sample second tenant (Board only, CBSE, Class 10, Scan Sheets off, DPP homework on) proving zero-code multi-tenancy.
- `src/registry/templates/exam_patterns.json`: Exam Pattern Template Registry (CBSE_BOARD, HP_BOARD, ICSE_BOARD [contentStatus NO_CONTENT], JEE_MAIN, NEET_UG) with sections, marking (+4/-1 competitive, step marking board), blueprint references, assessment board aliases, CBSE->HP_BOARD content alias, and indicative rank curves (capped at 99.99 percentile).
- `src/registry/workspace_tabs.json`: Workspace Tab Registry (teacher + student) mapping tabs to core tab containers or modules, with per-mode labels, icons and feature flags (e.g. `scanSheets` uses `featureFlags.scanPaperSheets`, so it is hidden in Competitive).
- `src/services/tenantConfigService.js`: loads/validates tenant profiles; resolves the school per request (`x-school-id` header > `?schoolId=` > Host subdomain > `DEFAULT_SCHOOL_ID` > `sch_unisole_001`); resolves and validates mode/board/stream/grade context; filters tabs by feature flags; builds the public tenant view.
- `src/services/examPatternRegistry.js`: pattern lookup by context or assessment board string, negative-penalty resolution, board content aliasing, indicative percentile/rank estimation.
- `src/services/canonicalContentService.js`: projects all subject-bank questions onto the `curriculum_content` model (`target_modes`, `board_targets`, `competitive_targets`, `content_type`, `year_tags`, `mcq_options`, `rubric_steps`). Class 11/12 board MCQs are also offered to Competitive practice and tagged `competitive_source = DERIVED_BOARD_MCQ`.
- `src/modules/index.js`, `src/modules/shared.js`: Module Registry and shared helpers (subject isolation via `teacherSubjectKey`, taxonomy chapters, chapter-to-question matching).
- `src/modules/dpp.js`: Daily Practice Problems (deterministic daily set per date/school/mode/track/subject/grade, 10-15 questions, NTA marking in Competitive, streak tracking in `inMemoryStore.dppAttempts`, chapter-wise PYQ summary, pool-shortfall warning).
- `src/modules/roadmap.js`: Board Term-1 / Term-2 / Pre-Board milestones; Competitive chapter weightage ranking (strict blueprint topic matching, high-yield topics, PYQ density, unit weightage) with a week-by-week countdown drill plan.
- `src/modules/cheatsheets.js`: Board definition/derivation/concept flashcards; Competitive formula sheets, formula repository quick bank with sign rules, and chapter traps.
- `src/modules/ncertCore.js`: NCERT section-wise topics, board focus, NCERT/exemplar sample questions; Competitive adds edge-case traps from focus notes and MCQ distractors.
- `src/modules/rankAnalytics.js`: Predictive Rank Analytics from recorded JEE/NEET-pattern submissions (indicative percentile, rank band, distribution, focus topics).
- `src/routes/tenant.js`: `GET /api/tenant/config`, `GET /api/tenant/workspace`, `GET /api/tenant/list`, `GET /api/templates/exam-patterns`, `GET /api/templates/exam-patterns/:patternId`.
- `src/routes/content.js`: `GET /api/content` (canonical dual-mode library with `mode`, `board`, `stream`, `subjectKey`, `grade`, `chapter`, `contentType`, `difficulty`, `yearTag`, `search`, `objectiveOnly`, `ncertOnly`, `includeSolutions`), `GET /api/content/stats`.
- `src/routes/modules.js`: `GET /api/modules`, `GET /api/modules/:moduleId`, `POST /api/modules/dpp/submit`, `GET /api/modules/dpp/streak` with tenant/mode/grade/feature-flag/role gating.
- `scripts/test_dual_mode_registry.js`: 34-check in-process suite (registry loading, tab filtering, zero-code second tenant, patterns, canonical content, all 5 modules, gating, subject isolation, DPP determinism/scoring/streak, registry-driven assessment scoring).
- `scripts/sync_curriculum_content.js`: upserts tenant profiles into `schools` and all canonical rows into `curriculum_content` (`--dry-run` supported).

**Modified files**
- `src/server.js`: requires and mounts `routes/tenant` at `/api`, `routes/content` at `/api/content`, `routes/modules` at `/api/modules` (added after the voice-tutor mount).
- `src/routes/assessments.js`: imports `examPatternRegistry`; `POST /:id/submit` now takes negative marking from the resolved exam pattern (explicit `assessment.negativeMarks` still wins; old JEE/NEET string check kept as last fallback). Results add `examPatternId` and `negativeMarkingApplied`. Scores for existing CBSE/JEE/NEET assessments are unchanged.
- `src/routes/questions.js`: imports `canonicalContentService`; adds `applyModeFilter()`. `GET /api/questions` and `GET /api/questions/subject-banks/:subjectKey` accept `?mode=BOARD&board=...` / `?mode=COMPETITIVE&stream=...`. Without `mode` the legacy `board` substring filter behaves exactly as before.
- `database/schema.sql`: drops/creates `schools`, `curriculum_content` (with `idx_curriculum_lookup` GIN index on `target_modes, board_targets, competitive_targets` and `idx_curriculum_subject_chapter`) and `dpp_attempts`.
- `database/seed_data.sql`: inserts the two school rows.
- `package.json`: adds `test:dual-mode` script.
- `.env.example`: adds `DEFAULT_SCHOOL_ID=sch_unisole_001`.
- `.github/workflows/ci.yml`: `unit-integration` runs `npm run test:dual-mode`; `postgres-integration` runs `node scripts/sync_curriculum_content.js` after schema and seed.
- Docs: `README.md`, `INTERN_ONBOARDING_GUIDE.md` (new section 11, 15-table summary, test commands), `ARCHITECTURE_EXCALIDRAW_MERMAID.md` (Diagram 6 + file rows), `TASKS.md` (TASK-22).
- Side effect only: `src/database/custom_injected_questions.json` was re-saved by the existing test suites during verification. Content is identical (same 3 Physics questions from 2026-11-12, 8,867 bytes); only its timestamp changed.

### Frontend repository (`frontend/`)

**New files**
- `js/dualModeEngine.js`: loads `GET {API}/api/tenant/config`, renders the header Mode pill (Board Exam / Competitive Prep) and track chips (CBSE / HP Board / ICSE or JEE / NEET) as accessible radiogroups with arrow-key support; hides/relabels teacher drawer cards from tenant tabs (Scan Paper Sheets hidden and "Create NTA Test" label in Competitive; Question Bank becomes "Question Bank (PYQ + Exemplar)" in Board); hides the Full Board Paper option in Competitive or ICSE; syncs the Board Paper Studio board to CBSE/HP Board; lists mode tools in a new drawer section; renders the Module Workspace for DPP, Roadmap, Cheat Sheets, NCERT Core and Rank Analytics with race guards; disables Competitive for Class 10 and limits Medical to NEET, Non-Medical to JEE; passes `teacherSubjectKey` for subject isolation; exposes `window.HapsDualMode` and a `haps:modechange` event; persists choice in `localStorage.haps_dual_mode_v1`; optional school selection via `window.HAPS_SCHOOL_ID`, `?schoolId=` or `localStorage.haps_school_id`. If the backend is unreachable the bar stays hidden and the portal behaves as before.
- `css/dual-mode.css`: token-only styles for the mode bar, drawer tool cards and Module Workspace (light/dark, focus-visible rings, 44px targets, 360px-safe grids, reduced motion, print).

**Modified files**
- `index.html` (no existing markup removed or changed):
  1. `<link rel="stylesheet" href="css/dual-mode.css?v=1.0">` after `styles.css`.
  2. New drawer section `#drawerSectionModeTools` (2C) before "3. ACTIVE CLASS SCOPE".
  3. New `#modeSwitchBar` section directly after `<main class="main-wrapper">`.
  4. New `#tabModuleWorkspace` (`.teacher-tab-content`) at the end of `#teacherView`.
  5. New `#tabStudentModuleWorkspace` (`.student-tab-content`) at the end of `#studentView`, after the unchanged `#tabStudentSmartboard`.
  6. `<script src="js/dualModeEngine.js?v=1.0"></script>` after `js/app.js`.
- Runtime only: the old drawer list `#drawerSectionTracks` (Board / JEE / NEET) is hidden by the engine with class `dm-hidden` because the header switch supersedes it; its markup is kept.
- Docs: `README.md`, `INTERN_ONBOARDING_GUIDE.md`, `ARCHITECTURE_EXCALIDRAW_MERMAID.md`, `TASKS.md` (TASK-22).

### Root workspace
- `README.md`: dual-mode summary. `log.md` (this entry, identical in all three logs).
- `_revert_backups/2026-11-16_dual-mode-architecture/`: pre-change copies of every existing file touched above (25 files, original relative paths). Not part of either repository.

### Content Coverage Note
1,029 canonical questions: CBSE 1,026, HP Board 1,028 (NCERT-aligned alias), ICSE 0, JEE 397, NEET 511. Only 152 questions are natively tagged JEE/NEET; 379 Class 11/12 board MCQs are offered as Competitive practice (`DERIVED_BOARD_MCQ`, shown as "Board MCQ" in the UI). JEE Chemistry (1) and JEE Mathematics (2) have too few objective questions for a full DPP, and the DPP shows a warning for them. ICSE is enabled and visible but shows a "no content loaded" state everywhere.

### Verification Results (Post-Final Edit)
- `backend/`: `npm run test:dual-mode` 34/34; `test_evaluator.js` 8/8; `test_board_paper_generator.js` passed; `test_class_progress_dashboard.js` 45/45; `test_latex_rendering_and_options.js` passed; `test_math_question_bank.js` passed; `test_subject_remedial_pipeline.js` 31/31; `test_personalized_remedial_flow.js` passed; `verify_staging.js` 13/14. The failing check (voice tutor `audioDataUri`) needs outbound internet for Microsoft Edge TTS and fails identically in both sandboxes; voice tutor code was not touched.
- `frontend/`: `npm test` passed; `npm run test:latex` passed; `test_screenshot_case.js` passed; `test_quiz_creation_and_modal_display.js` 32/32; `test_static_guards.js` passed (0 bare APIs, 0 sibling paths, 0 added emojis).
- PostgreSQL 16: `schema.sql` + `seed_data.sql` applied with `ON_ERROR_STOP`; `sync_curriculum_content.js` upserted 2 schools and 1,029 rows (idempotent re-run); `EXPLAIN` confirms `idx_curriculum_lookup` bitmap index scan for mode/stream filters.
- Headless Chrome (1440x900, 360x800, light + dark): mode/track switching, tab hiding/relabeling, all 5 tools render (0 `.katex-error`), DPP submit (+4/-1) and PYQ expand, ICSE empty state, HP Board studio sync, Class 10 Competitive disabled with reason, student tools, Smartboard still opens and hides the workspace, Principal view hides the bar, arrow-key radiogroup navigation, `scrollWidth === 360` with 0 overflow offenders on every tool, mode buttons 52px and track chips 44px tall, 0 application console errors.

### How to Revert
- **Full revert:** copy everything inside `_revert_backups/2026-11-16_dual-mode-architecture/` back over the workspace root (paths are preserved; PowerShell: `Copy-Item -Recurse -Force _revert_backups\2026-11-16_dual-mode-architecture\* .`), then delete the new files:
  - `backend/src/registry/` (folder), `backend/src/modules/` (folder), `backend/src/services/tenantConfigService.js`, `backend/src/services/examPatternRegistry.js`, `backend/src/services/canonicalContentService.js`, `backend/src/routes/tenant.js`, `backend/src/routes/content.js`, `backend/src/routes/modules.js`, `backend/scripts/test_dual_mode_registry.js`, `backend/scripts/sync_curriculum_content.js`
  - `frontend/js/dualModeEngine.js`, `frontend/css/dual-mode.css`
- **Frontend-only switch-off:** remove the `js/dualModeEngine.js` script tag from `frontend/index.html`. The mode bar and tool section stay hidden and the portal behaves exactly as before.
- **Backend-only switch-off:** remove the three `app.use('/api' ...)`, `app.use('/api/content' ...)`, `app.use('/api/modules' ...)` lines in `backend/src/server.js`. Assessment scoring falls back to the previous JEE/NEET string rule automatically if `examPatternRegistry` is removed together with its import.

---

## [2026-11-13 20:25] Independent Standalone CI/CD Pipelines, Dependabot & Decoupled Repository Verification

Architected and implemented enterprise-grade, independent GitHub Actions CI/CD pipelines and Dependabot security configurations for the decoupled `backend/` and `frontend/` repositories with zero root-level `.github/` dependencies and strict decoupling.

### Deliverables Created & Configured
- **Backend Automation (`backend/.github/`):**
  - `backend/.github/dependabot.yml`: Automated weekly dependency vulnerability scans for `npm`, `docker`, and `github-actions` with `chore(deps)` commit prefix.
  - `backend/.github/workflows/ci.yml`: 7 discrete jobs on Node 20 with least-privilege permissions, concurrency controls (`cancel-in-progress: true`), and timeouts:
    1. `unit-integration`: Executes `npm test`, `npm run test:board-paper`, `npm run test:progress`, and `node scripts/test_latex_rendering_and_options.js`.
    2. `live-server`: Boots `src/server.js` on port 5050 with in-memory fallback, polls `/api/health` with a 30s timeout, runs `npm run test:math-bank` and `node scripts/verify_staging.js http://localhost:5050`, and uploads `server.log` artifact on failure.
    3. `postgres-integration`: Spins up a `postgres:16-alpine` service container, installs `postgresql-client`, applies `database/schema.sql` and `database/seed_data.sql`, starts the server with `DATABASE_URL`, and validates live `/api/health`.
    4. `network-integration`: Runs `node scripts/test_voice_tutor_hinglish.js` non-blockingly (`continue-on-error: true`). Excludes real messaging script `test_real_whatsapp_dispatch.js`.
    5. `security-scan`: Runs `npm audit --audit-level=high` and Gitleaks secret detection (`gitleaks/gitleaks-action@v2`).
    6. `codeql-analysis`: Static application security testing (SAST) for JavaScript/Node.js (`github/codeql-action@v3`).
    7. `docker-build-smoke`: Multi-stage Buildx image compilation with GitHub Actions layer cache (`type=gha`), runs container, tests `/api/health`, and scans for HIGH/CRITICAL vulnerabilities with Trivy (`aquasecurity/trivy-action@0.28.0`).
  - `backend/.github/workflows/cd.yml`: Release deployment pipeline on version tags `v*.*.*` and manual `workflow_dispatch` (target environment input: `staging` or `production`):
    - Builds and pushes multi-platform image to GitHub Container Registry (`ghcr.io/${{ github.repository }}`).
    - `deploy-staging`: Automatic staging deployment with clearly defined inputs (`IMAGE_REF`, `DATABASE_URL`, `CORS_ORIGIN`, `FRONTEND_URL`, `PORT`, `JWT_SECRET`) and post-deploy gate `node scripts/verify_staging.js <DEPLOYED_URL>`.
    - `deploy-production`: Manual approval gate via GitHub Environment `production`, post-deploy verification gate, and detailed rollback runbooks.
- **Frontend Automation (`frontend/.github/`):**
  - `frontend/.github/dependabot.yml`: Automated weekly dependency scans for `npm` and `github-actions`.
  - `frontend/.github/workflows/ci.yml`: 6 discrete jobs on Node 20:
    1. `build-and-test`: Executes `npm test` (buttons & solution card), `npm run test:latex` (KaTeX), `node scripts/test_screenshot_case.js` (headless LaTeX validation), `npm run build:whiteboard` + `git diff --exit-code vendor/tldraw/tldraw-standalone.bundle.js` (bundle diff check), and `node scripts/test_static_guards.js` (guards against bare `/api/` fetch calls, hardcoded `../../` sibling paths, and newly added PR emojis).
    2. `server-smoke-test`: Starts `server.js` on port 3008, validates `/` and `/whiteboard` return HTTP 200, and uploads logs on failure.
    3. `playwright-overflow-check`: Non-blocking job (`continue-on-error: true`) running `node scripts/test_overflow_viewports.js` against 360px, 768px, 1024px, and 1440px viewports.
    4. `live-backend-integration`: Dispatched via `workflow_dispatch` with a `backend_url` input pointing at a deployed staging backend (executes `node scripts/test_quiz_creation_and_modal_display.js` without checking out backend repo).
    5. `security-scan`: Runs `npm audit --audit-level=high` and Gitleaks secret detection.
    6. `codeql-analysis`: Static code analysis for JavaScript and HTML.
  - `frontend/.github/workflows/cd.yml`: Release packaging and deployment pipeline on tags `v*.*.*` and manual dispatch:
    - Packages static release archive `haps-frontend-<tag>.tar.gz` and conditionally pushes container if Dockerfile is added.
    - `deploy-staging`: Deploys to staging web host, injects `window.HAPS_API_BASE` dynamically at deploy time, and runs HTTP 200 smoke test.
    - `deploy-production`: Regulated deployment with manual approval gate via GitHub Environment `production`.
- **Scripts & Repository Hardening:**
  - `frontend/scripts/test_overflow_viewports.js`: Responsive layout test validating `scrollWidth <= innerWidth` across standard viewports.
  - `frontend/scripts/test_static_guards.js`: AST/regex guard verifying 0 bare `/api/` fetches, 0 `../../` sibling paths across 20 source files, and diff-based emoji detection for incoming commits.
  - `backend/scripts/test_class_progress_dashboard.js`: Updated lines 82–94 assertions to match pre-seeded 8 submissions and 4 question analytics.
  - `backend/scripts/verify_staging.js`: Updated Test 8 to accept decoupled JSON backend service descriptors (`mode: standalone-backend`) alongside HTML shells, and suppressed `vercel curl` fallback for localhost URLs.
  - `backend/Dockerfile`: Aligned default exposed port to `5050`.
  - `frontend/vendor/tldraw/tldraw-standalone.bundle.js`: Recompiled and synchronized with `src_whiteboard/index.jsx`.
- **Documentation Updated:**
  - `backend/README.md`, `backend/INTERN_ONBOARDING_GUIDE.md`, `backend/TASKS.md` (added TASK-21).
  - `frontend/README.md`, `frontend/INTERN_ONBOARDING_GUIDE.md`, `frontend/TASKS.md` (added TASK-21).

### Local Command Verification Results
All CI commands were executed locally in the exact pipeline sequence and passed cleanly:
- `backend/`:
  - `npm test`: 8/8 tests passed (in-memory NCERT/PYQ fallback verified).
  - `npm run test:board-paper`: 6/6 tests passed (CBSE/HPBOSE papers and question mutations verified).
  - `npm run test:progress`: 45/45 tests passed across Class 10 Math, Class 10 Science, Biology, and Physics.
  - `node scripts/test_latex_rendering_and_options.js`: 2,528 options and 4 assessments verified.
  - `npm run test:math-bank`: 438 questions and all chapter filters verified.
  - `node scripts/verify_staging.js http://localhost:5050`: 14/14 checks passed (`GATE APPROVED`).
- `frontend/`:
  - `npm test`: 202/202 static buttons bound + Solution Card engine verified.
  - `npm run test:latex`: 4 display + 3 inline KaTeX math blocks verified.
  - `node scripts/test_screenshot_case.js`: 5/5 display equations rendered in headless Node environment.
  - `npm run build:whiteboard` + `git diff --exit-code`: 0 diff; compiled bundle matches committed source.
  - `node scripts/test_static_guards.js`: 0 bare APIs, 0 sibling paths, 0 added emojis across 20 source files.
  - `server.js` route smoke test: `GET /` (200), `GET /whiteboard` (200) verified.

---

## [2026-11-12 17:07] Student AI Whiteboard Controls, Class-Scoped Topic Search & Ask-Any-Doubt Studio

Rebuilt the Student AI Smartboard tab (`#tabStudentSmartboard`) from a placeholder iframe view into a complete interactive learning and live doubt-resolution workspace, verified across Desktop (`1440x900`) and Mobile (`360x800`) Chrome viewports.

### Changes Implemented
- **Student AI Smartboard UI & Responsive Layout (`frontend/index.html`, `frontend/css/styles.css`):**
  - Replaced the bare iframe box inside `#tabStudentSmartboard` with a complete control bar and split studio layout:
    - **Class, Subject & Topic Finder (`#studentWbTopicControls`):** Class selector (`#selectStudentWbClass`: Class `10`, `11`, `12`), dynamic class-scoped Subject selector (`#selectStudentWbSubject`), live keyword Topic Search (`#inputStudentWbTopicSearch`, `#btnStudentWbClearSearch`), Chapter-prefixed Topic dropdown (`#selectStudentWbTopic`, e.g., `Ch 1 - ...`), clickable filtered topic chips (`#studentWbTopicChips`), and `"Teach Topic"` action (`#btnStudentWbTeachTopic`).
    - **Whiteboard Playback & Canvas Controls (`#studentWbCanvasToolbar`):** Wired `Prev Step`, `Pause / Play`, `Next Step`, `Full Board`, `Zoom Fit`, `Clear Board`, `Listen AI`, `Live Class`, `Refresh Board`, and Voice Persona selector (`#selectStudentWbVoice`: Swara, Madhur, Neerja, Prabhat) directly to `#studentWbIframe` (`/whiteboard.html?role=student`).
    - **Synchronized Step Cards & Ask-Any-Doubt Studio (`#studentWbSyncedCards`, `#studentWbDoubtSection`):** Added readable KaTeX Step 1–3 derivation cards + Exam Tip below the board and a dedicated **Ask Any Doubt** chat studio with quick doubt chips (`.student-wb-quick-doubt-btn`), voice-to-text microphone input (`#btnStudentWbMic`), Hinglish/English AI responses (`#btnStudentWbAskDoubt`), per-reply `"Listen"` replay, and `Clear Chat` (`#btnStudentWbClearDoubts`).
  - Added responsive CSS rules including `<= 768px` single-column stacking, `0` horizontal overflow at `360x800`, and `>= 36px` mobile touch targets on `.student-wb-topic-chip` and `.student-wb-replay-reply`.
- **Smartboard Controller & Race-Safety (`frontend/js/app.js`, `frontend/whiteboard.html`):**
  - Added `studentSmartboardState` and `initStudentSmartboardWorkspace()` (auto-initialized from `switchStudentTab('tabStudentSmartboard')` plus top-level `WHITEBOARD_READY` handshake) with `topicsRequestId`, `teachRequestId`, and `doubtGenerationId` request/generation guards preventing stale async responses on rapid Class switching or `Clear Chat`.
  - Extended `frontend/whiteboard.html` `message` listener to handle `NEXT_CONCEPT`, `PREV_CONCEPT`, `TOGGLE_PACING`, `SHOW_ALL_CONCEPTS`, `CLEAR_BOARD`, and responsive `resize` redraws.
- **Voice Tutor JSON Model Chain & Context-Aware Doubts (`backend/src/routes/voiceTutor.js`, `backend/src/services/aiVoiceTutorService.js`):**
  - Updated `/api/voice-tutor/interrupt` and `answerStudentInterruption()` to accept Class/Subject/Chapter/Topic context and extracted shared `callVoiceTutorJsonModel()` prioritizing active Groq model `openai/gpt-oss-20b` (`~1.2s` JSON latency) with `openai/gpt-oss-120b` and `gemini-2.5-flash` fallbacks, plus optics/sign-convention fallback logic.

### Verification Results (Post-Final Edit)
- **Live Chrome `1440x900` & `360x800` QA (`http://localhost:3008` + `http://localhost:5050`):**
  - Class/Subject scoping verified (`42` Physics, `32` Chemistry, `35` Maths, `38` Biology in Class 12; `21` Physics in Class 11; `40` Science & `43` Maths in Class 10), keyword search (`"mirror"`, `"gauss"`), tldraw smartboard rendering (`11–13` shapes), all playback/clear/fit buttons, AI Hinglish doubt answers + KaTeX (`0` `.katex-error`), rapid Class-switch race guard, `Clear Chat` in-flight cancellation, mobile `360x800` (`scrollWidth === 360`, `.student-wb-topic-chip` `36px`, `.student-wb-replay-reply` `42.4px`), and `0` console errors.
- **Automated Suites:**
  - `frontend/`: `npm test` (`202/202` static buttons bound + Solution Card engine), `npm run test:latex`, `node scripts/test_screenshot_case.js`, and `node scripts/test_quiz_creation_and_modal_display.js` (`32/32`) all exited `0`.
  - `backend/`: `test_evaluator.js` (`8/8`), `test_board_paper_generator.js` (`6/6`), and `test_latex_rendering_and_options.js` (`2,528` options + 4 assessments) passed; live HTTP `/api/voice-tutor/interrupt` responded in `1235ms` (`GROQ_OPENAI/GPT-OSS-20B`).

---

## [2026-11-12 16:20] Full E2E Functional Audit, 14 Bug Fixes & Desktop/Mobile Chrome Verification

Conducted a full Desktop (`1440x900`) and Mobile (`360x800`) interactive QA pass across `http://localhost:3008` and `http://localhost:5050`, resolved all 14 functional, data, Board Paper, Voice Tutor, Remedial Routing, WhatsApp encoding, KaTeX DOM corruption, and portal synchronization defects, restarted the backend daemon (`node backend/src/server.js`), and re-verified every fix in live Chrome and automated suites.

### Fixes Implemented
- **Form Validation, Assigned Test Filter & Finalize Score Banner (`frontend/index.html`, `frontend/js/app.js`):**
  - Escaped hyphen in HTML5 `pattern="[0-9\s+\-]{10,15}"` on `#inputGatewayTeacherPhone` (`frontend/index.html`) for strict `/v` RegExp compatibility.
  - Normalized `'SCHEDULED' || 'UPCOMING'` status matching in `renderAssignedTestsTable()` (`frontend/js/app.js`) so the `Scheduled` filter pill count matches filtered rows.
  - Added `#liveTestStatusBadge` and `#liveTestSubmissionsPercent` (`frontend/index.html`) and updated `finalizeCurrentTest()` to set `#liveTestSubmissionsCounter` to `'48 / 48'`, `'Students Submitted (100%)'`, and `'FINALIZED & GRADED'`.
- **Voice Tutor Ephemeral Endpoint & Headless Fallback (`backend/src/routes/voiceTutor.js`, `frontend/js/geminiLiveVoiceTutor.js`, `frontend/js/app.js`):**
  - Updated `GoogleGenAI` client and WebSocket URL in `/api/voice-tutor/gemini-live-token` to `apiVersion: 'v1alpha'` (`v1alpha.GenerativeService.BidiGenerateContentConstrained`) as required for ephemeral auth tokens.
  - Updated `socket.onerror` and `socket.onclose` in `GeminiLiveVoiceTutorEngine` to reject pending setup promises cleanly (`console.warn` instead of `console.error`), and added automatic fallback to the Studio Neural Voice Tutor (`speakWithVoiceEngine()` + smartboard pacing) in `startRealtimeVoiceAssistant()` when live socket/mic access fails.
- **Board Paper Studio Blueprints, Section A 1-Mark Validation & Mode 2 Sync (`backend/src/services/boardPaperGeneratorService.js`, `frontend/js/app.js`):**
  - Added `CBSE_CLASS_12_MATHS` (80M, 38 Qs) and `HP_BOARD_CLASS_12_MATHS` (80M, 34 Qs) blueprints plus senior Mathematics question pools; enforced strict grade isolation in `getSubjectQuestionsPool()`.
  - Added `inferQuestionMarks()` and `isMatchingBoardMarks()` across paper generation and swap candidate lookups so Section A 1-Mark MCQ slots only accept 1-mark MCQs with 4 options (excluding 2M/3M/5M derivations even when options exist) and deduplicated custom questions in `addCustomQuestionToPaper()`.
  - Fixed `openAddCustomQuestionModal()` (preserving `preselectedSectionId` after `form.reset()`, syncing `#selectCustomQMarks` and `#groupCustomQOptions` on initial open and section change) and `submitAddCustomQuestion()` (preserving entered options A-D).
  - Updated `switchPaperCreationMode('board_paper')` and `applyTeacherProfile()` (checking `state.activePaperCreationMode === 'board_paper'` and DOM panel visibility) to sync subject/grade/board immediately and regenerate stale papers when switching faculties even while staying on Mode 2; updated Class 10 Maths header formatting checks (`profSubj.includes('MATH')`) and Mode 2 banner copy.
- **Class Test Report Tier Counts & Clean UTF-8 WhatsApp Payloads (`frontend/js/app.js`, `backend/src/routes/notifications.js`):**
  - Computed `All`, `Excellent`, `Average`, and `Below Avg` tier filter counts dynamically from `test.studentResults` inside `viewTestReportDetail()` so counts sum cleanly to the rendered rows.
  - Added `sanitizeWhatsAppPayload()` (stripping `\uFFFD`, broken surrogate/emoji characters, and box-drawing glyphs) across `formatWhatsAppDossierText()`, `shareStudentReportWhatsApp()`, `formatWhatsAppText()`, `dispatchWhatsAppMessage()`, `sendRosterStudentWhatsApp()`, `#btnSendDirectWhatsApp`, and `backend/src/routes/notifications.js`.
- **Safe TreeWalker KaTeX Renderer, Student Exam Sync, Remedial Routing & Studio Modal (`frontend/js/app.js`, `frontend/index.html`, `backend/src/services/remedialAssignmentService.js`):**
  - Replaced destructive `element.innerHTML = renderLatexString(element.innerHTML)` in `renderMathInElement()` with a DOM `TreeWalker` over text nodes (`NodeFilter.SHOW_TEXT`), skipping `SCRIPT`/`STYLE`/`TEXTAREA`/`CODE`/`PRE`/`OPTION`/`.katex`, preserving HTML attributes and live JS click listeners.
  - Moved LaTeX formulas out of inline `onclick="..."` strings in `#tabStudentPreviousTests` and `#tabStudentRemedial` into `data-*` attributes and formatted `#tabStudentRemedial` equations ($\omega_0$, $\omega_d = \sqrt{\omega_0^2 - \gamma^2}$, $a = \frac{g \sin\theta}{1 + I/(MR^2)}$) in KaTeX.
  - Fixed `setupStudentMode()` Socratic hints so active exam questions never fall back to `state.currentQuestion` (Rotational Motion) hints.
  - Expanded `FORMULA_REPOSITORY` and keyword routing in `remedialAssignmentService.js` (isolating `Science` from `Mathematics` and routing optics/mirrors/circuits/capacitors/damped-oscillation items accurately); updated `startAssignedTest()` (`chapter_name`, `solution_latex`, `marks`, `_assignedTestLoaded`), `displayDiagnosticResults()`, and `formatIntuitiveSteps()` to match combined topic/question text cleanly without Physics-to-Biology fallback leaks.
  - Fixed `launchRemedialDrillSheet()` to update `#remHostelDirective` and `#remParentDirective`; wired `#btnStudioBackBtn` and `#btnStudioAssignQuiz` in `openPreviousTestReview()` (`Close Review`, hiding teacher assign button) vs. `openStepSolutionStudio()` (`Back to Question Bank`); auto-hydrated first published test on `loadStudentAssignedTests()` / `switchPortalRole('student')`; appended submitted rows to `#studentPrevTestsTableBody` using `rData.totalScore` and updated completed badges (`#studentCompletedBadgeNav`, `#drawerStudentCompletedBadge`, `#drawerStudentCompletedSub`, `#studentSmartReportTestsCountLabel`, `#studentSmartReportAttemptedSub`, `#studentSmartReportAttemptedBtnLabel`); updated Question Bank drawer badge/subtitle dynamically (`#drawerQbSubtitle`, `#drawerQbCountBadge`).

### Verification Results (Post-Final Edit)
- **Live Chrome `1440x900` & `360x800` QA (`http://localhost:3008` + `http://localhost:5050`):**
  - Verified all 14 bug fixes cleanly across Desktop (`1440x900`) and Mobile (`360x800`) with `0` console errors, `0` uncaught exceptions, `0` `window.alert()` dialogs, `0` `.katex-error`, `0` failed HTTP requests (`>= 400`), and `0` horizontal overflow / rect / scroll offenders (`document.documentElement.scrollWidth === 360` across Mode 2 Board Paper Studio, `#tabStudentPreviousTests`, `#modalStepSolutionStudio`, `#tabStudentRemedial`, `#modalPersonalizedRemedial`, Question Bank Voice Tutor, Custom Q Modal, Class Progress, Exam Simulator, Diagnostic Results, and Weekly Report).
- **Automated Suites (Executed After Final Edits):**
  - `frontend/` (`npm test`, `npm run test:latex`, `node scripts/test_screenshot_case.js`, `node scripts/test_quiz_creation_and_modal_display.js`): all exited `0` (`32/32` live `:5050` API & modal checks passed; `186/186` static buttons + 6 dynamic selectors verified).
  - `backend/`: `test_evaluator.js` (`8/8`), `test_board_paper_generator.js` (`6/6`), `test_personalized_remedial_flow.js`, `test_latex_rendering_and_options.js` (`2,528` options + 4 assessments), `test_subject_remedial_pipeline.js` (`31/31`), and `test_voice_tutor_hinglish.js` verified passing.

---

## [2026-11-12 13:10] Full Mobile Resolution (`360x800`) Frontend Remediation & Live Chrome Verification

Conducted an exhaustive `360x800` live Chrome viewport audit (plus `1440x900` desktop parity check) across `http://localhost:3008` and `http://localhost:3008/whiteboard`, fixed every overflowing grid, modal, card, KaTeX block, voice-tutor form, and HUD overlap, and verified `0` horizontal overflows (`scrollWidth === 360`), `0` element/rect offenders, `0` console errors, and `0` failed network requests.

### Fixes Implemented
- **Global Shell, Top Navbar & Role Gateway (`frontend/index.html`, `frontend/css/styles.css`):**
  - Replaced fixed `height: 54px !important` in `<head>` `<style>` with `min-height: 54px !important; height: auto !important;` so wrapped mobile headers do not collide or overflow, tightened `.top-navbar`/`.header-right`/`#headerRoleBadge`/`.header-faculty-chip` padding and wrapping under `@media (max-width: 768px)`, and bumped `css/styles.css?v=9.0`.
  - Updated `#portalRoleGatewayModal` (`div.brand-logo-badge` `width: auto` for `UNISOLE`, responsive `minmax(min(280px, 100%), 1fr)` / `minmax(min(290px, 100%), 1fr)` grids, single-column stacking under `768px`, and wrapped header/form grids).
- **Teacher Portal Forms, Draft Studio, Board Paper, Analytics & Modals (`frontend/css/styles.css`, `frontend/index.html`, `frontend/js/app.js`):**
  - Fixed `.two-col-form-grid` column collapse (overrode inline `grid-column: span 2` on the marks-weightage row via `.two-col-form-grid > * { grid-column: 1 / -1 !important; }` so column 1 no longer crushes to `17.6px` on mobile) and wrapped `renderUnitTestDraftStudio()` options grids/headers (`1fr`, `min-width: 0`, `overflow-wrap: anywhere`).
  - Contained `.board-paper-studio-body` and `.board-paper-sheet` horizontally (`max-width: 100%; overflow-x: auto;`) for CBSE & HPBOSE A4 previews.
  - Fixed `#modalEditPaperQuestion` (`+6px` overflow from `#selectEditCorrectOpt` `margin-left: 6px` on a `100%`-wide `.form-select`, plus `.responsive-2col-grid` `minmax(0, 1fr)` stacking), `#modalSelectAlternativeQuestion` (`flex-wrap: wrap` + `min-width: 0`), and `#modalInjectQuestion` (`minmax(min(200px, 100%), 1fr)`, wrapped mode tabs & auto-categorization banner).
  - Fixed `#tabClassAnalytics` header pill wrapping and chart grid/card `min-width: 0; overflow: hidden;` containment.
- **Question Bank, KaTeX Equations & Voice Tutor (`frontend/css/styles.css`, `frontend/js/app.js`):**
  - Prevented horizontal expansion inside `.qb-solution-mastercard`, `.qb-solution-concept-box`, `.qb-solution-step-item`, `.sol-step-content`, and `.sol-math-line` (`min-width: 0; max-width: 100%;`) while allowing wide `.katex-display` equations to scroll cleanly inside their containers (`overflow-x: auto`).
  - Wrapped `.qb-voice-brand`, `.qb-voice-actions-row`, and `#voiceInterruptionArea_${qId}` (`#inputVoiceDoubt_*`, `#btnMic_*` "Speak", and "Ask Doubt" buttons stay inside `360px` with `>= 40px` touch height).
- **Director & Student Portals (`frontend/css/styles.css`, `frontend/index.html`, `frontend/js/app.js`):**
  - Added responsive breakpoints for `.grid-4col` (`repeat(2, minmax(0, 1fr))` at `<= 1024px`, `minmax(0, 1fr)` at `<= 768px`), resolving off-screen cards in `#directorView` and crushed `.tier-kpi-card` tiles in `#tabStudentSmartReport`.
  - Refactored `#ntaExamContainer` and `.exam-quick-jump-panel` on mobile so `.quick-question-number-strip` renders as a `38px`-tall horizontally scrollable palette row (`281px` clientWidth / `1194px` scrollable) instead of a `642px`-tall 2-column vertical strip, eliminating `.glass-card` overflow (`336 === 336`).
  - Fixed `#modalDiagnosticResults` (`.diag-modal-header` wrapping so `"Print Report"` & `#btnCloseDiagnosticResults` fit visibly inside `360px`, `minmax(0, 1fr)` KPI & dual directive grids, `.diag-formula-scroll` & scrollable stem wrappers so `#diagReportScrollContainer` measures `314 === 314`, wrapped mastery pills, and `minmax(min(280px, 100%), 1fr)` mastery grid) and `#modalPersonalizedRemedial` (wrapped `#remFormulaDrillsContainer` `"Verify Equation"` row & `1fr` `.remedial-options`).
- **Standalone Interactive Whiteboard (`frontend/whiteboard.html`):**
  - Switched mobile (`<= 768px`) layout to a `100dvh` flex column (`#whiteboard-overlay-badge` -> `#whiteboard-quick-actions` -> `#root` -> `#whiteboard-diagnostic-panel`), overrode tldraw's internal inline `position: fixed; inset: 0;` mount wrapper via `#root > div { position: relative !important; inset: auto !important; }`, raised mobile button targets to `min-height: 36px`, and replaced the clipboard `alert()` in `copyDiagnosticLogs()` with non-blocking `"Copied!"` feedback.

### Verification Results (Post-Final Edit)
- **Live Chrome `360x800` & `1440x900` Audit (`http://localhost:3008` + `/whiteboard`):**
  - Measured `document.documentElement.scrollWidth === 360`, `0` rect/scroll offenders, `0` console errors, `0` uncaught exceptions, `0` `window.alert()`, and `0` failed network requests across every audited mobile view including `#portalRoleGatewayModal`, `.top-navbar`, `#tabTeacherBoardPaper`, `#modalSelectAlternativeQuestion`, `#modalEditPaperQuestion`, `#tabTeacherCreateTestAndPaper`, `#containerUnitTestDraftStudio`, `#tabClassAnalytics`, `#tabQuestionBank` (solutions + Voice Tutor + `/whiteboard` iframe + `#modalInjectQuestion`), `#directorView`, `#ntaExamContainer`, `#modalDiagnosticResults`, `#modalPersonalizedRemedial`, `#tabStudentSmartReport`, and standalone `/whiteboard` (`badgeVsPageBtn === false`, `diagVsBottomActions === false`, `diagVsBottomTools === false`), with `1440x900` desktop multi-column parity verified clean.
- **Automated Suites (Post-Final Edit):**
  - `backend/` (`npm test` -> `test_evaluator.js`): `8/8` tests passed (exit `0`).
  - `frontend/` (`npm test`, `npm run test:latex`, `node scripts/test_screenshot_case.js`, `node scripts/test_quiz_creation_and_modal_display.js`): all exited `0` (`186/186` static buttons + 6 dynamic selectors bound; `32/32` quiz creation/modal/live `:5050` API checks passed).

---

## [2026-11-12 12:40] Full Bugfix Resolution & Verified Live Chrome End-to-End QA

Fixed every defect uncovered during live Chrome end-to-end testing across `frontend/` (`:3008`) and `backend/` (`:5050`), eliminated blocking browser `alert()` dialogs, resolved mobile `360x800` overflows, and re-verified all workflows in live Chrome and automated backend/frontend suites.

### Fixes Implemented
- **SVG `<path>` `<br/>` Corruption & HPBOSE Bilingual Math Classification (`frontend/js/app.js`):**
  - Removed duplicate `replace(/\n/g, '<br/>')` pass inside `renderLatexString()` so KaTeX `<svg><path d="...">` attribute newlines are preserved intact.
  - Replaced the broken `isFormulaString()` regex character class (which previously matched plain ASCII letters inside HPBOSE bilingual headings like `खण्ड-क (Section A)`) and added Devanagari/bilingual text guards so HPBOSE section instructions render as crisp upright text.
- **Toast System & Handwritten Workspace (`frontend/js/app.js`, `frontend/css/styles.css`, `frontend/index.html`):**
  - Added global `window.showToast(message, type)` backed by fixed bottom-right styling for `.role-switch-toast` (`position: fixed; bottom: 24px; right: 24px; z-index: 100500`) and replaced blocking `alert()` calls across test builder, exam navigation, WhatsApp dispatch, faculty auth, Question Bank copy/flash-quiz, AI question injection, and handwritten grading flows.
  - Added "Scan Paper Sheets" (`#tabHandwritten`) card to the sidebar drawer, updated Question Bank drawer badge to `518+`, changed raw `($300\text{ DPI}$)` subtitle text to `(300 DPI)`, and targeted `#rubricStepsList` when typesetting KaTeX in `switchTeacherTab()` / `index.html` so `#btnApproveHandwritten` and Vision AI listeners are preserved.
  - Added inline SVG favicon handler in `frontend/server.js` (`/favicon.ico` returning HTTP `200 image/svg+xml`) and `<link rel="icon">` in `frontend/index.html` and `frontend/whiteboard.html`.
- **Modal Stacking, Student & Smart Report Math & Director/Student Role Sync (`frontend/css/styles.css`, `frontend/js/app.js`):**
  - Elevated `#whatsAppModal` to `z-index: 10025 !important` above `#modalStudentIndividualReport` (`10006`).
  - Fixed double-escaped LaTeX strings (`\times`, `\frac`, `\theta`, `\tau`) and rendered `B_{\text{end}}` through `renderLatexString()` in student diagnostic and weekly Smart Reports.
  - Preserved `'director'` role view visibility and `"Dr. Anita Chandel"` header state across drawer tab switches, `applyTeacherProfile()`, and `updateTeacherClassScopeUI()`, and guarded `selectDrawerStream()` so Student/Director header chips are never overwritten by drawer exam-track selection.
- **Board Paper Studio CRUD & Bilingual Headers (`frontend/js/app.js`, `backend/src/services/boardPaperGeneratorService.js`):**
  - Renamed Board Paper `openSwapQuestionModal()` -> `openBoardSwapQuestionModal()` to eliminate collision with Unit Test swap, preventing `undefined Marks` and cross-subject candidates.
  - Fixed `openAddCustomQuestionModal()`, `submitAddCustomQuestion()`, `openEditQuestionModal()`, `submitEditPaperQuestion()`, and `addCustomQuestionToPaper()` so 1-Mark subjective questions remain optionless (`options_latex: []`, `correct_answer: null`) unless options are entered, and custom question `id` is synchronized with backend `inMemoryStore` so `PUT /update-question` and `DELETE /delete-question` return HTTP `200`.
  - Replaced hardcoded Hindi Physics header label with a subject-accurate map in `renderBoardPaperStudio()` so HPBOSE Chemistry renders `(रसायन विज्ञान - सैद्धांतिक)`.
- **CBSE Non-Negative UI & Context-Aware Physics Formula Remedial (`frontend/js/app.js`, `frontend/index.html`):**
  - Added `#examMarkingSchemeBadge` (`+4 / 0 (NO NEG)`) and `#examPaletteStandardSubtitle` (`CBSE Board Standard (No Negative)`) and hid `-1M` tags on CBSE review cards.
  - Passed full question/topic/subject context from `"Practice Formula"` into `openPersonalizedRemedialModal(questionCtx)` so Physics wrong answers open Physics/Optics drills instead of defaulting to Biology.
- **Voice Tutor / Smartboard Dipole Accuracy (`backend/src/services/aiVoiceTutorService.js`, `backend/src/routes/voiceTutor.js`, `frontend/js/app.js`, `frontend/whiteboard.html`):**
  - Preserved letter `match.correct_answer` (`A`–`D`) over `correct_answer_latex` in `solve-and-sync`, excluded electrostatics/optics/circuit terms from `rolling_incline`, added a dedicated Electrostatics/Dipole template before `'circuit'`, increased Groq fetch timeout to `6000ms` (`['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']`), prevented duplicate concurrent `solve-and-sync` requests via `voiceTutorState.inFlightSync`, and fixed `drawFallbackDiagram` fallback type in `whiteboard.html`.
- **Mobile `360x800` Overflow Remediation (`frontend/css/styles.css`, `frontend/index.html`, `frontend/js/app.js`):**
  - Enabled `#studentPortalNav` (`display: flex; flex-wrap: wrap;`), added `.two-col-form-grid` and `.report-two-col-grid`, collapsed multi-column report/form/graph grids to `1fr`, wrapped `.progress-subtabs-strip` and `#modalStudentIndividualReport .modal-card`, and cleared fixed `min-width` constraints under `@media (max-width: 768px)`.

### Verification Results (Post-Final Edit)
- **Live Chrome End-to-End QA (`http://localhost:3008` + `http://localhost:5050`):**
  - Initial boot & full session reported `0` console errors, `0` uncaught exceptions, `0` `window.alert()` dialogs, and HTTP `200` on `/favicon.ico`.
  - Verified HPBOSE bilingual instructions (upright text, zero KaTeX italic corruption), Board Swap (`1 Mark` badges), 1M subjective Custom Q Add/Edit/Delete (`POST 201`, `PUT 200`, `DELETE 200`), `#tabHandwritten` rubric KaTeX + `#btnApproveHandwritten` fixed toast, `snr_p12_c01_011` single `solve-and-sync` (`200`, `GROQ_OPENAI/GPT-OSS-120B`, Electric Dipole `[Option A]`), Inject AI Preview (`34` KaTeX spans), `#whatsAppModal` (`z-index: 10025`) stacked above `#modalStudentIndividualReport` (`z-index: 10006`), `B_{\text{end}}` & `50` KaTeX spans with `0` `.katex-error`, Director header preservation, Student `#studentPortalNav` desktop visibility, CBSE `+4 / 0` scoring & zero `-1M` badges, `"Practice Formula"` Physics drill, and Student `"Board"` drawer track preserving Student header.
  - Mobile `360x800` measured `documentElement.scrollWidth === 360 <= 360` across all 6 tested views (`Create Test & Paper`, `Class Progress`, `Test 01 Diagnostic Report`, `#modalStudentIndividualReport`, `#studentPortalNav` with internal `326/326`, and `#ntaExamContainer`).
- **Backend Automated Suites (`cd backend`):** `test_evaluator.js` (8/8), `test_board_paper_generator.js` (6/6), `test_latex_rendering_and_options.js` (2,524 options + 4 assessments), `test_personalized_remedial_flow.js`, `test_question_bank_solution_studio.js`, `test_real_whatsapp_dispatch.js`, `test_voice_tutor_hinglish.js` (including Edge TTS MP3 & Gemini Live WebSocket handshake), `test_end_to_end_assignment_flow.js`, `test_math_question_bank.js`, `test_subject_isolation_and_teacher_workflow.js`, and `test_subject_remedial_pipeline.js` (`27/27`) all exited `0`.
- **Frontend Automated Suites (`cd frontend`):** `test_latex_formatter.js`, `test_latex_rendering.js`, `test_intuitive_solution_card.js`, `test_screenshot_case.js`, `test_buttons.js` (`186/186` static buttons + 6 dynamic selectors), and `test_quiz_creation_and_modal_display.js` (`32/32`) all exited `0`.

---

## [2026-11-12 11:15] Live Gemini/Groq Model Optimization & Chrome End-to-End QA

### Live AI Fixes Applied
- **Gemini Model Order & Timeout (`backend/src/services/llmQuestionEngine.js`):** Replaced `['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest']` (`4000ms` timeout causing aborts) with `['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']` (`8500ms` timeout). Verified live HTTP `201` via `/api/questions/generate-llm` (`Google Gemini (gemini-flash-lite-latest)` / `gemini-3.5-flash-lite`).
- **Gemini Multimodal Order (`backend/src/services/questionInjectionService.js`):** Updated `callGeminiMultimodal()` model order to `['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']` (removing 404 `gemini-2.5-flash-lite` and slow timing-out models).
- **Provider Metadata (`backend/src/routes/questions.js`):** Updated `/api/questions/providers` status labels to `qwen/qwen3.8-27b` (Groq) and `gemini-flash-lite-latest` (Google Gemini Flash).

### Chrome End-to-End QA Results (`http://localhost:3008` + `http://localhost:5050`)
- **Verified Working Live:** Theme toggle, Role Gateway, `/api/questions/providers` (`200`), Groq & Gemini `/api/questions/generate-llm` (`201`), Unit Test draft (`201`) + Swap, CBSE 80M & HPBOSE 60M Board Papers (`katexErrors: 0`), Question Bank 4-filter narrowing (`518 -> 390 -> 3`), Solution Studio KaTeX, AI Extraction `/inject/preview` (`200`), Class Progress Chart.js + Roster, Student CBSE non-negative scoring (`4/12`), `/whiteboard` `tldraw` canvas (`0` console errors), `/api/voice-tutor/gemini-live-token` (`200` + live WebSocket handshake), `/solve-and-sync` (`200`), `/interrupt` (`200`), `/audio` (`200`), and `/explain` (`200` direct).
- **Remaining Bugs Discovered During Chrome QA (Pending Fix Confirmation):**
  1. **SVG `<path>` `<br/>` Corruption:** KaTeX `\sqrt` `<svg><path d="...">` has newlines converted to `<br/>` (`44` bad paths in CBSE 80M, `38` in HPBOSE 60M), throwing `<path> attribute d` console errors.
  2. **Board Paper Swap & Edit Bugs:** Swap modal on Q1 (`c10_m_pyq_003`) displays `undefined Marks` and cross-subject Physics bank filter; saving a 1M subjective question without options appends empty `(A)-(D)` options with `Answer: A`.
  3. **Student Performance Modal KaTeX/JS Escaping & z-index:** `#modalStudentIndividualReport` shows `8` KaTeX errors plus corrupted JS escapes (`\t/\f/\v/\c`), and clicking `#btnDrilldownSendWhatsApp` opens `#whatsAppModal` (`z-index: 1000`) hidden behind `#modalStudentIndividualReport` (`z-index: 10006`).
  4. **Director Role View/Header Sync:** Switching to Question Bank leaves `#directorView` visible over hidden `#teacherView`; clicking Board view resets header name/subtitle to Faculty Physics while keeping `#directorView` active.
  5. **Student Portal Desktop Nav, Remaining `alert()` Calls & Wrong Formula Drill:** `#studentPortalNav` still computes `display: none` at `1440px`; `Load Assigned Test`, Smart Report `"Practice 3 Questions"`, `"Launch 5-Min Remedial Drill"`, and `#tabHandwritten` `"Run Vision AI Evaluation"` still fire `alert()`; CBSE test header/review badges still display `"+4.0 / -1.0"` & `"-1 Mark"` despite `4/12` non-negative total; `"Practice Formula"` on Physics Q2 opens a Biology (`Verhulst-Pearl`) drill; Smart Report shows raw `"B_{end}"` braces.
  6. **Handwritten Tab Visibility & Raw Math; Minor 404/Wiring:** `#tabBtnHandwritten` sits inside hidden `#teacherSubTabs` and renders 4 raw `$...$` strings; `GET /favicon.ico` returns `404`; legacy `#btnGenerateQuestion` does not exist in DOM; `/api/voice-tutor/explain` has no frontend UI caller.
  7. **Mobile `360x800` Overflows:** Horizontal overflow measured on Teacher Create Test (`scrollWidth: 378`), Class Progress (`scrollWidth: 378`, table `792px`), Test 01 Diagnostic Report (`scrollWidth: 731`), and `#modalStudentGraphsGrid` (`scrollWidth: 731`, grid `622.6px`). Remaining two 360px checks (`#studentPortalNav`, `#ntaExamContainer`) were interrupted by `chrome_devtools` 1m timeout.

---

## [2026-11-12 10:42] Live LLM Key Configuration & Browser Check Status

- **Environment Configuration (`backend/.env`):** Configured `GEMINI_API_KEY` and `GROQ_API_KEY` (kept untracked inside `.gitignore`-protected `backend/.env`).
- **Live Key Verification Results:**
  - `GROQ_API_KEY`: Verified working against Groq Cloud (`generateLlmQuestion` -> `Groq LPU (qwen/qwen3.8-27b)`, `generateHinglishAudioBrief` -> `GROQ_OPENAI/GPT-OSS-120B`, and `processQuestionExtraction` via Groq LPU).
  - `GEMINI_API_KEY`: Verified returning HTTP `200` on `gemini-2.5-flash:generateContent` and issuing live ephemeral tokens via `@google/genai` `authTokens.create(...)`.
  - **Identified Pending Issue:** `backend/src/services/llmQuestionEngine.js` (`callGeminiApi`) and `backend/src/services/questionInjectionService.js` (`callGeminiMultimodal`) currently prioritize `['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest']` (`llmQuestionEngine.js` with a 4s `AbortController`), causing Gemini-direct generation to abort and fall back to the NCERT PYQ bank instead of routing directly to `gemini-2.5-flash`.
- **Browser QA Block:** Both live servers (`backend` on `:5050` and `frontend` on `:3008`) were started, but automated Chrome inspection could not attach because Chrome remote debugging (`DevToolsActivePort`) is not yet enabled on the host.

---

## [2026-11-12 10:30] Full-Stack Bugfix, CBSE/JEE Scoring Fix & UI/WCAG Remediation

Resolved all backend data/scoring issues and frontend runtime, navigation, responsive, and WCAG 2.2 AA accessibility defects discovered during the Nov 11 audit across both `backend/` (`:5050`) and `frontend/` (`:3008`).

### Backend Fixes (`backend/`)
- **Custom Chemistry Question Bank (`backend/src/database/custom_injected_questions.json`):** Completed Nernst equation options (`A` `$1.13\,\text{V}$` through `D` `$1.16\,\text{V}$` with `distractor_trap` explanations) on persisted custom question `snr_c_inj_1793801747344_553` in both `options_latex` and `options`. `node scripts/test_latex_rendering_and_options.js` now passes 100% across all 2,528 options and 4 pre-seeded assessments.
- **Board-Aware Assessment Scoring (`backend/src/routes/assessments.js`):** Replaced hardcoded JEE `+4 / -1` scoring in `POST /api/assessments/:id/submit` with board-aware calculation (`isCompetitiveExam = examBoard.includes('JEE') || examBoard.includes('NEET')`, default `negativePenalty` of `1.0` only for JEE/NEET or explicit `negative_marks`, `defaultMarksPerQ = totalMarks / assessment.questions.length`, clamped `totalScore = Math.max(0, ...)`). Verified CBSE submission `asgn_10_sci_01` returns `4/12` (previously `3/12`).
- **Safe `dotenv` Initialization (`backend/src/services/aiVoiceTutorService.js`, `llmQuestionEngine.js`, `questionInjectionService.js`):** Guarded `require('dotenv').config()` in `try/catch` so standalone service scripts load cleanly even in minimal environments.

### Frontend Fixes (`frontend/`)
- **Runtime Startup & Defensive Guards (`frontend/js/app.js`):** Added null guards in `updateTopicsForGrade()` (`if (!selectTopic) return;`) and `renderCurrentQuestionInPreview()` (`if (!qTextEl || !optListEl || !solTextEl) return;`) eliminating the `DOMContentLoaded` `TypeError` on `#renderQuestionText`.
- **Teacher / Director Portal Navigation (`frontend/js/app.js`):** Updated `switchTeacherTab()` to preserve `'director'` role instead of demoting Director back to Teacher, and normalized legacy targets `tabGenerator` -> `tabTeacherCreateTestAndPaper` (`unit_test`) and `tabStudents`/`tabSmartReports` -> `tabTeacherClasses` (`roster` subview + `loadAndRenderSmartReport()`).
- **Drilldown Modal, Smart Report & WhatsApp Dispatch (`frontend/index.html`, `frontend/js/app.js`):** Updated `handleGoToSmartReport()` to route cleanly to Student Smart Report (`tabStudentSmartReport`); updated `openStudentDrilldown()` to populate `#modalStudentIndividualReport` (scores, Chart.js subtopic/radar graphs, KaTeX, `_currentStudentRemedialPlan`) when `#modalStudentDrilldown` is absent; renamed `#btnDispatchWhatsAppModal` -> `#btnDrilldownSendWhatsApp` and wired its click handler to the active student report state.
- **Student Portal Actions, Desktop Nav & Question Bank Filters (`frontend/index.html`, `frontend/js/app.js`):** Removed `display:none !important;` from `#studentPortalNav`; replaced all 6 hardcoded `onclick="alert(...)"` buttons with `window.openPreviousTestReview(...)` and `window.launchRemedialDrillSheet(...)`; added Question Bank filter controls (`#selectQbSource`, `#selectQbDifficulty`, `#selectQbFormat`, `#inputQbSearch`) with explicit labels; routed printable exam handouts (`generatePrintablePaperHtml()`) to local vendored `vendor/katex/` assets instead of external CDN.
- **Responsive Layout, Design Tokens & WCAG 2.2 AA (`frontend/css/styles.css`, `frontend/index.html`, `frontend/js/app.js`):** Added missing CSS tokens `--bg-surface`, `--accent-red`, and `--font-mono` (plus dark theme overrides); added `@media (max-width: 768px)` rules collapsing `#ntaExamContainer` and `.responsive-2col-grid` to `1fr`, wrapping `#studentPortalNav`, and resetting input `min-width: 0`; updated `#modalStudentGraphsGrid` to `minmax(min(100%, 340px), 1fr)`; added keyboard `role="button"`/`tabindex="0"`/`aria-label`/Enter+Space handling to `.palette-btn`; added `aria-label`/`<label for>`/`btn-icon` classes to all icon buttons and inputs plus `verifyInteractiveControlAccessibility()`.

### Verification Results (Post-Final Edit)
- **Backend (`cd backend`):** `npm test` (`test_evaluator.js`), `test_board_paper_generator.js`, `test_latex_rendering_and_options.js`, `test_question_bank_solution_studio.js`, `test_personalized_remedial_flow.js`, and `test_real_whatsapp_dispatch.js` all exited `0` and passed (with live localhost `fetch` check inside `test_real_whatsapp_dispatch.js` skipped offline cleanly).
- **Frontend (`cd frontend`):** `test_buttons.js` (`185/185` static buttons + 6 dynamic selectors bound), `test_intuitive_solution_card.js`, `test_latex_formatter.js`, `test_latex_rendering.js`, and `test_screenshot_case.js` all exited `0` and passed 100%.
- **Integrated Audits:** `audit_ui_dom.js` reported 0 unhandled buttons, 0 unlabelled inputs/selects/textareas, and 0 unlabelled icon buttons; `audit_frontend_runtime.js` passed all 8 runtime checks with all 17 `fetch()` calls targeting `http://localhost:5050`; in-process `audit_all_features.js` passed `13/13` checks (`0` failures).
- **Documentation Sync:** Updated `log.md`, `TASKS.md` (`TASK-16`), and `INTERN_ONBOARDING_GUIDE.md` across both `backend/` and `frontend/`.

---

## [2026-11-11 22:30] Full Function & Feature Verification Audit

Executed automated backend test scripts, in-process Express API verification across all routers, frontend script checks, and a DOM runtime harness for `frontend/js/app.js` + `frontend/js/config.js`.

### Working Backend Features (Verified HTTP 200/201/204/403)
- **Gateway & Cross-Port CORS (`backend/src/server.js`):** `GET /` (`200`), `GET /api/health` (`200 HEALTHY`), and CORS preflight `OPTIONS` allowing `http://localhost:3008` (`204`) all work.
- **Faculty Auth & Curriculum Isolation (`backend/src/routes/curriculum.js`):** 6-faculty directory, mobile phone lookup (`9816010010`, `9816010001`), teacher login, 14-chapter Class 10 Math taxonomy, `POST /classes`, `POST /students` (`name`/`rollNumber`), `POST /generate-test`, and `POST /simulate-attempts` all pass.
- **Question Banks, Subject Lock & Extraction (`backend/src/routes/questions.js`):** Providers, Class 10 PYQ, 438-question Class 10 Math bank, LLM generation fallback (`201`), cross-subject lock enforcement (`403` when Physics teacher targets Chemistry), and authorized text preview (`200`) all pass.
- **Paper Studio, Remedial & DOCX Export (`backend/src/routes/assessments.js`):** Unit test draft + publish, CBSE 80M & HPBOSE 60M Board Paper generation + alternatives lookup, pattern blueprints, personalized remedial generation + formula write-in validation (`1/f = 1/v + 1/u`), and binary `.docx` ZIP export all pass.
- **Analytics, Telemetry, Vision & Notifications:** Class dashboard, individual drilldown API, pilot overview, telemetry recording/events, handwritten submissions/evaluate, uploaded handwritten sheet Vision OCR, weekly report card generation, and WhatsApp `wa.me` link dispatch all pass.
- **Voice Tutor & Whiteboard APIs (`backend/src/routes/voiceTutor.js`):** `/explain`, `/solve-and-sync`, `/interrupt`, and `/whiteboard-logs` (`GET`/`POST`) pass (`200`). Correction to prior Nov 9 note: `POST/GET /api/voice-tutor/gemini-live-token` **does exist** via `router.all('/gemini-live-token')` (`voiceTutor.js:18`) and returns HTTP `500` `"GEMINI_API_KEY is not configured on server"` when `.env` lacks a live key (external TTS/Gemini live streaming require valid API keys and outbound internet).

### Working Frontend Infrastructure
- **Cross-Port Wiring & Static Server (`frontend/js/config.js`, `frontend/server.js`):** `getHapsApiBaseUrl()` / `getHapsWsBaseUrl()` resolve `localhost:3008` -> `http://localhost:5050` / `ws://localhost:5050`, all 18 runtime boot `fetch()` calls target `http://localhost:5050`, zero bare relative `fetch('/api/...')` calls remain in `app.js`, `whiteboard.html`, or the `tldraw` bundle, and all 4 LaTeX / Intuitive Solution Card suites pass.

### Failing / Broken Features Confirmed During Audit
1. **Persisted Chemistry Bank Invalid Option Count (`backend/src/database/custom_injected_questions.json`):** Custom injected question `snr_c_inj_1793801747344_553` has only **2** options (`A`, `B`) instead of 4, causing `backend/scripts/test_latex_rendering_and_options.js` to fail (`2 !== 4`) once `dotenv` is installed and hydration succeeds.
2. **CBSE Scoring Formula Hardcoded (`backend/src/routes/assessments.js:226`):** `POST /api/assessments/asgn_10_sci_01/submit` applies JEE `+4/-1` marking (`score = 3/12` for 1 right + 1 wrong) to CBSE Class 10 assessments and ignores `q.marks`.
3. **Startup Null Exception (`frontend/js/app.js:8697`):** `initApp()` -> `renderInitialQuestion()` -> `renderCurrentQuestionInPreview()` throws `TypeError: Cannot set properties of null (setting 'innerHTML')` because `#renderQuestionText` does not exist in `index.html`.
4. **Teacher Navigation Blank Tabs & Traps (`frontend/index.html`, `frontend/js/app.js`):** `#tabSmartReports` and `#tabStudents` are empty `display:none !important` divs; `#tabGenerator` traps navigation; clicking drawer tabs demotes Director role back to Teacher (`app.js:1237`).
5. **Broken Drilldown & Missing QB Filter Inputs (`frontend/js/app.js`):** `openStudentDrilldown()` queries non-existent `#modalStudentDrilldown` (modern modal is `#modalStudentIndividualReport`); `filterQuestionBankCards()` queries missing `#selectQbSource`, `#selectQbDifficulty`, `#selectQbFormat`, and `#inputQbSearch`.
6. **Student Portal Placeholders & Hidden Desktop Nav (`frontend/index.html`):** `#studentPortalNav` has `display:none !important;` and 6 Previous Tests / Remedial buttons execute hardcoded `onclick="alert(...)"` popups instead of modals.
7. **Responsive, Accessibility & Legacy Test Gaps:** `#ntaExamContainer` (`2.2fr 1fr`) and `#modalStudentGraphsGrid` (`minmax(380px, 1fr)`) overflow 360px mobile viewports; missing `--font-mono`; 53 unlabelled form inputs & 5 unlabelled close buttons; `backend/scripts/test_real_whatsapp_dispatch.js` fails on removed `#btnDrilldownSendWhatsApp`.

- Also synced updated audit notes into `frontend/INTERN_ONBOARDING_GUIDE.md` & `backend/INTERN_ONBOARDING_GUIDE.md`.

---

## [2026-11-11 22:21] Documentation Restoration & Full Rewrite (`frontend/` & `backend/`)

### Restored & Updated Docs Inside Both Standalone Folders
Restored `ARCHITECTURE_EXCALIDRAW_MERMAID.md`, `INTERN_ONBOARDING_GUIDE.md`, and `TASKS.md` from `HEAD` (`dbb835d`) cleanly into **both** `frontend/` and `backend/` (keeping root clean with only `backend/`, `frontend/`, `.gitignore`, `README.md`, `log.md`), and fully rewrote them for the decoupled architecture:
- **`ARCHITECTURE_EXCALIDRAW_MERMAID.md` (in `frontend/` & `backend/`):**
  - Updated Master System Diagram, Teacher Question Bank Diagram, Assessment Evaluation Diagram, and Deployment Flow Diagram to reflect standalone `frontend/` (`:3008`, `server.js`, `js/config.js`, `tldraw` whiteboard) communicating cross-port with pure-API `backend/` (`:5050`, `CORS_ORIGIN`, `backend/database/` + `backend/src/database/`).
  - Replaced hardcoded `/Users/ajaymokta2002/...` absolute file paths and obsolete monolithic Vercel pipeline links with accurate repo paths.
- **`INTERN_ONBOARDING_GUIDE.md` (v3.0.0 — in `frontend/` & `backend/`):**
  - Updated Stack Table, Backend LLD diagram, Database Paths (`backend/database/*.sql`), Frontend Sections (`js/config.js`, `whiteboard.html`, `geminiLiveVoiceTutor.js`, `.agents/rules/design_principles.md`), Cross-Port Setup (`:5050` & `:3008`), local Kafka `ECONNREFUSED` fallback note, separated `backend/scripts/` + `frontend/scripts/` test commands, and separate-repo Git workflow + `log.md` rules.
- **`TASKS.md` (in `frontend/` & `backend/`):**
  - Updated `TASK-01`, `TASK-08`, `TASK-09`, and `TASK-14` file paths and status notes (`backend/database/`, standalone Dockerfiles, removed root monolith configs) and added **`TASK-15: Dual-Repo Separation, Cross-Port Architecture & Workspace Consolidation`**.
- **Synced Secondary Markdown Files:**
  - Updated `README.md`, `frontend/README.md`, `backend/README.md`, `frontend/AGENTS.md`, `frontend/GEMINI.md`, `backend/AGENTS.md`, and `backend/GEMINI.md` to reference all restored guides and enforce continuous `.md` + `log.md` synchronization.

---

## [2026-11-11 22:10] Workspace Consolidation & Root Cleanup

### Investigation Findings
- **Duplicate `school_student_system-SSS-/` folder:** Verified via timestamps and Git metadata that `c:\unisole\school_student_system-SSS-\school_student_system-SSS-` was created on `2026-11-09 20:19:11` when `git clone https://github.com/UnisoleSchool2026/school_student_system-SSS-` was run while already inside the root folder. It pointed to the same remote at identical HEAD commit `dbb835d` with no uncommitted changes.
- **Kafka startup messages on `backend` (`npm start`):** Verified in `backend/src/kafka/producer.js` and `backend/src/kafka/consumer.js` that when `KAFKA_BROKERS=localhost:9092` is set in `backend/.env` without a local Kafka broker running, `kafkajs` logs `ECONNREFUSED` retry errors before automatically falling back to the resilient in-memory event bus while the server stays active on port `5050`.

### Structural Changes
- **Root Folders Consolidated (Strictly `backend/` and `frontend/`):**
  - Removed duplicate nested clone `school_student_system-SSS-/`.
  - Moved `.agents/` -> `frontend/.agents/` (preserving UI/UX rule binding to `frontend/DESIGN_PRINCIPLES.md`).
  - Moved `scripts/verify_staging.js` -> `backend/scripts/verify_staging.js`.
  - Removed monolithic/unused root directories: `k8s/`, `.github/`, and `scripts/` (including `scripts/dev.sh`).
- **Root Files Consolidated:**
  - Created `log.md` at workspace root.
  - Rewrote root `README.md` cleanly for the decoupled `backend/` + `frontend/` architecture.
  - Retained `.gitignore` at workspace root.
  - Removed obsolete/redundant root files no longer needed at root: `AGENTS.md`, `GEMINI.md`, `DESIGN_PRINCIPLES.md` (already stored inside both `frontend/` and `backend/`), `ARCHITECTURE_EXCALIDRAW_MERMAID.md`, `INTERN_ONBOARDING_GUIDE.md`, `TASKS.md`, `docker-compose.yml`, `docker-compose.prod.yml`, and `BUG_AUDIT_REPORT.pdf`.
- **Documentation Sync:**
  - Updated `frontend/README.md`, `backend/README.md`, `frontend/AGENTS.md`, `frontend/GEMINI.md`, `backend/AGENTS.md`, and `backend/GEMINI.md`.

---

## [2026-11-11 18:52] Architectural Split: Standalone `frontend/` & `backend/` Repositories

### Database & Backend (`backend/` — Port `5050`)
- Moved root `database/` (`schema.sql`, `seed_data.sql`) -> `backend/database/`. Kept `backend/src/database/` intact.
- Updated `backend/package.json` with missing runtime dependencies previously declared only at root (`@google/genai`, `docx`, `msedge-tts`) and updated all `scripts` commands to target `scripts/*.js`.
- Removed out-of-sync `backend/package-lock.json` and updated `backend/Dockerfile` to fall back gracefully between `npm ci --omit=dev` and `npm install --omit=dev`.
- Updated `backend/src/server.js`:
  - Removed static serving of `../../frontend` and SPA HTML fallback.
  - Added JSON info route at `GET /`.
  - Configured CORS with `CORS_ORIGIN` / `FRONTEND_URL` environment support plus automatic localhost dev allowance (`localhost:3008`, `localhost:3000`, `localhost:5173`).
- Updated `backend/src/services/questionInjectionService.js` to resolve `pdf-parse` worker dynamically via `require.resolve('pdf-parse/package.json')` instead of hardcoded `../../../node_modules/...`.
- Updated `backend/.env.example` with `PORT=5050`, `FRONTEND_URL=http://localhost:3008`, `CORS_ORIGIN`, and optional WhatsApp gateway variables.
- Moved 23 backend tests and Python bank generators from root `scripts/` -> `backend/scripts/` and fixed internal relative paths.
- Added standalone `backend/README.md`, `backend/AGENTS.md`, `backend/GEMINI.md`, `backend/DESIGN_PRINCIPLES.md`, and `backend/.gitignore`.

### Frontend (`frontend/` — Port `3008`)
- Created `frontend/server.js` (zero-dependency standalone Node static/SPA server on port `3008` with `/whiteboard` clean URL support and path traversal protection).
- Created `frontend/package.json` with `start`, `dev`, `build:whiteboard`, and test scripts plus `katex`, `react`, `react-dom`, `tldraw`, and `esbuild`.
- Created `frontend/.env.example` (`PORT=3008`, `BACKEND_URL=http://localhost:5050`).
- Created `frontend/js/config.js` providing centralized runtime resolution (`getHapsApiBaseUrl()`, `getHapsWsBaseUrl()`, `setHapsBackendUrl()`).
- Loaded `js/config.js` in both `frontend/index.html` and `frontend/whiteboard.html`.
- Updated `frontend/js/app.js`, `frontend/js/geminiLiveVoiceTutor.js`, `frontend/whiteboard.html`, `frontend/src_whiteboard/index.jsx`, and `frontend/vendor/tldraw/tldraw-standalone.bundle.js` so all `/api/*` requests and WebSocket connections resolve via the backend base URL instead of bare relative paths.
- Moved 8 frontend test scripts into `frontend/scripts/` and updated relative paths.
- Added standalone `frontend/README.md`, `frontend/AGENTS.md`, `frontend/GEMINI.md`, `frontend/DESIGN_PRINCIPLES.md`, and `frontend/.gitignore`.

### Monolithic Root Removal
- Removed root `package.json`, `package-lock.json`, empty `node_modules/`, `api/index.js`, `vercel.json`, `scripts/frontend_server.js`, `scripts/deploy_vercel.sh`, and `scripts/promote_to_production.sh`.

---

## [2026-11-09] Initial Read-Only Bug Audit
- Audited frontend DOM, JS state/navigation handlers, CSS responsive tokens, WCAG 2.2 AA accessibility, and backend scoring/voice routes.
- Identified 18 issues (navigation dead tabs, `openStudentDrilldown` missing modal, director role reset, hidden student desktop nav, hardcoded `alert()` placeholders, missing `/gemini-live-token` route, 360px layout overflows, 53 unlabelled form inputs, +4/-1 CBSE scoring bug, unguarded `dotenv` imports) without modifying source code.

---

## [2026-11-13] Student AI Whiteboard Viewport Auto-Scaling & Fullscreen Theater Mode
- Fixed canvas truncation on the right and bottom where solution cards were sliced in half inside the student workspace iframe.
- Added responsive dynamic viewport coordinate scaling in `frontend/whiteboard.html` (`drawFallbackSmartboardSolution`) with virtual boundaries (1260 x 580) computing `scale = Math.min(availW / VIRTUAL_W, availH / VIRTUAL_H)` and centered offset translation, guaranteeing 100% visibility of all 5 sections (Question Statement, Visual Schematic, Governing Principles, Derivation, and Evaluated Solution) on any display size.
- Added embedded mode stylesheet (`.embedded-mode`) in `frontend/whiteboard.html` to suppress redundant pacing HUD buttons and prevent status badge overlap/truncation when rendered within the student iframe.
- Added working Full Screen Theater Mode with dedicated buttons (`#btnStudentWbFullscreen`, `#btnStudentWbBannerFullscreen`) and keyboard shortcut (Escape) / fullscreenchange listeners in `frontend/js/app.js`, `frontend/index.html`, and `frontend/css/styles.css`.
- Increased default student whiteboard iframe wrap height from 540px to 600px and widened grid column ratio.
- Verified live in Chrome (1440x900 viewport) via browser QA automation: verified Class 10 Science 'Chemical Reactions and Equations', confirmed 0 console errors, confirmed all 5 cards visible with 0 clipping, confirmed smooth entry and exit into Full Screen mode.


