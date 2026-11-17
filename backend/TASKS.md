# HAPS-AI SCHOLAR ASSISTANT: MASTER ENGINEERING TASKS & LEARNING LOG

This document tracks all engineering deliverables for the **HAPS-AI Scholar Assistant** platform for Him Academy Public School. To support deep technical learning, **every task concludes with a dedicated 5-point architectural breakdown** detailing the tech stack choices, trade-offs, and engineering rationale.

---

## Implementation Checklist & Status Tracker

| Task ID | Phase / Module | Description | Status |
| :--- | :--- | :--- | :---: |
| **TASK-01** | **Core Architecture & Schema** | Relational PostgreSQL schema (`backend/database/`) for users, LaTeX questions, telemetry, handwritten evaluations, and weekly smart reports. | Ready |
| **TASK-02** | **Event Bus & Telemetry Pipeline** | Apache Kafka event streaming pipeline (`backend/src/kafka/`) with automatic in-memory fallback for sub-second question timers and diagnostics. | Ready |
| **TASK-03** | **AI LaTeX Question Generator** | Prompt engineering & LaTeX rendering engine for HP Board, CBSE, JEE, NEET, and Olympiads (Bloom's Taxonomy). | Ready |
| **TASK-04** | **Sub-Second Telemetry & Diagnostic Engine** | Real-time tracking of time spent per question, hesitation index, and classification into Mastered / Recap Needed / Weak. | Ready |
| **TASK-05** | **Handwritten Sheet Evaluation Engine** | OCR & Multi-modal Vision AI pipeline to evaluate physical answer sheets, step-by-step scoring, and LaTeX annotations. | Ready |
| **TASK-06** | **Weekly Dual-Action Smart Report Card** | Automated weekly report generator creating distinct actionable steps for School Teachers (Hostel study) and Parents at home. | Ready |
| **TASK-07** | **Dual-Portal Interactive Web Application** | Standalone frontend (`frontend/`) with Teacher Co-pilot, Student Adaptive Interface, KaTeX math, and Chart.js analytics. | Ready |
| **TASK-08** | **Containerization & Port Configuration** | Standalone `frontend/Dockerfile` & `backend/Dockerfile` prepared for container builds; monolithic root Compose/K8s removed during repo split. | Updated (Split) |
| **TASK-09** | **Verification Suites & Deployment Readiness** | Partitioned `frontend/scripts/` & `backend/scripts/` test suites (`test_evaluator.js`, `verify_staging.js`); monolithic root Vercel config removed. | Updated (Split) |
| **TASK-10** | **Live Multi-Modal Sheet Upload & OCR Pipeline** | Direct file upload for physical answer papers with Gemini Vision step-by-step rubric grading. | Ready |
| **TASK-11** | **Live Bi-Directional WebSocket Telemetry Sync** | Real-time bi-directional telemetry (`ws://localhost:5050`) streaming student timer ticks, option toggles, and hesitation into Classroom Seatmap. | Ready |
| **TASK-12** | **Headless PDF Report Generator & WhatsApp Dispatch** | Printable HAPS academic dossier HTML template and WhatsApp direct/webhook notification gateway. | Ready |
| **TASK-13** | **Full Exam Engine with 30-Question Palette** | NTA JEE/NEET competitive exam simulator with 30-question palette, section switcher, and auto-save. | Ready |
| **TASK-14** | **Multi-LLM Question Engine & Class 10 NCERT Mapping** | Dual Groq LPU & Gemini Flash LLM generation with authentic 438-question Class 10 CBSE/HPBOSE math bank & NCERT PYQ mapping. | Ready |
| **TASK-15** | **Dual-Repo Separation, Cross-Port Config & Docs Sync** | Clean division into standalone `frontend/` (`:3008`) & `backend/` (`:5050` + `database/`), `js/config.js`, CORS, root cleanup, and `log.md`. | Completed |
| **TASK-16** | **Full-Stack Bugfix, CBSE/JEE Scoring Fix & UI/WCAG Remediation** | Fixed Chemistry 4-option data, CBSE vs JEE scoring, startup null guards, Director/Student routing, WhatsApp/QB controls, responsive grids & WCAG 2.2 AA labels. | Completed |
| **TASK-17** | **Live AI Tuning & Chrome End-to-End QA Follow-Ups** | Tuned live Gemini/Groq failover, fixed all 11 Chrome QA bugs + Custom 1M CRUD/toast/dipole/drawer leaks, verified 360px responsiveness & live test suites. | Completed |
| **TASK-18** | **Full Mobile Viewport (`360x800`) UI & Whiteboard Remediation** | Remediated all `360x800` grid, modal, KaTeX, exam palette, Voice Tutor, and `/whiteboard` HUD overflows with zero desktop regressions. | Completed |
| **TASK-19** | **Full Desktop & Mobile E2E Audit (14 Bug Fixes & Live Re-QA)** | Fixed Board Paper Class 12 Maths & 1M MCQ filtering, Voice Tutor `v1alpha` + neural fallback, safe TreeWalker KaTeX, `data-*` Student/Remedial clicks, WhatsApp sanitization & live `1440x900`/`360x800` Chrome verification. | Completed |
| **TASK-20** | **Student AI Whiteboard Studio & Live Doubt Workspace** | Rebuilt `#tabStudentSmartboard` with Class/Subject/Topic filters & keyword search, playback/zoom/clear canvas controls, KaTeX step cards, Hinglish voice tutoring (`openai/gpt-oss-20b`), Ask-Any-Doubt studio, race guards, and `360x800` touch/layout parity. | Completed |
| **TASK-21** | **Standalone CI/CD Pipelines & Security Automation** | Independent backend CI/CD pipelines (`.github/workflows/{ci,cd}.yml`) with Node 20, Postgres 16 service container, live server verification gate, Trivy/Gitleaks/CodeQL security scans, and Dependabot. | Completed |
| **TASK-22** | **Multi-Tenant Dual-Mode Architecture (Board vs Competitive)** | Tenant JSON profiles, exam pattern template registry (drives scoring), workspace tab registry, canonical `curriculum_content` model, Module Registry (DPP, Roadmap, Cheat Sheets, NCERT Core, Rank Analytics), new `/api/tenant`, `/api/content`, `/api/modules` APIs and 3 new PostgreSQL tables. | Completed |
| **TASK-23** | **Full-Project Audit: Content Isolation, Live Class Data & Seed Fixes** | Shared `subjectScope` service enforcing teacher subject/class scope on students, tests, analytics and test creation; student submissions endpoint; real class size in analytics; Class 10 Science seed and Class 10 Maths default-class fixes. | Completed |
| **TASK-24** | **Mode Features per Diagram, Question Bank Filters, Working Question Injection & Unisole Logo** | Board/Competitive tabs per the mode diagram (NCERT tab in both, Scan Sheets Board-only, chapter-wise DPP, Board NCERT Exercise/Example/Exemplar); Create Test limited to the active grade; Question Bank filters built from data; honest question injection with answer-key picker; Unisole logo across the portal. | Completed |
| **TASK-25** | **Frontend Redesign: Sky Blue & White, PC Top Tabs + Phone Bottom Tab Bar** | New theme (`css/unisole-theme.css`), app shell (`js/appShell.js`) mirroring each role's features as PC tabs and a phone bottom bar, light sign-in page, plain-language labels and decluttered screens; self-hosted fonts. AI Smartboard untouched. | Completed |
| **TASK-26** | **Role Lock, Principal Live Dashboard, Teacher-Created DPPs** | Portal locked to the signed-in role (no Portal Views), principal read-only telemetry (`/api/analytics/principal-overview`), teacher DPP creation from bank / typed / PDF / photo with results (`/api/dpp`), student Practice tab, balanced bank answer keys. | Completed |
| **TASK-27** | **Study Board, Class Desk, Mistake Notebook, Printable Reports, PostgreSQL Persistence** | New whiteboard-style Study Board (lessons, doubts, practice with hints, classroom mode) separate from the AI Smartboard; Class Desk (ask-teacher doubts, notices and homework); mistake notebook; printable reports; principal notices; all data saved to PostgreSQL (`school_records`); security headers, rate limits, graceful shutdown; locked-down frontend file server. | Completed |
| **TASK-28** | **Merge Teammates' NCERT Reading Engine + Post-Merge Production Fixes** | Merged frontend/backend `main` (NCERT Reading Engine) with TASK-27 work, no conflicts on push; runtime data moved out of git-tracked files (`backend/data/`), NCERT token verification and rate limits, student NCERT view without admin tools, backend `.dockerignore`. | Completed |
| **TASK-29** | **Voice Teacher on the Study Board + Detailed Diagrams + Photo Import Fix** | AI Tutor merged into the Study Board: Gemini Live human voice (Hinglish/English/Hindi), student can interrupt by voice or text, teacher draws diagrams and writes on the board; 18 diagram types drawn step by step; in-depth AI lessons; photo question import reads up to 6 photos and keeps figures; offline Gemini mock + tests. | Completed |

---

## Detailed Task Specifications & Learning Breakdowns

---

### TASK-01: Core Architecture & Relational PostgreSQL Schema
**Objective**: Build a normalized, ACID-compliant relational schema capable of handling granular student telemetry, hierarchical question banks with LaTeX strings, handwritten submission metadata, and weekly smart reports.

**Core Deliverables**:
1. `backend/database/schema.sql` & `backend/database/seed_data.sql`: Tables for `users`, `classes`, `subjects`, `topics`, `subtopics`, `questions`, `assessments`, `assessment_questions`, `student_question_telemetry`, `handwritten_evaluations`, `concept_mastery`, and `weekly_smart_reports`.
2. `backend/src/database/`: Subject bank migrations and persistent `custom_injected_questions.json` store hydrated automatically by `backend/src/config/database.js`.
3. `backend/src/config/database.js`: Dual PostgreSQL pool + in-memory fallback engine for zero-config local execution.

#### 5 Technical Learning Points:
1. **Why PostgreSQL instead of MongoDB?**: Academic assessment data is inherently relational (Students -> Batches -> Tests -> Questions -> Subtopics -> Telemetry). PostgreSQL gives ACID guarantees, foreign-key integrity, and transactional safety for test marks.
2. **PostgreSQL JSONB for Hybrid Schemas**: AI marking rubrics, question hints, and bounding boxes vary by question format; `JSONB` provides schema flexibility inside relational rows.
3. **Array Data Types (`TEXT[]`)**: Multi-tag exam taxonomy filters stay compact and queryable without extra join tables.
4. **Composite Indexes for Telemetry Optimization**: Indexing `(student_id, question_id, created_at)` keeps diagnostic aggregations fast even under high attempt volumes.
5. **Auditing & Safeguards**: `TIMESTAMPTZ` columns ensure unambiguous, timezone-aware audit trails for school examinations.

---

### TASK-02: Event Bus & Kafka Streaming Telemetry Pipeline
**Objective**: Decouple high-frequency student interactions (e.g., question timer ticks, option toggles, hint requests) from primary request latency using Apache Kafka with resilient offline fallback.

**Core Deliverables**:
1. `backend/src/kafka/producer.js`: Publishes telemetry events (`telemetry.question-timer`, `telemetry.assessment-submit`, `telemetry.handwritten-scan`).
2. `backend/src/kafka/consumer.js`: Updates concept mastery metrics and invokes WebSocket broadcast callbacks.
3. Automatic in-memory event bus fallback when no Kafka broker is reachable on `KAFKA_BROKERS`.

#### 5 Technical Learning Points:
1. **Event Buffering Under Exam Concurrency**: Streaming timer ticks prevents hundreds of simultaneous students from saturating database write locks.
2. **Event-Driven Architecture (EDA)**: Decouples attempt ingestion from downstream analytics and notification consumers.
3. **Partition Key Strategy**: Keying events by `student_id` preserves chronological order per student across concurrent partitions.
4. **KRaft Mode (Zero ZooKeeper)**: Simplifies Kafka clustering in container deployments.
5. **Graceful Local Resilience**: Falling back cleanly to an in-memory dispatcher ensures local development works immediately without needing Docker/Kafka running.

---

### TASK-03: AI LaTeX Question Generator & Pedagogical Engine
**Objective**: Build an AI co-pilot generating curriculum-compliant questions formatted in clean LaTeX for CBSE, HP Board, JEE Main/Advanced, NEET, and Olympiads.

**Core Deliverables**:
1. Clean KaTeX mathematical formatting using `$...$` for inline math and `$$...$$` for display equations (`backend/src/services/aiPromptEngine.js` & `llmQuestionEngine.js`).
2. Board-aware templates (CBSE/HP Board step rubrics vs JEE/NEET distractors vs Olympiad reasoning).
3. Instant KaTeX rendering on `frontend/index.html`.

#### 5 Technical Learning Points:
1. **Why LaTeX?**: Unambiguous mathematical, chemical, and vector notation across web and print views.
2. **KaTeX vs. MathJax**: Vendored KaTeX (`frontend/vendor/katex/`) renders synchronously without FOUC or external network lag.
3. **Strict JSON Schema Prompting**: Eliminates conversational filler and guarantees structured `question_latex`, `options_latex`, and `solution_latex`.
4. **Distractor Trap Design**: Wrong options map directly to common student calculation/concept errors.
5. **Human-in-the-Loop Control**: Teachers can inspect, swap, or edit generated questions before publishing to students.

---

### TASK-04: Sub-Second Telemetry & Diagnostic Matrix
**Objective**: Transform raw attempt telemetry into actionable subtopic diagnoses (**Mastered**, **Needs Recap**, **Critical Weakness**).

**Core Deliverables**:
1. Telemetry tracking (`time_spent_seconds`, `hesitation_seconds`, `option_flips_count`, `hints_requested_count`).
2. Error categorization (`FAST_ACCURATE`, `SLOW_ACCURATE`, `FAST_CARELESS_SLIP`, `SLOW_MISCONCEPTION`, `UNTOUCHED`).
3. Teacher live dashboard & student diagnostic modal (`#modalStudentIndividualReport`).

#### 5 Technical Learning Points:
1. **Time-to-Solve Quality Signal**: Distinguishes lucky/slow guesses from confident mastery.
2. **Velocity Normalization**: Compares actual solve duration against question benchmark times.
3. **WebSocket Streaming**: Eliminates polling overhead during live classroom assessments.
4. **Three-Tier Triage**: Separates quick recap concepts from fundamental conceptual gaps needing reteaching.
5. **Pending Cohort Resilience**: Dashboards render cleanly even before all students submit attempts.

---

### TASK-05: Handwritten Sheet Evaluation Engine
**Objective**: Ingest physical pen-and-paper answer sheets and grade them step-by-step against marking rubrics using Vision AI.

**Core Deliverables**:
1. `backend/src/routes/handwritten.js` & `backend/src/services/handwrittenEvaluator.js`.
2. `backend/src/services/geminiVisionService.js`: OCR transcription and bounding box step alignment.
3. Teacher mark verification and adjustment UI in `#tabHandwritten`.

#### 5 Technical Learning Points:
1. **Multimodal LLMs for Math HTR**: Handles diagrams, handwritten symbols, and strike-throughs better than plain text OCR.
2. **Normalized Bounding Boxes**: Maps `[ymin, xmin, ymax, xmax]` coordinates onto sheet previews.
3. **Step-Wise Partial Marking**: Separates formula statement, substitution/units, and final answer accuracy.
4. **Diagnostic Error Labels**: Identifies conceptual vs algebraic slips on subjective papers.
5. **Teacher Final Veto**: Keeps human grading oversight over all AI rubric suggestions.

---

### TASK-06: Weekly Dual-Action Smart Report Card
**Objective**: Synthesize weekly student telemetry into differentiated action plans for Teachers (hostel prep) and Parents (weekend home support).

**Core Deliverables**:
1. `backend/src/services/smartReportService.js` & `backend/src/routes/reports.js`.
2. Distinct **School/Teacher Directives** vs **Parent Feynman-Method Directives**.
3. Printable report layout and student scorecard modal.

#### 5 Technical Learning Points:
1. **Actionable Interventions vs Passive Grades**: Replaces vague remarks with concrete 15-minute study tasks.
2. **Role-Specific Framing**: Technical worksheets for educators vs supportive verbal prompts for parents.
3. **Deterministic Guardrails**: Templates enforce constructive tone and grounded telemetry evidence.
4. **Offline Printable CSS**: High-contrast styling supports clean paper handouts.
5. **Subject & Stream Awareness**: Directives automatically adapt to Class 10 Board vs JEE/NEET tracks.

---

### TASK-07: Dual-Portal Interactive Web Application
**Objective**: Deliver a fast, glassmorphic portal supporting Teacher Co-Pilot, Student Adaptive Mode, and Principal/Director executive views.

**Core Deliverables**:
1. `frontend/index.html`, `frontend/css/styles.css`, `frontend/js/app.js`, `frontend/js/syllabusData.js`.
2. `frontend/whiteboard.html` + `frontend/src_whiteboard/index.jsx` (`tldraw` interactive smartboard).
3. `frontend/js/geminiLiveVoiceTutor.js` (real-time voice tutor client).

#### 5 Technical Learning Points:
1. **Zero-Build Core Runtime**: HTML/CSS/Vanilla JS serves immediately on port `3008` without framework bundle bloat.
2. **Vendored Local Assets**: `vendor/katex/` and `vendor/tldraw/` allow offline classroom operation.
3. **Modular Event Streams**: Client telemetry debounces and dispatches via `getWsBaseUrl()`.
4. **Departmental Faculty Isolation**: Strict stream partitioning keeps Physics, Chemistry, Biology, and Class 10 scoped accurately.
5. **Accessible Design Governance**: Governed by `frontend/DESIGN_PRINCIPLES.md` and `frontend/.agents/rules/design_principles.md`.

---

### TASK-08: Containerization & Repo-Split Configuration (Updated)
**Objective**: Maintain per-service container definitions while removing coupled monolithic root orchestration files for standalone repository separation.

**Current State**:
1. `backend/Dockerfile`: Multi-stage Node 20 Alpine build supporting both locked (`npm ci --omit=dev`) and unlocked (`npm install --omit=dev`) installs on pure API port.
2. `frontend/Dockerfile`: Nginx Alpine static container definition.
3. Monolithic root `docker-compose.yml`, `docker-compose.prod.yml`, `k8s/`, and root `scripts/dev.sh` were removed during root cleanup so each directory stands cleanly on its own.

#### 5 Technical Learning Points:
1. **Per-Repo Dockerfiles**: Keeping `Dockerfile` inside `frontend/` and `backend/` allows independent CI image builds once pushed to separate repos.
2. **Lockfile Resilience**: `if [ -f package-lock.json ]` prevents image build failures during dependency updates.
3. **Minimal Alpine Surfaces**: Non-root `appuser` inside `backend/Dockerfile` hardens production runtime permissions.
4. **Stateless API Containers**: Decoupling static frontend serving from `backend/src/server.js` eliminates filesystem cross-container assumptions.
5. **Port Flexibility**: Supporting `process.env.PORT` lets both local dev (`5050`/`3008`) and containerized defaults coexist cleanly.

---

### TASK-09: Independent Verification Suites & Deployment Readiness (Updated)
**Objective**: Ensure every verification script and package configuration lives inside its respective repo without monolithic Vercel coupling at root.

**Current State**:
1. Moved backend tests & Python question bank scripts into `backend/scripts/` (`test_evaluator.js`, `verify_staging.js`, etc.).
2. Moved frontend tests into `frontend/scripts/` (`test_intuitive_solution_card.js`, `test_buttons.js`, `test_latex_*.js`, etc.).
3. Removed monolithic root `api/index.js`, `vercel.json`, `package.json`, `deploy_vercel.sh`, `promote_to_production.sh`, and root `.github/` so `frontend/` and `backend/` can be deployed independently anywhere.

#### 5 Technical Learning Points:
1. **Repository Independence**: Splitting `package.json` into `frontend/package.json` and `backend/package.json` removes shared lockfile conflicts.
2. **Graceful Cross-Repo Test Guards**: Shared assertion scripts in `backend/scripts/` check whether a sibling `frontend/` exists before asserting UI files, avoiding false failures inside an isolated backend repo.
3. **Zero Broken Dependencies**: Moving `@google/genai`, `docx`, and `msedge-tts` into `backend/package.json` ensures backend runs cleanly standalone.
4. **Dynamic Worker Paths**: Using `require.resolve('pdf-parse/package.json')` eliminates hardcoded workspace-root `node_modules` lookups.
5. **Environment Parity**: `.env.example` templates exist inside both `frontend/` and `backend/`.

---

### TASK-10: Live Multi-Modal Sheet Upload & OCR Pipeline
**Objective**: Support PDF, image, and pasted text ingestion for answer sheets and external question papers.

**Core Deliverables**:
1. `backend/src/routes/upload.js`, `backend/src/routes/questions.js` (`/inject`, `/inject/preview`), `backend/src/services/questionInjectionService.js`.
2. Native PDF extraction via `pdf-parse` + image OCR via Gemini Flash + Groq text fallback.
3. Persistent custom bank storage at `backend/src/database/custom_injected_questions.json`.

#### 5 Technical Learning Points:
1. **Worker Path Portability**: Automatically restores `pdf.worker.mjs` relative to `pdf-parse` package installation path.
2. **In-Memory Buffers**: Base64 payload parsing handles direct JSON image/PDF uploads without temp file leaks.
3. **Dual-Provider Cascade**: Attempts Groq LPU for raw text speed and Gemini Flash for multimodal images/PDFs.
4. **Sanitization Pipeline**: Normalizes extracted LaTeX and options before inserting into subject banks.
5. **Dual-Write Persistence**: Hydrates custom questions on boot from disk JSON back into `inMemoryStore`.

---

### TASK-11: Live Bi-Directional WebSocket Telemetry Sync
**Objective**: Connect student exam actions to teacher monitoring screens in real time over WebSockets.

**Core Deliverables**:
1. `backend/src/server.js`: Attached `WebSocketServer` (`ws://localhost:5050`) broadcasting connected stream events.
2. `frontend/js/config.js`: Resolves `getHapsWsBaseUrl()` (`ws://localhost:5050` locally, auto-upgrades to `wss://` for `https://` backends).
3. Live seatmap and telemetry feed hooks in `frontend/js/app.js`.

#### 5 Technical Learning Points:
1. **Shared HTTP + WS Server**: Attaching `ws` to the Express `http.createServer` instance avoids needing a third backend port.
2. **Protocol Auto-Derivation**: `config.js` derives `ws://` or `wss://` automatically from `getHapsApiBaseUrl()`.
3. **Broadcaster Decoupling**: `setBroadcastCallback` connects Kafka/in-memory telemetry consumers cleanly to active WebSocket clients.
4. **JSON Frame Resilience**: `try/catch` guards around incoming `ws.on('message')` prevent malformed payloads from crashing the socket hub.
5. **Cross-Origin Compatibility**: Supports WebSocket handshakes seamlessly between `localhost:3008` and `localhost:5050`.

---

### TASK-12: Headless PDF Report Generator & WhatsApp Dispatch
**Objective**: Generate printable institutional dossiers and real WhatsApp notification payloads/links for parents.

**Core Deliverables**:
1. `backend/src/services/pdfReportService.js` & `backend/src/routes/notifications.js`.
2. Direct `wa.me` link generation and configurable `WHATSAPP_API_TOKEN` / `TWILIO_ACCOUNT_SID` webhook support documented in `backend/.env.example`.

#### 5 Technical Learning Points:
1. **Zero-Browser Server Templates**: Generating print-ready HTML dossiers keeps backend memory light while letting browsers print cleanly to PDF.
2. **Phone Number Sanitization**: Normalizes 10-digit Indian numbers cleanly to `+91` E.164 format.
3. **Fallback Direct Links**: Providing `wa.me` deep links works reliably in school setups without paid WhatsApp Business API provisioning.
4. **Parent-Friendly Messaging**: Strips raw technical keys from parent WhatsApp summaries.
5. **Audit Trail Storage**: Logs every dispatch confirmation in memory with timestamp and dispatch ID.

---

### TASK-13: Full Exam Engine with 30-Question Palette Grid
**Objective**: Deliver an authentic NTA JEE/NEET and Board simulator interface with sectional switching and live attempt saving.

**Core Deliverables**:
1. `#ntaExamContainer` & `#examSubjectSwitcher` in `frontend/index.html`.
2. Question palette state tracking (Visited, Answered, Unanswered, Marked for Review).
3. Submission pipeline posting directly to `{HAPS_API_BASE}/api/assessments/:id/submit`.

#### 5 Technical Learning Points:
1. **NTA Palette Fidelity**: Builds familiarity with official competitive CBT navigation patterns.
2. **Per-Question Dwell Timing**: Captures option toggles and time spent per item cleanly.
3. **Section Filtering**: Switches seamlessly across Physics, Chemistry, and Mathematics sections.
4. **Responsive Audit Awareness**: Tracked mobile viewport stacking needs on `#ntaExamContainer` inside `log.md`.
5. **CORS Submission Safety**: Cross-port test submissions work transparently from `:3008` to `:5050`.

---

### TASK-14: Multi-LLM Question Engine & Class 10 NCERT Mapping
**Objective**: Combine Groq LPU speed, Google Gemini reasoning, and a compiled 438-question Class 10 Math PYQ/NCERT offline bank.

**Core Deliverables**:
1. `backend/src/services/llmQuestionEngine.js` & `class10PyqBank.js` & `class10MathQuestionBank.js`.
2. Python question bank compiler suite in `backend/scripts/` (`compile_class10_math_bank.py`, `bank_chapters_*.py`, `bank_ncert_*.py`).
3. `backend/scripts/test_evaluator.js` (8 integration assertions verified passing).

#### 5 Technical Learning Points:
1. **Deterministic Bank Compilation**: Python bank scripts compile 438 normalized questions cleanly into both JS modules (`src/services/`) and SQL seeds (`src/database/`).
2. **Cascading LLM Resilience**: Automatically fails over from Groq -> Gemini -> local curated NCERT bank when offline.
3. **JSON Extraction Repair**: `cleanAndParseJson` strips markdown fences and repairs unescaped LaTeX delimiters.
4. **NCERT Citation Grounding**: Every curated question tracks exact NCERT textbook chapters, sections, and page numbers.
5. **Subtopic Bank Filtering**: Dedicated `/api/questions/class10-math-bank` endpoint filters by chapter, source, format, and keyword.

---

### TASK-15: Dual-Repo Separation, Cross-Port Architecture & Workspace Consolidation
**Objective**: Divide the monolithic repository cleanly into two standalone folders (`frontend/` and `backend/`, moving `database/` inside `backend/`), wire cross-port communication (`:3008` <-> `:5050`), remove duplicate clones and root clutter, and establish `log.md` governance.

**Core Deliverables**:
1. Moved `database/` -> `backend/database/`, scripts into `backend/scripts/` and `frontend/scripts/`, and UI agent rules into `frontend/.agents/`.
2. Created `frontend/server.js`, `frontend/package.json`, `frontend/js/config.js`, and `frontend/.env.example`.
3. Hardened `backend/src/server.js` as a pure API/WS gateway with configurable `CORS_ORIGIN`, added missing deps (`@google/genai`, `docx`, `msedge-tts`) to `backend/package.json`, and updated `backend/.env.example`.
4. Removed duplicate nested clone `school_student_system-SSS-/`, root monolith configs (`api/`, `vercel.json`, root `package.json`, `k8s/`, `.github/`, `docker-compose*.yml`), and cleaned root down to `backend/`, `frontend/`, `.gitignore`, `README.md`, and `log.md`.
5. Restored and fully updated `ARCHITECTURE_EXCALIDRAW_MERMAID.md`, `INTERN_ONBOARDING_GUIDE.md`, and `TASKS.md` inside both `frontend/` and `backend/`.

#### 5 Technical Learning Points:
1. **True Repository Isolation**: Moving every dependency, database schema, script, and doc into `frontend/` and `backend/` guarantees either folder can be initialized as its own independent Git repository immediately.
2. **Centralized Runtime Config (`config.js`)**: Putting API/WS URL resolution in one script shared by both `index.html` and `whiteboard.html` avoids scattered hardcoded URLs and eases cloud deployment later.
3. **Eliminating Relative `/api/` Assumptions**: Auditing every `fetch()` across HTML, JS, JSX, and pre-built bundles caught hidden relative requests (e.g. `whiteboard.html` telemetry & `app.js` solve-and-sync) that break across different ports.
4. **Resilient Standalone Tests**: Guarding cross-repo checks with `fs.existsSync(...)` allows test suites inside `backend/scripts/` to succeed even after `frontend/` moves to a separate repo/machine.
5. **Continuous Documentation Discipline**: Maintaining `log.md` at root alongside synchronized `.md` docs in both folders ensures every developer and AI agent works from an accurate source of truth.

---

### TASK-16: Full-Stack Bugfix, CBSE/JEE Scoring Fix & UI/WCAG Remediation
**Objective**: Fix every verified backend and frontend defect identified in the full-system audit across data banks, board-specific scoring, runtime initialization, navigation/modals, responsive breakpoints, design tokens, and WCAG 2.2 AA accessibility.

**Core Deliverables**:
1. `backend/src/database/custom_injected_questions.json` & `backend/src/routes/assessments.js`: Completed 4-option Nernst equation options on `snr_c_inj_1793801747344_553` and replaced hardcoded `+4/-1` marking with board-aware CBSE/HPBOSE non-negative vs. JEE/NEET negative marking.
2. `backend/src/services/{aiVoiceTutorService,llmQuestionEngine,questionInjectionService}.js`: Safe `try/catch` guards around `require('dotenv').config()`.
3. `frontend/js/app.js` & `frontend/index.html`: Null-guarded legacy preview functions, preserved Director role in `switchTeacherTab()`, normalized legacy tab IDs, populated `#modalStudentIndividualReport` in `openStudentDrilldown()`, wired `#btnDrilldownSendWhatsApp`, restored `#studentPortalNav` and Question Bank filter controls, replaced hardcoded `alert()` buttons, and routed printable handouts through local `vendor/katex/`.
4. `frontend/css/styles.css` & `frontend/js/app.js`: Defined `--bg-surface`, `--accent-red`, and `--font-mono`; added `@media (max-width: 768px)` single-column rules and responsive modal graph grids; added full ARIA labels, keyboard `role="button"`/`tabindex="0"` handlers for `.palette-btn`, and `verifyInteractiveControlAccessibility()`.

#### 5 Technical Learning Points:
1. **Board-Specific Assessment Rubrics**: Competitive exams (JEE/NEET) apply `-1` negative marking while CBSE/HPBOSE board tests require non-negative mark totals (`Math.max(0, rawScore)`).
2. **Defensive DOM Hydration**: Guarding legacy element queries prevents single missing IDs during refactors from aborting `DOMContentLoaded` initialization.
3. **Role Preservation Across Shared Views**: Allowing `'director'` to open shared teacher workspace tabs prevents accidental privilege demotion during portal navigation.
4. **Fluid CSS Grid & Token Discipline**: Using `minmax(min(100%, 340px), 1fr)` and complete `:root` / `[data-theme="dark"]` variables eliminates 360px horizontal overflow without sacrificing desktop multi-column layouts.
5. **Programmatic Accessibility Verification**: Auditing labels, button types, and keyboard Enter/Space support in automated DOM scripts catches interactive gaps before browser QA.

---

### TASK-17: Live AI Model Tuning & Chrome End-to-End QA Follow-Ups
**Objective**: Tune Gemini/Groq failover for live API keys, resolve every UI, KaTeX, modal-stacking, Board Paper, Voice Tutor, and `360x800` responsive bug discovered during Chrome testing, and re-verify end-to-end across `http://localhost:3008` and `http://localhost:5050`.

**Core Deliverables**:
1. **Live AI & Voice Tutor Synchronization (`backend/src/services/llmQuestionEngine.js`, `questionInjectionService.js`, `aiVoiceTutorService.js`, `routes/questions.js`, `routes/voiceTutor.js`):** Updated Gemini chain to `['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']`, preserved letter `correct_answer` (`A`–`D`), added Electrostatics/Dipole Smartboard template before `'circuit'`, excluded electrostatics/optics/circuit prompts from `rolling_incline`, and eliminated duplicate concurrent `solve-and-sync` requests.
2. **KaTeX, SVG, & LaTeX Escaping Fixes (`frontend/js/app.js`, `frontend/index.html`):** Preserved KaTeX SVG `<path d="...">` newlines, fixed `isFormulaString()` so HPBOSE bilingual headers render upright, fixed Student/Smart Report `\t/\f/\v` escape issues and `B_{\text{end}}` rendering, and targeted `#rubricStepsList` so `#btnApproveHandwritten` listeners remain active.
3. **Portal Navigation, Modal Stacking, & Non-Blocking Toasts (`frontend/css/styles.css`, `frontend/js/app.js`, `frontend/server.js`):** Styled fixed `.role-switch-toast`, replaced blocking `alert()` calls with `showToast()`, raised `#whatsAppModal` to `z-index: 10025`, enabled desktop `#studentPortalNav`, added `/favicon.ico` SVG response (`200`), preserved Director/Student header identities, fixed context-aware Physics `"Practice Formula"` drills, and added CBSE `+4 / 0` badges.
4. **Board Paper CRUD & `360x800` Responsive Grid Fixes (`backend/src/services/boardPaperGeneratorService.js`, `frontend/js/app.js`, `frontend/css/styles.css`):** Resolved swap collision (`openBoardSwapQuestionModal`), synchronized custom question `id` and optional 1M MCQs for `PUT`/`DELETE` (`200`), fixed HPBOSE Hindi subject subtitle mapping, and collapsed mobile grids/filters cleanly (`scrollWidth === 360` verified across all 6 Chrome `360x800` test views).

#### 5 Technical Learning Points:
1. **Empirical Latency Benchmarking Over Guessing**: Testing live `/v1beta/models` latency showed `gemini-flash-lite-latest` (~2.4s) and `gemini-3.5-flash-lite` (~3.0s) complete quickly while legacy aliases timed out.
2. **Non-Destructive Math Rendering**: Running `innerHTML = renderLatexString(...)` on interactive containers strips attached `addEventListener` handlers; scoping math typesetting to leaf containers like `#rubricStepsList` keeps buttons alive.
3. **Client-Server Custom Entity IDs**: Matching client-generated `q_custom_*` IDs with backend persistence prevents `404`/`500` mismatches on subsequent edits or deletions.
4. **End-to-End Flow Fidelity**: Checking calculated totals alongside header/item badges caught CBSE UI labels that still showed `-1 Mark` despite `4/12` non-negative backend scoring.
5. **Responsive Measurement Beyond Static CSS**: Emulating `360x800` in Chrome caught fixed `min-width` controls and uncollapsed grids (`378px`, `731px`), confirming `360px` fit after remediation.

---

### TASK-18: Full Mobile Viewport (`360x800`) UI, Modal, Grid & Whiteboard Remediation
**Objective**: Audit every portal, tab, modal, card, KaTeX formula container, chart grid, and `/whiteboard` view at `360x800` mobile resolution (while preserving `1440x900` desktop parity) and fix every horizontal overflow, clipping, touch-target, and HUD collision issue.

**Core Deliverables**:
1. `frontend/css/styles.css` & `frontend/index.html`: Enabled fluid header wrapping (`min-height: 54px; height: auto`), intrinsic responsive grids (`minmax(min(Xpx, 100%), 1fr)`), `.grid-4col` tablet (`2`-col) & phone (`1`-col) stacking, `.two-col-form-grid > *` explicit single-track span on `<= 768px`, contained `.board-paper-sheet`, `.chart-card`, `#modalEditPaperQuestion`, `#modalInjectQuestion`, `#modalDiagnosticResults`, `.katex-display`, and compact horizontally scrollable `.quick-question-number-strip` inside `#ntaExamContainer`.
2. `frontend/js/app.js`: Wrapped dynamic header rows, unit test draft studio option grids, `#modalSelectAlternativeQuestion` candidate rows, `#remFormulaDrillsContainer` verify controls, `#voiceInterruptionArea_*` input + `"Speak"`/`"Ask Doubt"` controls, and added scrollable wrappers (`.diag-formula-scroll` & question stem boxes) inside diagnostic reports.
3. `frontend/whiteboard.html`: Switched `<= 768px` layout to a `100dvh` flex column overriding tldraw's internal `position: fixed; inset: 0;` mount wrapper (`#root > div`), stacking `#whiteboard-overlay-badge`, `#whiteboard-quick-actions`, `#root`, and `#whiteboard-diagnostic-panel` cleanly with `>= 36px` touch targets and non-blocking clipboard feedback.

#### 5 Technical Learning Points:
1. **Explicit Grid Span Overrides Under Single-Column Breakpoints**: Leaving `style="grid-column: span 2;"` active inside a `1fr` mobile grid forces CSS Grid to synthesize an implicit crushed second track (`17.6px`); overriding `grid-column: 1 / -1` eliminates the hidden track.
2. **`minmax(min(Xpx, 100%), 1fr)` Prevents Narrow-Container Overflows**: Auto-fit tracks wider than a nested mobile card padding box (`280px` inside `237px`) overflow unless bounded with `min(..., 100%)`.
3. **Inline vs. Display Math Containment**: Clamping `max-width: 100%` on inline `.katex` while KaTeX enforces `white-space: nowrap` forces element scrollbars; instead keep `.katex` natural width inside `overflow-x: auto` formula boxes (`diag-formula-scroll`, `.katex-display`) and flex children with `min-width: 0`.
4. **Flex & Grid `min-width: 0` Discipline**: Unbounded flex/grid children expand past viewport margins whenever wide buttons, select labels, or KaTeX equations appear unless every ancestor chain sets `min-width: 0`.
5. **Containing Embedded Fixed-Position Libraries**: React mounts wrapping `tldraw` with `position: fixed; inset: 0` ignore flex parent sizing unless explicitly reset to `position: relative; inset: auto` inside mobile media queries.

---

### TASK-19: Full Desktop & Mobile E2E Audit (14 Bug Fixes & Live Re-QA)
**Objective**: Resolve all 14 functional, data-integrity, Board Paper Studio, Voice Tutor, Remedial routing, WhatsApp encoding, KaTeX DOM corruption, and portal synchronization issues found in full Chrome Desktop (`1440x900`) and Mobile (`360x800`) testing.

**Core Deliverables**:
1. `backend/src/services/boardPaperGeneratorService.js` & `remedialAssignmentService.js` & `routes/{voiceTutor,notifications}.js`: Added Class 12 Mathematics CBSE/HPBOSE blueprints, grade-isolated question pools, strict 1-Mark MCQ enforcement (`inferQuestionMarks()`), `v1alpha` Gemini Live ephemeral token endpoint, Physics/Optics/Circuit remedial formula mappings, and sanitized WhatsApp dispatch payloads.
2. `frontend/js/app.js`, `frontend/js/geminiLiveVoiceTutor.js`, & `frontend/index.html`: Upgraded `renderMathInElement()` to a safe DOM `TreeWalker` over text nodes; moved LaTeX payloads off `onclick="..."` into `data-*` attributes; synced Mode 2 faculty switches, Custom Q section/marks/options modal, Tier count pills, Student exam auto-load/hints/review studio footer/completed test history/remedial directives, dynamic Question Bank drawer badge, and Voice Tutor neural fallback.

#### 5 Technical Learning Points:
1. **DOM `TreeWalker` Math Rendering vs. `innerHTML` Rewrites**: Mutating `element.innerHTML` for KaTeX substitution corrupts inline JS event attributes and strips attached `.onclick` listeners; walking `NodeFilter.SHOW_TEXT` nodes preserves attributes and DOM listeners cleanly.
2. **HTML `data-*` Attributes for Dynamic Payloads**: Passing LaTeX or punctuated expressions via `data-*` attributes + `this.dataset` avoids string escaping errors and DOM serializer conflicts inside inline handlers.
3. **Ephemeral Token API Versioning**: Gemini Multimodal Live `BidiGenerateContentConstrained` sockets require `apiVersion: 'v1alpha'` both when minting ephemeral tokens and in the WebSocket endpoint URL.
4. **Blueprint Mark Type Validation**: Checking inferred mark weights alongside `options_latex` prevents multi-mark derivations with sample options from leaking into 1-mark Section A MCQ slots.
5. **Cross-Portal Role-Aware Shared Modals**: Shared dialogs like `#modalStepSolutionStudio` must explicitly reset footer CTAs (`Assign as Practice Quiz` vs. `Close Review`) by caller context or active role.

---

### TASK-20: Student AI Whiteboard Studio & Live Doubt Workspace
**Objective**: Replace the non-interactive Student AI Smartboard iframe stub with full topic discovery (Class -> Subject -> keyword Topic Search), canvas playback controls, synchronized KaTeX step cards, and a live Hinglish Ask-Any-Doubt panel on Desktop (`1440x900`) and Mobile (`360x800`).

**Core Deliverables**:
1. `frontend/index.html`, `frontend/css/styles.css`, `frontend/whiteboard.html`, & `frontend/js/app.js`: Added Class (`10`/`11`/`12`) + Subject + Chapter-prefixed Topic Search & clickable pills, `Prev`/`Pause-Play`/`Next`/`Full Board`/`Zoom Fit`/`Clear`/`Listen AI`/`Live Class` controls, KaTeX step cards, **Ask Any Doubt** panel (`POST /api/voice-tutor/interrupt` + whiteboard `HIGHLIGHT_DOUBT`), async request/generation cancellation guards, and `360x800` touch targets (`>= 36px`).
2. `backend/src/routes/voiceTutor.js` & `backend/src/services/aiVoiceTutorService.js`: Added Class/Subject/Chapter/Topic context forwarding on `/interrupt`, unified `callVoiceTutorJsonModel()` prioritizing `openai/gpt-oss-20b` with `openai/gpt-oss-120b` & `gemini-2.5-flash` fallbacks, and optics sign-convention fallback handling.

#### 5 Technical Learning Points:
1. **Stale Request Cancellation on Fast Filters**: Assigning monotonically increasing request/generation IDs (`topicsRequestId`, `teachRequestId`, `doubtGenerationId`) prevents earlier async fetches from overwriting newer Class selections or cleared Doubt threads.
2. **Hidden Iframe Handshake & Resize Recovery**: Listening for `WHITEBOARD_READY` at top-level load and re-triggering `ZOOM_FIT` / fallback canvas resize prevents zero-dimension canvas initialization inside initially hidden tabs.
3. **LLM Model Order vs. Timeout Budgets**: Placing fast verified JSON-capable models (`openai/gpt-oss-20b`, `~1.2s`) ahead of deprecated/slower endpoints avoids sequential 404/timeout delays inside real-time classroom interruption paths.
4. **Disambiguating Repeated Syllabus Topic Names**: Prefixing `<option>` text with `Ch X - ` prevents identical subtopic titles (e.g., `"Introduction"` across chapters) from becoming indistinguishable inside native `<select>` dropdowns.
5. **Touchable Pill Controls on Narrow Screens**: Topic pills and inline audio replay buttons inside chat bubbles require explicit `>= 36px` mobile height overrides under `<= 768px` breakpoints.

---

### TASK-21: Standalone CI/CD Pipelines & Security Automation
**Objective**: Build enterprise-grade, standalone GitHub Actions CI/CD workflows and Dependabot configuration for the decoupled backend repository (`backend/`) with zero root-level dependencies or cross-repository coupling.

**Core Deliverables**:
1. `backend/.github/workflows/ci.yml`: 7 discrete jobs (`unit-integration`, `live-server`, `postgres-integration`, `network-integration`, `security-scan`, `codeql-analysis`, `docker-build-smoke`). Runs on Node 20 with `npm ci`, in-memory fallback testing, live `verify_staging.js` gate on port 5050, Trivy container vulnerability scanning (`HIGH,CRITICAL`), and artifact capture on failure.
2. `backend/.github/workflows/cd.yml`: Release deployment pipeline triggered on semver tags (`v*.*.*`) and workflow dispatch. Builds and publishes multi-platform container to GHCR, performs automated staging deployment and gate check, and supports protected production deployments with manual approvals and documented rollback runbooks.
3. `backend/.github/dependabot.yml`: Automated weekly dependency audits and PR creation for npm packages, Docker base images, and GitHub Actions.

#### 5 Technical Learning Points:
1. **Standalone Repository Boundaries**: Removing all `../` paths ensures that once `git init` is run inside `backend/`, the repository can build, test, and deploy completely autonomously in any cloud runner.
2. **PostgreSQL 16 Service Container Lifecycle**: Using GitHub Actions native `services:` with health checks (`pg_isready`) guarantees clean schema and seed migrations before API server initialization.
3. **Non-Blocking External Network Tests**: Isolating network-dependent synthetic voice services (`msedge-tts`) into dedicated jobs with `continue-on-error: true` protects CI stability against upstream third-party network outages.
4. **Live Verification Gate before Deployment Approval**: Probing both API metadata (`/api/health`) and comprehensive domain features via `verify_staging.js` acts as an automated promotion gate before artifacts transition to production environments.
5. **Container Security Scanning in CI**: Scanning Docker images with Trivy directly following the Buildx layer compilation catches vulnerable base image libraries before pushing to GHCR.

---

### TASK-22: Multi-Tenant Dual-Mode Architecture (Board vs Competitive)
**Objective**: Let any school customise curriculum tracks, exam formats and available tools without code changes, following `multi-tenant-dual-mode-architecture.md`.

**Core Deliverables**:
1. Backend registry (`backend/src/registry/`): tenant profiles (`sch_unisole_001`, sample `sch_demo_board_only`), exam pattern templates (CBSE, HP Board, ICSE [no content], JEE Main, NEET UG), and the workspace tab registry with per-mode feature flags.
2. Backend services and APIs: `tenantConfigService`, `examPatternRegistry` (now drives assessment negative marking), `canonicalContentService` (`curriculum_content` projection), Module Registry (`dpp`, `roadmap`, `cheatsheets`, `ncert_core`, `rank_analytics`), and `/api/tenant/*`, `/api/templates/*`, `/api/content`, `/api/modules/*`, plus `?mode=` filtering on `/api/questions`.
3. Database: `schools`, `curriculum_content` (GIN lookup index), `dpp_attempts`, seed rows and `scripts/sync_curriculum_content.js`.
4. Frontend: `js/dualModeEngine.js` + `css/dual-mode.css` header mode pill, track sub-selector, feature-flag tab filtering (Scan Paper Sheets hidden in Competitive), drawer Mode Tools and Module Workspace for teachers and students. AI Smartboard and `js/app.js` unchanged.
5. Verification: `npm run test:dual-mode` (34 checks) in CI, PostgreSQL schema/sync check, headless Chrome QA at 1440x900 and 360x800.

**Open follow-ups**: load ICSE content and blueprints; add native JEE Chemistry/Mathematics and NEET objective questions (current DPP pools are 1-2 questions for JEE Chemistry/Maths); persist DPP attempts to `dpp_attempts` when PostgreSQL is live; tune rank curves yearly from published results.

#### 5 Technical Learning Points:
1. **Configuration over Code**: Feature flags per mode in a tenant JSON profile let the same build serve a board-only day school and a JEE/NEET coaching wing; adding a school is adding a file.
2. **One Canonical Content Model**: Tagging each question with `target_modes`, `board_targets` and `competitive_targets` avoids duplicate endpoints; a GIN index on the three arrays keeps mode/stream lookups indexed in PostgreSQL.
3. **Pattern-Driven Scoring**: Resolving marking from an exam pattern registry (with explicit overrides first and a legacy fallback last) changes scoring rules without touching the evaluator.
4. **Deterministic Daily Sets**: Seeding the DPP shuffle with date + school + track + subject gives every student in a class the same set, lets the server re-derive it on submit (tamper-proof), and survives restarts without storage.
5. **Non-Invasive Frontend Extension**: The mode engine reads host state, reuses existing tab containers and drawer card styles, and stays hidden when the backend is unavailable, so a 25k-line `app.js` is extended without editing it.

---

### TASK-23: Full-Project Audit: Content Isolation, Live Class Data & Seed Fixes
**Objective**: Find and fix everything not working across the whole project, keeping every user's content isolated (teachers see only their subject and classes, students only their class). AI Smartboard untouched.

**Core Deliverables**:
1. Audit tooling run: headless-Chrome explorer over all roles/tabs/buttons/dropdowns/modals, an end-to-end publish-submit-review flow, and an API isolation sweep for all 6 faculty.
2. Backend `src/services/subjectScope.js` applied to `/api/curriculum/students`, `/api/assessments`, `/api/analytics/class-dashboard`, `/api/curriculum/generate-test`, `/api/assessments/unit-test/generate-draft`, `/api/assessments/board-paper/generate`; new `/api/analytics/student/:id/submissions`.
3. Frontend live class sync replacing demo Recorded Tests / Assigned Tests / Rosters, real student Previous Tests, and removal of all cross-subject fallbacks.
4. Seed data corrections (Class 10 Science test section and submissions; Class 10 Maths default class).

**Open follow-ups**: replace native confirm/prompt dialogs with in-app modals; update the two stale tests (`test_teacher_auth_and_class_management.js`, `test_class10_sync_and_banks.js`) once the intended default classes are confirmed; real authentication (phone lookup only today).

#### 5 Technical Learning Points:
1. **One Scope Rule**: Deriving teacher scope from each class's `subjects` list in one service keeps every endpoint consistent; per-route string matching had drifted (e.g. Maths matching Class 10 Maths).
2. **Never Fall Back Across Tenants of Data**: "show something rather than nothing" fallbacks were the main isolation leak; an empty state is the correct answer.
3. **Validate Writes, Not Just Reads**: test creation must check both the teacher's scope and whether the class studies the subject.
4. **Demo Data Hides Broken Flows**: hardcoded result tables made the app look complete while real submissions never reached teachers; wiring views to the backend exposed and fixed the flow.
5. **Seed Integrity Matters for Isolation**: submissions pointing at students from another class silently leaked data into the wrong portals.

---
