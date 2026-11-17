# Unisole AI School: Enterprise Engineering Onboarding Guide
**Document Version:** 3.0.0 (Decoupled Frontend & Backend Architecture)  
**Target Audience:** Software Engineering Interns, Full-Stack Developers, AI/ML Engineers  
**Architecture Split:** Standalone `frontend/` (`:3008`) and Standalone `backend/` (`:5050`, including `database/`)  
**Author:** Unisole Skill AI Labs Engineering Team

---

## Table of Contents
1. [Project Overview & Domain Context](#1-project-overview--domain-context)
2. [Technology Stack & Architectural Rationale](#2-technology-stack--architectural-rationale)
3. [Backend Low-Level Design (LLD)](#3-backend-low-level-design-lld)
4. [Database Architecture & Complete Table Schemas](#4-database-architecture--complete-table-schemas)
5. [Frontend & Functional Modular Sections](#5-frontend--functional-modular-sections)
6. [Cross-Port Architecture, CORS & Independent Deployment](#6-cross-port-architecture-cors--independent-deployment)
7. [Local Laptop Setup (Separate Ports)](#7-local-laptop-setup-separate-ports)
8. [Automated Testing & Verification Suite](#8-automated-testing--verification-suite)
9. [Intern Best Practices, Git Workflow & Documentation Rules](#9-intern-best-practices-git-workflow--documentation-rules)
I. [Multi-Tenant Dual-Mode Architecture (Board vs Competitive)](#11-multi-tenant-dual-mode-architecture-board-vs-competitive)

---

## 1. Project Overview & Domain Context

### 1.1 What is Unisole AI School Scholar Assistant?
Unisole AI School (Scholar Assistant) is an enterprise-grade AI diagnostic, assessment generation, and continuous learning analytics platform designed for modern academic institutions.

The platform caters comprehensively to:
* **Senior Secondary (Class 11 & 12)**: Specializing in high-stakes competitive examinations — **JEE Main & JEE Advanced** (Non-Medical Stream) and **NEET-UG** (Medical Stream), as well as State Board and CBSE Board examinations.
* **Secondary Foundation (Class 10)**: Core focus on CBSE & State Board syllabus mastery in **Mathematics** and **Science**.

### 1.2 The Core Problem Solved
Traditional Learning Management Systems (LMS) only track whether an answer is right or wrong after submission. They fail to capture **cognitive friction** during the test, do not automate the grading of **handwritten physical examination sheets**, and provide generic scores rather than actionable interventions for hostel prep hours vs home study.

Unisole AI School solves this through five pillars:
1. **Sub-Second Student Telemetry**: Tracks hesitation time before first input, option flips (indecision), hint requests, and solving velocity. It classifies errors into *Careless Slip*, *Conceptual Gap*, *Speed Lag*, or *Untouched*.
2. **Handwritten Answer Sheet Vision AI**: Evaluates handwritten student derivations and calculation steps using Google Gemini Vision AI against formal marking rubrics, with teacher audit capabilities.
3. **Cognitive Test Generator & Board Paper Studio**: Generates balanced unit tests and full-length CBSE/HPBOSE Board papers aligned with Bloom's Taxonomy (*Remember, Understand, Apply, Analyze, Evaluate, Create*), complete with LaTeX math formulas, distractor trap options, and step-by-step scoring keys.
4. **CBSE Class 10 Question Bank & Intuitive Solution Studio**: 438 curated questions across all 14 NCERT chapters, including 310 CBSE Previous Year Questions (PYQs 2020-2024), 68 NCERT exercises, and 60 sample patterns. Includes an interactive Step-by-Step Solution Studio with Concept Keys, Step Progressions, Common Traps, and printable chapter handouts.
5. **Dual-Directive Weekly Smart Reports & Live Whiteboard**: Generates differentiated weekly action plans for School Teachers vs Parents, paired with a `tldraw`-based interactive whiteboard and Hinglish Voice Tutor.

---

## 2. Technology Stack & Architectural Rationale

| Layer | Technology | Version | Architectural Rationale ("Why This Stack") |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | Vanilla JavaScript (ES6+), HTML5 | Modern Standard | Zero heavy SPA runtime overhead in main views, predictable execution across low-spec school laptops/Chromebooks, served via standalone `frontend/server.js` (`:3008`). |
| **Frontend Styling** | Vanilla CSS3 (Custom Design System) | Native CSS | Design tokens in `:root`, dark/light theme support, CSS Grid & Flexbox, strict compliance with `DESIGN_PRINCIPLES.md`. |
| **Whiteboard Canvas** | React 19 + `tldraw` Bundle | `^5.1.1` | Pre-bundled via `esbuild` from `frontend/src_whiteboard/index.jsx` into `frontend/vendor/tldraw/tldraw-standalone.bundle.js` for instant zero-build serving. |
| **Math Rendering** | KaTeX (Vendored Locally) | `^0.19.1` | Vendored in `frontend/vendor/katex/`; renders LaTeX formulas synchronously 10x-100x faster than MathJax with offline resilience. |
| **Data Visualization** | Chart.js & Canvas API | CDN | HTML5 canvas rendering for mastery charts, speed-accuracy distributions, and class analytics. |
| **Backend Runtime** | Node.js (LTS) | `>=20.0.0` | Non-blocking, asynchronous event loop ideal for concurrent telemetry streaming and real-time WebSocket communication. |
| **Backend Framework**| Express.js | `^4.19.2` | Pure REST API gateway on port `5050` with configurable `CORS_ORIGIN` for decoupled frontend origins. |
| **Real-Time Telemetry**| Native WebSockets (`ws`) | `^8.17.1` | Bidirectional TCP socket streaming (`ws://localhost:5050`) broadcasting live student attempt ticks to teacher screens. |
| **Message Streaming** | Apache Kafka (KRaft mode) / In-Memory Bus | `kafkajs ^2.2.4` | Event bus for telemetry ingestion; falls back automatically to an in-memory event bus when Kafka is absent locally. |
| **Primary Database** | PostgreSQL | `16-alpine` | Relational persistence with JSONB support; schemas and seeds live in `backend/database/` (`schema.sql`, `seed_data.sql`) and `backend/src/database/`. |
| **Offline Dev DB** | Dual-Mode In-Memory Store | Custom Engine | `backend/src/config/database.js` enables instant local startup and testing without requiring live PostgreSQL. |
| **AI Multi-Modal LLM**| Google Gemini & Groq LPU | `@google/genai ^2.32.0` | Multi-modal Vision OCR, PDF/image question injection, and sub-second question generation with offline bank failover. |
| **Voice & Export** | `msedge-tts`, `docx`, `pdf-parse` | Native Node | Hinglish neural MP3 streaming, editable `.docx` exam paper export, and native PDF question extraction. |

---

## 3. Backend Low-Level Design (LLD)

### 3.1 Architecture Overview
`backend/` operates as a pure API + WebSocket gateway decoupled from static frontend hosting:

```text
Standalone Frontend (frontend/server.js -> http://localhost:3008)
       │  (Resolved centrally via frontend/js/config.js)
       ├──────────────────────────────────────────────────────┐
       ▼  Cross-Origin REST (CORS_ORIGIN)                     ▼  WebSocket
HTTP REST API Routes (backend/src/server.js :5050)     WebSocket Hub (:5050)
├── GET  /                      (Gateway Info JSON)           │
├── GET  /api/health            (Health & Specs)              ▼
├── /api/questions              (Banks, LLM, Injection)  Live Teacher Consoles
├── /api/assessments            (Unit Tests, Board Papers, Scoring, DOCX)
├── /api/curriculum             (Taxonomy, Rosters, Auth)
├── /api/analytics              (Class Dashboard, Drilldowns)
├── /api/telemetry              (Real-Time Attempt Ticks)
├── /api/handwritten & /upload  (Vision OCR Sheet Evaluation)
├── /api/reports & /notifications (Smart Reports & WhatsApp)
└── /api/voice-tutor            (Hinglish TTS, Solve Sync, Whiteboard Logs)
       │
       ▼
Service Layer (backend/src/services/)
├── class10MathQuestionBank.js   (438 questions, 14 chapters)
├── class10PyqBank.js            (CBSE/HPBOSE Class 10 PYQs)
├── class12PhysicsQuestionBank.js(Senior Secondary Physics Bank)
├── curriculumTaxonomy.js        (NCERT/CBSE/JEE/NEET hierarchy)
├── boardPaperGeneratorService.js(Full 80M/60M CBSE & HP Board papers)
├── llmQuestionEngine.js         (Groq + Gemini Dual LLM Generator)
├── questionInjectionService.js  (Text, Image, and PDF exam ingestion)
├── geminiVisionService.js       (Multi-modal handwritten OCR)
├── handwrittenEvaluator.js      (Step-by-step scoring engine)
├── remedialAssignmentService.js (Targeted practice generation)
├── aiVoiceTutorService.js       (Hinglish briefs & msedge-tts audio)
├── docxExportService.js         (Word document builder)
├── pdfReportService.js          (Printable report template builder)
└── smartReportService.js        (Dual-directive generator)
       │
       ├─────────────────────────────┐
       ▼                             ▼
Dual-Mode Data Layer           Event Streaming
├── PostgreSQL 16              └── Kafka (KRaft) / In-Memory Bus
│   (backend/database/*.sql)       ├── producer.js (telemetry-events)
└── In-Memory Store                └── consumer.js (analytics-worker)
    (src/config/database.js + src/database/custom_injected_questions.json)
```

### 3.2 Key Route Handlers & APIs

1. **Questions & Injection (`/api/questions`)**: Filterable Class 10 math/science and Senior banks, LLM generation, provider status checks, and image/PDF/text question injection.
2. **Assessments & Board Papers (`/api/assessments`)**: Unit test draft creation, publishing, submission evaluation, full board paper generation/swapping/editing, remedial drills, and `.docx` export.
3. **Curriculum & Faculty Auth (`/api/curriculum`)**: Departmental phone auth (`9816010001`–`9816010011`), isolated class rosters, hierarchical taxonomy, test generation, and synthetic attempt simulation.
4. **Telemetry & Analytics (`/api/telemetry`, `/api/analytics`)**: Attempt tick ingestion, WebSocket broadcasts, class KPI dashboards, and individual student diagnostics.
5. **Handwritten & Voice Tutor (`/api/handwritten`, `/api/upload`, `/api/voice-tutor`)**: Vision OCR sheet evaluation, neural Hinglish MP3 synthesis, whiteboard solve-and-sync, and whiteboard diagnostic logging.

### 3.3 Telemetry Classification Engine
The telemetry engine evaluates every student question attempt using accuracy and solving velocity:

$$\text{Accuracy} = \frac{\text{Marks Awarded}}{\text{Total Marks}}, \qquad \text{Velocity Ratio} = \frac{\text{Time Spent}}{\text{Benchmark Time}}$$

1. **FAST_ACCURATE**: $\text{Accuracy} \ge 0.8$ and $\text{Velocity Ratio} \le 1.3$ — Concept mastered with strong solving fluency.
2. **SLOW_ACCURATE**: $\text{Accuracy} \ge 0.8$ and $\text{Velocity Ratio} > 1.3$ — Concept understood, needs timed speed drills.
3. **FAST_CARELESS_SLIP**: Incorrect and $\text{Velocity Ratio} \le 1.3$ — Rushed attempt, sign inversion, or distractor trap.
4. **SLOW_MISCONCEPTION**: Incorrect and $\text{Velocity Ratio} > 1.3$ — Fundamental conceptual gap; requires derivation review.
5. **UNTOUCHED**: Attempt skipped or timed out.

---

## 4. Database Architecture & Complete Table Schemas

All SQL schema definitions and seeds now reside inside **`backend/`**:
- **Primary Schema & Institutional Seed:** `backend/database/schema.sql` & `backend/database/seed_data.sql`
- **Bank Migrations & Custom Disk Persistence:** `backend/src/database/schema_subject_banks.sql`, `backend/src/database/seed_class10_maths_pyq_ncert.sql`, `backend/src/database/custom_injected_questions.json`
- **Runtime Client & In-Memory Fallback:** `backend/src/config/database.js`

The PostgreSQL 16 relational schema comprises **12 core tables** plus **3 multi-tenant dual-mode tables** (`schools`, `curriculum_content`, `dpp_attempts`; see Section 11):

```text
                           +-------------------+
                           |       users       |
                           +---------+---------+
                                     | 1
              +----------------------+----------------------+
              | n                                           | n
    +---------v---------+                         +---------v---------+
    |    assessments    |                         |  concept_mastery  |
    +----+---------+----+                         +-------------------+
         | 1       | 1
         |         +-----------------------+
         | n                               | n
+--------v---------------+       +---------v--------------------+
|  assessment_questions  |       |  student_question_telemetry  |
+--------+---------------+       +------------------------------+
         | n                               | n
         | 1                               | 1
+--------v---------+                       |
|    questions     <-----------------------+
+--------+---------+
         | n
+--------v---------+
|    subtopics     |
+--------+---------+
         | n
+--------v---------+
|      topics      |
+--------+---------+
         | n
+--------v---------+
|     subjects     |
+--------+---------+
         | n
+--------v---------+
|     classes      |
+------------------+
```

### Table Summary (`backend/database/schema.sql`)
1. `users`: Students, teachers, parents, directors, and admins with UUID PKs, grade, section, board, target exam, and contact info.
2. `classes`: Institutional cohorts (`Class X`, `Class XI`, `Class XII`) and streams.
3. `subjects`: Disciplines mapped to classes (`Physics`, `Chemistry`, `Mathematics`, `Biology`, `Science`).
4. `topics`: Curriculum chapters per subject.
5. `subtopics`: Granular learning objectives with `expected_benchmark_seconds`.
6. `questions`: LaTeX questions, `JSONB` option/trap objects (`options_latex`), `socratic_hints`, and `marking_rubric`.
7. `assessments`: Published or draft tests with board, marks, duration, and learning mode.
8. `assessment_questions`: Ordered question mapping per assessment with positive/negative marks.
9. `student_question_telemetry`: Per-question timer ticks, hesitation delay, option flips, hints used, and category classification.
10. `concept_mastery`: Aggregated student mastery (`MASTERED`, `NEEDS_RECAP`, `CRITICAL_WEAKNESS`).
11. `handwritten_evaluations`: Uploaded sheet OCR LaTeX, step breakdown `JSONB`, error type, AI confidence, and teacher verification override.
12. `weekly_smart_reports`: Dual-directive weekly reports separating `school_hostel_actions` from `parent_actions`.

---

## 5. Frontend & Functional Modular Sections

`frontend/` runs as a standalone web application served on port `3008` via `frontend/server.js`.

### Core Entry & Configuration Files
* `frontend/server.js`: Zero-dependency Node HTTP server on port `3008` with `/whiteboard` clean-URL mapping, path traversal protection, and SPA fallback.
* `frontend/js/config.js`: Centralized API & WebSocket base resolver loaded by **both** `index.html` and `whiteboard.html`. Resolves in order: `window.HAPS_API_BASE` → `HAPS_CONFIG.BACKEND_URL` → `?apiBase=` URL query parameter → `localStorage.haps_backend_url` → `http://localhost:5050` (when local) → `window.location.origin`.
* `frontend/index.html` & `frontend/js/app.js`: Role-based Teacher, Student, and Principal portals with KaTeX rendering and Chart.js visualizations.
* `frontend/whiteboard.html` & `frontend/src_whiteboard/index.jsx`: Local `tldraw` interactive whiteboard bundled to `frontend/vendor/tldraw/tldraw-standalone.bundle.js`.
* `frontend/js/geminiLiveVoiceTutor.js`: Full-duplex Gemini Multimodal Live voice assistant client.
* `frontend/.agents/rules/design_principles.md` & `frontend/DESIGN_PRINCIPLES.md`: Mandatory UI/UX design token, responsive layout, and WCAG 2.2 AA standards.

### Functional Views & Key Features
1. **Unified Paper Studio & Test Builder (`#tabTeacherCreateTestAndPaper`)**: Lets teachers build quick topic tests, generate full 80M/60M CBSE or HP Board papers, swap/edit questions, and export `.docx` or printable handouts.
2. **Question Bank & PYQs (`#tabQuestionBank`)**: Interactive bank covering 438 Class 10 Mathematics questions plus Senior Secondary Science/Math banks, Step-by-Step Solution Studio, and voice explanations.
3. **Class Progress & Recorded Tests (`#tabTeacherClasses`)**: Live telemetry cockpit with KPI cards, 4 Chart.js visualizations, question matrix, class roster, student performance modal (`#modalStudentIndividualReport`), and synthetic attempt simulator.
4. **Scan Paper Sheets (`#tabHandwritten`)**: Upload physical answer sheets for Vision AI rubric grading and teacher mark overrides.
5. **Student Portal (`#studentView`)**: NTA Exam Simulator (`#ntaExamContainer`), weekly report card dossier, previous tests, remedial practice drills, and an interactive **Student AI Smartboard & Doubt Studio** (`#tabStudentSmartboard`) featuring Class (`10`/`11`/`12`), Subject, & keyword Topic Search, synchronized `tldraw` canvas playback/zoom/step controls, KaTeX step cards, Hinglish voice tutoring, and live Ask-Any-Doubt pinpointing.

> **Audit Resolution Status:** Core Nov 11 items (CBSE non-negative scoring, 4-option Chemistry data, startup null guards, `.palette-btn` keyboard access, live Groq & Gemini Flash models in `llmQuestionEngine.js`/`questionInjectionService.js`, and Gemini Live voice token WebSocket handshake) are remediated and verified. Live Chrome end-to-end QA on `[2026-11-12 11:15]` identified follow-up UI/layout issues (KaTeX SVG `<path>` `<br/>` corruption, `#whatsAppModal` `z-index: 1000` behind `#modalStudentIndividualReport` `10006`, `#studentPortalNav` `display:none` on desktop `1440px`, Director view visibility mismatch, remaining `alert()` triggers in Assigned Test/Smart Report/Handwritten, Board Swap `undefined Marks`, Physics Q2 opening Biology formula drill, unescaped `\t/\f/\v` in Student Report math, `360px` mobile horizontal overflows, and `GET /favicon.ico` 404) tracked in root `log.md` and `TASKS.md` (`TASK-17`).

---

## 6. Cross-Port Architecture, CORS & Independent Deployment

Because `frontend/` and `backend/` are designed to run on different ports locally and deploy to separate repositories:

1. **Backend CORS & Origins (`backend/src/server.js`)**:
   - Reads `CORS_ORIGIN` and `FRONTEND_URL` from `backend/.env`.
   - Automatically allows `http://localhost:3008`, `http://127.0.0.1:3008`, `http://localhost:3000`, and `http://localhost:5173`.
   - When deploying separately to production, set `CORS_ORIGIN=https://your-frontend-domain.com` in the backend environment.
2. **Frontend Target Binding (`frontend/js/config.js`)**:
   - Locally on `localhost:3008`, every `fetch()` and WebSocket call automatically targets `http://localhost:5050` / `ws://localhost:5050`.
   - When deployed separately, inject `<script>window.HAPS_API_BASE = 'https://your-backend-domain.com';</script>` before `js/config.js` or store `haps_backend_url` in `localStorage`.
3. **Git Separation**:
   - Both `frontend/` and `backend/` include independent `package.json`, `README.md`, `AGENTS.md`, `GEMINI.md`, `DESIGN_PRINCIPLES.md`, `.env.example`, `Dockerfile`, and `.gitignore` files so either directory can be initialized with `git init` directly.

---

## 7. Local Laptop Setup (Separate Ports)

### Prerequisites
* **Node.js**: Version `20.0.0` or higher (`node -v`)
* **npm**: Version `10.0.0` or higher (`npm -v`)
* **Git**: Version `2.40+` (`git --version`)

### Step 1: Configure & Start the Backend (Terminal 1 — Port `5050`)
```bash
cd backend
cp .env.example .env
npm install
npm start
```
Verify backend health: `http://localhost:5050/api/health`

> **Note on PostgreSQL & Kafka in Local Dev:** `backend/.env.example` documents `DATABASE_URL` and `KAFKA_BROKERS=localhost:9092`. If Postgres or Kafka is not running locally, `kafkajs` logs initial `ECONNREFUSED` retry warnings at startup and then automatically switches to the built-in in-memory database and event bus. The server remains live on port `5050`.

### Step 2: Start the Frontend Portal (Terminal 2 — Port `3008`)
```bash
cd frontend
npm start
```
Open **`http://localhost:3008`** in your browser. It connects automatically to `http://localhost:5050` and `ws://localhost:5050`.

### Optional: Rebuild `tldraw` Whiteboard Bundle
Only needed if you edit `frontend/src_whiteboard/index.jsx`:
```bash
cd frontend
npm install
npm run build:whiteboard
```

---

## 8. Automated Testing & Verification Suite

Test scripts are now partitioned inside each respective directory:

### Backend Tests (`cd backend`)
```bash
# Core Evaluator, Multi-LLM, Vision, Smart Reports & Class 10 PYQ (8 integration checks)
npm test

# Board Question Paper Generator (CBSE 80M + HP Board 60M Bilingual)
npm run test:board-paper

# Multi-Tenant Dual-Mode Registry, Modules & Pattern Scoring (34 in-process checks)
npm run test:dual-mode

# Class 10 Math 438-Question Bank Summary (requires backend server on :5050 for HTTP check)
npm run test:math-bank

# LaTeX Options & Bank Integrity across 2,500+ options
node scripts/test_latex_rendering_and_options.js

# Live HTTP Verification Suites (against running backend :5050)
node scripts/test_voice_tutor_hinglish.js
node scripts/test_real_whatsapp_dispatch.js
node scripts/test_end_to_end_assignment_flow.js
node scripts/test_subject_isolation_and_teacher_workflow.js
node scripts/test_subject_remedial_pipeline.js

# Live HTTP/Environment Staging Smoke Gate (point to backend URL)
node scripts/verify_staging.js "http://localhost:5050"
```

### Frontend Tests (`cd frontend`)
```bash
# Intuitive Solution Card Engine & DOM Button Audit
npm test

# LaTeX Formatting, Delimiters & Rendering Suites
npm run test:latex
node scripts/test_screenshot_case.js

# Quiz Modal Hierarchy & Live API Integration (against running backend :5050)
node scripts/test_quiz_creation_and_modal_display.js
```

---

## 9. Intern Best Practices, Git Workflow & Documentation Rules

### 9.1 Core Engineering Commitments
1. **Zero Emojis Policy in Code**: Do not include emojis in production code, comments, log messages, or UI badges unless strictly adhering to clean typography.
2. **Design System Compliance**: Any UI edit must follow `DESIGN_PRINCIPLES.md` (CSS custom properties only, responsive breakpoints at 360px/768px/1024px/1440px, WCAG 2.2 AA labels and contrast). All modals, KaTeX displays (`.katex-display`, `.diag-formula-scroll`), multi-column grids (`minmax(min(Xpx, 100%), 1fr)`), and `/whiteboard` flex HUD controls must remain overflow-free down to `360x800`.
3. **Senior Secondary Subject Isolation**: Physics (`fac_phy_01`), Biology (`fac_bio_01`), Chemistry, and Class 10 Foundation faculties must never leak assessments or student rosters across streams.
4. **Defensive Programming**: Never assume nested API fields exist; guard against `null` DOM queries and network fallbacks.
5. **Safe Math Typesetting & Event Handlers**: `renderMathInElement()` walks `NodeFilter.SHOW_TEXT` nodes rather than overwriting `element.innerHTML`. Always pass dynamic or LaTeX-heavy click payloads via `data-*` attributes (`this.dataset.*`) rather than embedding `$...$` inside inline `onclick="..."` strings.
6. **No Cross-Repo Hardcoding**: Never use bare relative `fetch('/api/...')` in frontend files or hardcoded sibling `../../frontend` paths in runtime backend code. Always route through `getApiBaseUrl()` / `config.js`.

### 9.2 Mandatory Documentation & Logging Workflow
After **every prompt or code change**:
1. Update all relevant `.md` files (`README.md`, `INTERN_ONBOARDING_GUIDE.md`, `ARCHITECTURE_EXCALIDRAW_MERMAID.md`, `TASKS.md`, etc.) in both `frontend/` and `backend/` so documentation never drifts from reality.
2. Record every architectural, file, and code change with timestamp and scope inside root **`log.md`**.

### 9.3 Preparing Separate Git Repositories
When splitting into two Git repositories:
1. Initialize `backend/` (`git init` inside `backend/`), verify `.env` is ignored by `.gitignore`, and push to your backend repo.
2. Initialize `frontend/` (`git init` inside `frontend/`), configure your deployed backend URL in `js/config.js` or runtime script tag, and push to your frontend repo.

---

## 10. Frontend CI/CD Pipelines & GitHub Actions

### 10.1 Pipeline Architecture
The frontend repository uses an independent, standalone GitHub Actions CI/CD setup:
- **CI (`.github/workflows/ci.yml`)**:
  - `build-and-test`: Executes `npm test`, `npm run test:latex`, `node scripts/test_screenshot_case.js`, `npm run build:whiteboard` + `git diff --exit-code vendor/tldraw/tldraw-standalone.bundle.js`, and `node scripts/test_static_guards.js`.
  - `server-smoke-test`: Starts `server.js` on port 3008, verifies `/` and `/whiteboard` return HTTP 200, and captures logs on failure.
  - `playwright-overflow-check`: Non-blocking (`continue-on-error: true`) viewport responsiveness test for horizontal overflow at 360, 768, 1024, and 1440 px widths.
  - `live-backend-integration`: Triggered on demand via `workflow_dispatch` taking a `backend_url` input pointing to a deployed staging backend (runs `test_quiz_creation_and_modal_display.js` without checking out backend repo).
  - `security-scan`: `npm audit --audit-level=high` and Gitleaks secret scanning.
  - `codeql-analysis`: CodeQL SAST scanning for JavaScript and HTML.
- **CD (`.github/workflows/cd.yml`)**:
  - Triggers on semver tags (`v*.*.*`) and manual dispatch.
  - Generates release tarball `haps-frontend-<tag>.tar.gz` and publishes artifact.
  - Automated deployment to `staging`, injecting `window.HAPS_API_BASE` at deploy time.
  - Manual approval deployment to `production`.
- **Dependabot (`.github/dependabot.yml`)**:
  - Weekly dependency updates for npm packages and GitHub Actions.

### 10.2 Secrets and Variables Checklist
- Secrets: `DEPLOY_TOKEN`.
- Variables: `STAGING_BACKEND_URL`, `STAGING_FRONTEND_URL`, `PRODUCTION_BACKEND_URL`, `PRODUCTION_FRONTEND_URL`.

### 10.3 Branch Protection Setup
Once GitHub access is established:
1. Require pull request reviews before merging into `main`.
2. Require the core CI jobs (`build-and-test`, `server-smoke-test`, `security-scan`, `codeql-analysis`) to pass.
3. Restrict branch deletions and force pushes on `main`.

---
## 11. Multi-Tenant Dual-Mode Architecture (Board vs Competitive)

Added 2026-11-16 (TASK-22). Blueprint: `multi-tenant-dual-mode-architecture.md`. A school's modes, boards, streams, tabs and tools come from data, not code.

### 11.1 Backend Registry (`backend/src/registry/`)
| File | Purpose |
| :--- | :--- |
| `tenants/<schoolId>.json` | School profile: `activeModes`, `defaultMode`, `boardConfig` (`enabledBoards`, `defaultBoard`, `eligibleGrades`, `features`), `competitiveConfig` (`enabledStreams`, `defaultStream`, `eligibleGrades`, `features`, `dpp`). Add a school by adding a file. |
| `templates/exam_patterns.json` | Exam Pattern Template Registry: CBSE_BOARD, HP_BOARD, ICSE_BOARD (no content yet), JEE_MAIN, NEET_UG. Sections, marking (+4/-1 vs step marking), blueprint refs, indicative rank curves. `POST /api/assessments/:id/submit` reads negative marking from here. |
| `workspace_tabs.json` | Which tabs each mode shows for teachers and students, with labels and the feature flag that gates each one (e.g. `scanSheets` uses `scanPaperSheets`, which is `false` in Competitive). |

School resolution per request: `x-school-id` header, then `?schoolId=`, then Host subdomain, then `DEFAULT_SCHOOL_ID`, then `sch_unisole_001`.

### 11.2 Canonical Content & Modules
- `services/canonicalContentService.js` maps every bank question to the `curriculum_content` model (`target_modes`, `board_targets`, `competitive_targets`). CBSE content also serves HP_BOARD (NCERT-aligned). ICSE is never inferred. Class 11/12 board MCQs are also offered to Competitive practice as `DERIVED_BOARD_MCQ`.
- `src/modules/` Module Registry: `dpp` (daily practice + streaks + chapter PYQs), `roadmap` (Term milestones or weightage ranking + countdown), `cheatsheets` (flashcards or formula sheets), `ncert_core` (NCERT sections + traps), `rank_analytics` (indicative percentile/rank, teacher only).
- Endpoints: `GET /api/tenant/config`, `GET /api/tenant/workspace`, `GET /api/templates/exam-patterns`, `GET /api/content`, `GET /api/modules/:moduleId`, `POST /api/modules/dpp/submit`, `GET /api/modules/dpp/streak`. `GET /api/questions` and `/api/questions/subject-banks/:key` accept `?mode=BOARD&board=CBSE` or `?mode=COMPETITIVE&stream=JEE`.
- Gating: unknown school 404; mode/board/stream not enabled 400; Competitive for Class 10 400 (`MODE_NOT_ELIGIBLE_FOR_GRADE`); feature flag off 403 (`FEATURE_DISABLED`); `teacherSubjectKey` keeps subject isolation.

### 11.3 Frontend Mode Switcher (`frontend/js/dualModeEngine.js`, `frontend/css/dual-mode.css`)
- Header `#modeSwitchBar`: Mode pill (Board Exam / Competitive Prep) + track chips (CBSE / HP Board / ICSE or JEE / NEET), accessible radiogroups with arrow keys.
- Board tabs: Create Test & Paper, Class Progress, Question Bank (PYQ + Exemplar), Scan Paper Sheets + tools (Definition & Derivation Cards, Roadmap & Milestones, NCERT & Exemplars).
- Competitive tabs: Create NTA Test, Class Progress + tools (Predictive Rank Analytics, Competitive PYQ & DPP, Formula & Cheat Sheets, Topic Weightage Roadmap, NCERT Core & Traps). Scan Paper Sheets and Question Bank are hidden; the Full Board Paper option is hidden.
- Tools open in `#tabModuleWorkspace` (teacher) or `#tabStudentModuleWorkspace` (student). `js/app.js` and the AI Smartboard are unchanged.
- Choose a school: `window.HAPS_SCHOOL_ID`, `?schoolId=`, or `localStorage.haps_school_id`. Listen for `haps:modechange`; read `window.HapsDualMode.getContext()`.

### 11.4 Database
`backend/database/schema.sql` adds `schools`, `curriculum_content` (GIN index `idx_curriculum_lookup`) and `dpp_attempts`. Populate with `node scripts/sync_curriculum_content.js` (needs `DATABASE_URL`; `--dry-run` to preview).

### 11.5 Tests
`cd backend && npm run test:dual-mode` (34 in-process checks, no server needed).

### 11.6 Content Isolation (TASK-23)
- Backend: `src/services/subjectScope.js` decides what a teacher of each subject can read or create (students, tests, analytics, test/paper generation). Out-of-scope requests return 403; a class that does not study a subject returns 400.
- Frontend: Class Progress, Assigned Tests, Rosters and student Previous Tests come from the backend for the signed-in teacher/student only (`syncTeacherClassDataFromBackend`, `loadStudentPreviousTests`). There are no fallbacks to another subject or to 12-NonMed; an empty state is shown instead.
- Always send `teacherSubjectKey` with teacher write requests.

---

---
*End of Onboarding Manual.*
