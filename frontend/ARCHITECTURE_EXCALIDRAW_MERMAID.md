# Unisole AI School - Complete Architecture Diagrams for Excalidraw

This document contains Mermaid diagram code tailored for direct import into **Excalidraw** (`Insert` -> `Mermaid` or paste).

It covers the decoupled two-part system architecture (**`frontend/` on `:3008`** + **`backend/` on `:5050`**), data flow, pedagogical engines, multi-LLM orchestration, database layout (`backend/database/` + `backend/src/database/`), and cross-port deployment workflow.

---

## How to Import into Excalidraw

1. Open [Excalidraw](https://excalidraw.com).
2. Click the three horizontal dots `...` (More Tools) in the toolbar.
3. Select **Mermaid to Excalidraw** (or press the Mermaid shortcut).
4. Copy and paste any of the diagram blocks below into the text box and click **Insert**.

---

## Diagram 1: Master Decoupled End-to-End System Architecture

This master diagram details the six architectural tiers across the independent **`frontend/`** (`http://localhost:3008`) and **`backend/`** (`http://localhost:5050`) repositories.

```mermaid
flowchart TD
    %% TIER 1: PRESENTATION LAYER (STANDALONE FRONTEND REPO - PORT 3008)
    subgraph Tier1 ["1. Standalone Frontend Repo (frontend/ - Port 3008)"]
        direction TB
        FE_Server["Static / SPA Server (frontend/server.js)\n- Port 3008 Local / Static CDN Host\n- Clean URLs (/whiteboard -> whiteboard.html)"]
        FE_Config["Central API & WS Resolver (frontend/js/config.js)\n- Priority: window.HAPS_API_BASE -> ?apiBase\n- localStorage -> localhost:5050 Default"]
        UI_Student["Student Portal\n- Diagnostic Exam Simulator\n- Interactive Socratic Hints & Voice Tutor\n- KaTeX Math + tldraw Whiteboard"]
        UI_Teacher["Teacher & Leadership Portal\n- Unified Paper Studio & Test Builder\n- Question Bank & Solution Studio\n- Class Analytics & Student Reports"]
    end

    %% TIER 2: PURE API & WEBSOCKET GATEWAY (STANDALONE BACKEND REPO - PORT 5050)
    subgraph Tier2 ["2. Standalone Backend API & WS Gateway (backend/ - Port 5050)"]
        direction TB
        GW_Router["Express 4.19 Pure API Router (/api)\n- Cross-Origin CORS (CORS_ORIGIN / FRONTEND_URL)\n- WebSocket Hub (ws://localhost:5050)\n- JSON Gateway Info at GET /"]
        GW_Auth["Teacher Faculty Auth\n- Phone Lookup (9816010001-11)\n- Subject Key Binding\n- Role Scoping (STUDENT/TEACHER/DIRECTOR)"]
        GW_Iso["Senior Secondary Isolation Guard\n- Class 10: Math & Science\n- Class 11/12: Physics/Chem/Bio\n- Prevents Cross-Subject Pollution"]
    end

    %% TIER 3: PEDAGOGICAL CORE ENGINES
    subgraph Tier3 ["3. Pedagogical Core Engines (backend/src/services)"]
        direction TB
        ENG_Taxonomy["Curriculum Taxonomy Engine\n- 14 Class 10 Math Chapters\n- Senior Secondary Boards\n- CBSE & HP Board Standards"]
        ENG_QB["Question Bank & Solution Studio\n- 438 Class 10 Math Questions\n- 310 Board PYQs (2020-2024)\n- 68 NCERT Exercises\n- Step-by-Step Derivations & Rubrics"]
        ENG_Eval["Diagnostic Evaluation Engine\n- Automated Assessment Scoring\n- Mistake Classification Engine\n- Conceptual vs Formula vs Calculation"]
        ENG_Analytics["Class Analytics & Telemetry Engine\n- Pacing Benchmark (90s / Question)\n- Class Average, Highest & Lowest KPIs\n- Action Plan: Recap vs Reteach"]
        ENG_Voice["Hinglish Voice & Whiteboard Engine\n- Edge Neural TTS Audio Streaming\n- Whiteboard Sync & Solve Telemetry\n- DOCX / Printable Handout Export"]
    end

    %% TIER 4: DUAL-ENGINE MULTI-LLM LAYER
    subgraph Tier4 ["4. Dual-Engine Multi-LLM Layer"]
        direction TB
        LLM_Router["LLM Orchestrator & Fallback Router"]
        LLM_Groq["Groq LPU Engine\n- Sub-second (~300-800ms) Generation\n- Structured JSON & Step Rubrics"]
        LLM_Gemini["Google Gemini Flash Engine\n- Multimodal Vision & PDF/Image Injection\n- Complex Math Proof Derivations\n- Live Voice & Hint Expansion"]
        LLM_Offline["Deterministic Offline Fallback\n- 438 Pre-compiled NCERT/PYQ Bank\n- Zero External Dependency Guard"]
    end

    %% TIER 5: PERSISTENCE & STREAMING LAYER (INSIDE backend/)
    subgraph Tier5 ["5. Persistence & Event Streaming Layer (backend/)"]
        direction TB
        DB_Postgres["PostgreSQL 16 Relational Store\n- Schemas & Seed SQL: backend/database/\n- Bank Migrations: backend/src/database/\n- Custom Questions JSON Store"]
        DB_InMemory["High-Speed In-Memory Store\n- Seeded Assessments & Rosters\n- Automatic Zero-Config Dev Fallback\n- Fast Integration Verification"]
        BUS_Kafka["Apache Kafka (KRaft) / In-Memory Bus\n- Optional Broker (KAFKA_BROKERS)\n- Falls back cleanly when offline"]
    end

    %% TIER 6: INDEPENDENT VERIFICATION & REPO SPLIT WORKFLOW
    subgraph Tier6 ["6. Independent Repo Testing & Deployment"]
        direction TB
        VER_FE["Frontend Verification\n- frontend/scripts/test_*.js\n- Solution Card, LaTeX, Button Audits"]
        VER_BE["Backend Verification\n- backend/scripts/test_*.js & verify_staging.js\n- Evaluator, Board Paper, Bank & API Smoke Checks"]
        DEPLOY["Independent Hosting\n- Frontend Static CDN / Node Server (:3008)\n- Backend Node API Host (:5050)\n- Connected via HAPS_API_BASE + CORS_ORIGIN"]
    end

    %% RELATIONSHIPS & FLOWS
    UI_Student --> FE_Config
    UI_Teacher --> FE_Config
    FE_Server --> UI_Student
    FE_Server --> UI_Teacher

    FE_Config -->|Cross-Port REST + WebSocket| GW_Router
    GW_Router --> GW_Auth
    GW_Auth --> GW_Iso

    GW_Iso --> ENG_Taxonomy
    GW_Iso --> ENG_QB
    GW_Iso --> ENG_Eval
    GW_Iso --> ENG_Analytics
    GW_Iso --> ENG_Voice

    ENG_QB --> LLM_Router
    ENG_Eval --> LLM_Router
    ENG_Voice --> LLM_Router

    LLM_Router -->|Primary High-Speed| LLM_Groq
    LLM_Router -->|Vision & Deep Proofs| LLM_Gemini
    LLM_Router -->|Failover / Offline| LLM_Offline

    ENG_Eval --> DB_Postgres
    ENG_Eval --> DB_InMemory
    ENG_Analytics --> DB_Postgres
    ENG_Analytics --> DB_InMemory
    ENG_Eval -->|Publish Attempt Events| BUS_Kafka
    BUS_Kafka -->|Stream Aggregation| ENG_Analytics

    VER_FE --> DEPLOY
    VER_BE --> DEPLOY
```

---

## Diagram 2: Teacher Question Bank & Step Solution Studio Lifecycle

This diagram demonstrates how a faculty member interacts with chapter filters, selects CBSE PYQs or NCERT questions, and generates intuitive step-by-step solutions or assigns flash quizzes across the frontend (`:3008`) and backend (`:5050`).

```mermaid
flowchart TD
    StartTeacher["Teacher Logs in with Mobile Number\n(e.g., Mrs. Meenakshi Sharma - 9816010003)"] --> AuthSuccess["System Authenticates Subject Scope:\nCLASS10_MATHEMATICS (10-Science-A)"]
    
    AuthSuccess --> OpenQBTab["Open Question Bank Tab (#tabQuestionBank)"]
    
    OpenQBTab --> FetchBank["GET {HAPS_API_BASE}/api/questions/class10-math-bank\nLoads 438 Curated Questions"]
    
    FetchBank --> FilterUI["Question Bank Studio Interface"]
    
    FilterUI --> SelectChapter["Filter by Chapter (1 to 14)\n- Ch 1: Real Numbers (49 Qs)\n- Ch 2: Polynomials (32 Qs)\n- Ch 3: Linear Equations (30 Qs)\n- Ch 4: Quadratic Equations (33 Qs)\n- Ch 5 to 14: AP, Triangles, Stats, etc."]
    
    FilterUI --> SelectSource["Question Categories & Sources\n- CBSE Board PYQ (310 Qs)\n- NCERT Textbook (68 Qs)\n- CBSE Sample Pattern (60 Qs)"]
    
    SelectChapter --> FilteredList["Render Filtered Question Cards\nwith KaTeX Mathematical Expressions"]
    SelectSource --> FilteredList

    FilteredList --> ActionStudio["Teacher Clicks: View Step Solution Studio"]
    FilteredList --> ActionAssign["Teacher Clicks: Assign Flash Quiz to Class"]
    FilteredList --> ActionMaster["Teacher Clicks: Open Chapter Solution Sheet Handout"]

    ActionStudio --> ModalStudio["Modal: Step Solution Studio Popup\n- Core Formula & Theorem Principle\n- Intuitive Step-by-Step Derivation\n- Verified Final Answer\n- CBSE Official Step Marking Rubric\n- Socratic Guided Prompts for Class"]
    
    ActionMaster --> ModalHandout["Modal: Full Chapter Handout\n- Printable Clean LaTeX Layout\n- Department of Mathematics Header\n- Complete Classroom Solutions Sheet"]
    
    ActionAssign --> PostQuiz["POST {HAPS_API_BASE}/api/curriculum/generate-test\nCreates Assessment Assigned to Roster"]
    PostQuiz --> QuizReady["Assessment Ready in Student Portal"]
```

---

## Diagram 3: Assessment Evaluation & Class Progress Dashboard Engine

This diagram outlines how student submissions are sent from `frontend/` (`:3008`) to `backend/` (`:5050`), evaluated against pacing benchmarks and error taxonomies, and rendered on the Class Progress Dashboard.

```mermaid
flowchart TD
    StudentSubmits["Student Completes Assessment in Portal\n(Answers, Option Selections, Time per Question)"] --> PostSubmit["POST {HAPS_API_BASE}/api/assessments/:id/submit\nPayload received by Evaluator Router"]
    
    PostSubmit --> EvaluatorEngine["Evaluator Core Engine (backend/src/routes/assessments.js)"]
    
    subgraph ScoringProcess ["Scoring & Diagnostic Classification"]
        EvaluatorEngine --> CheckCorrectness{"Is Answer Option Correct?"}
        CheckCorrectness -->|Yes| MarkCorrect["Award Marks & Pacing Tag\nMistake Type: NONE"]
        CheckCorrectness -->|No| ClassifyMistake["Classify Dominant Error:"]
        
        ClassifyMistake --> MistakeConceptual["SLOW_MISCONCEPTION\n(Theorem or boundary misunderstood)"]
        ClassifyMistake --> MistakeFormula["FORMULA_BASED\n(Wrong formula chosen)"]
        ClassifyMistake --> MistakeCalc["FAST_CARELESS_SLIP\n(Arithmetic or sign convention slip)"]
    end

    MarkCorrect --> RecordTelemetry["Record Time Spent vs Benchmark"]
    MistakeConceptual --> RecordTelemetry
    MistakeFormula --> RecordTelemetry
    MistakeCalc --> RecordTelemetry

    RecordTelemetry --> SaveSubmission["Save Record to In-Memory / Postgres Store"]
    SaveSubmission --> EmitKafka["Emit Event via Kafka / In-Memory Event Bus"]

    EmitKafka --> TeacherDashboard["Teacher Opens Class Progress Dashboard\nGET {HAPS_API_BASE}/api/analytics/class-dashboard?subjectKey=..."]

    subgraph DashboardMetrics ["Dashboard Live Analytics Output"]
        TeacherDashboard --> KPICards["KPI Summary Cards:\n- Class Average Score & Percentage\n- Highest & Lowest Scores\n- Average Solving Velocity vs Benchmark"]
        
        TeacherDashboard --> FourCharts["Chart.js Visual Analytics:\n1. Solved Correctly vs Errors\n2. Score Bracket Distribution\n3. Question Pacing vs Benchmark\n4. Common Mistake Breakdown"]
        
        TeacherDashboard --> ActionPlan["Pedagogical Action Directives:\n- Quick Recap Topics\n- Reteach Directives"]
        
        TeacherDashboard --> QuestionMatrix["Question Matrix Table & Class Roster"]
    end

    QuestionMatrix --> PerfModal["Teacher Clicks Student Performance Row\nOpens Individual Diagnostic Report Modal\n(#modalStudentIndividualReport)"]
```

---

## Diagram 4: Decoupled Two-Repository Verification & Cross-Port Flow

This diagram shows how `frontend/` and `backend/` test independently and connect cleanly both locally (separate ports) and after being pushed to two separate repositories.

```mermaid
flowchart TD
    Dev["Developer / Agent Updates frontend/ or backend/"] --> SplitSuites{"Which Part Changed?"}
    
    SplitSuites -->|Backend| BE_Tests["Run Backend Suites (cd backend):\n- npm test (scripts/test_evaluator.js)\n- npm run test:board-paper\n- npm run test:math-bank\n- scripts/verify_staging.js"]
    
    SplitSuites -->|Frontend| FE_Tests["Run Frontend Suites (cd frontend):\n- npm test (intuitive card & button audit)\n- npm run test:latex\n- npm run build:whiteboard (optional)"]

    BE_Tests --> StartBE["Start Standalone Backend (:5050)\ncd backend && npm start\nConfigured via backend/.env (CORS_ORIGIN)"]
    FE_Tests --> StartFE["Start Standalone Frontend (:3008)\ncd frontend && npm start\nConfigured via frontend/js/config.js"]

    StartBE --> Connect["Cross-Port Runtime Integration:\nFrontend (http://localhost:3008) <-> Backend (http://localhost:5050 & ws://localhost:5050)"]
    StartFE --> Connect

    Connect --> SeparateRepos["Ready for Separate Git Repositories:\n- Repo 1: backend/ (+ backend/database/)\n- Repo 2: frontend/ (+ .agents/)\nSet window.HAPS_API_BASE & CORS_ORIGIN for prod"]
```

---

## Diagram 5: Senior Secondary Subject Isolation Data Boundary

This diagram illustrates how data boundaries and teacher scopes are strictly isolated between Class 10 Foundation and Class 11/12 Senior Secondary Medical and Non-Medical streams.

```mermaid
flowchart TD
    TeacherLogin["Teacher Authentication Header / Query Parameter\n(teacherSubjectKey or faculty mobile lookup)"] --> BoundaryGuard{"Subject Isolation Boundary Guard"}
    
    BoundaryGuard -->|CLASS10_MATHEMATICS| ScopeClass10Math["Scope: Class 10 Mathematics (Mrs. Meenakshi Sharma)\n- Class Roster: 10-Science-A\n- Syllabus: 14 NCERT Chapters\n- Bank: 438 Class 10 Math Questions\n- JEE/NEET Stream Tabs: HIDDEN"]
    
    BoundaryGuard -->|CLASS10_SCIENCE| ScopeClass10Sci["Scope: Class 10 Science (Er. Rakesh Thakur)\n- Class Roster: 10-Science-A\n- Syllabus: Physics, Chem, Bio Foundation\n- JEE/NEET Stream Tabs: HIDDEN"]
    
    BoundaryGuard -->|PHYSICS| Scope1112Phy["Scope: Senior Physics (+1 & +2) (Dr. Vikram Sharma)\n- Stream: 11-NonMed / 12-NonMed\n- Target Exam: JEE Main & Advanced\n- Roster: Non-Medical Students Only\n- Biology Curriculum: ISOLATED"]
    
    BoundaryGuard -->|BIOLOGY| Scope1112Bio["Scope: Medical Biology (+1 & +2) (Dr. Ananya Mukherjee)\n- Stream: 11-Med / 12-Med\n- Target Exam: NEET-UG\n- Roster: Medical Students Only\n- Engineering Mathematics: ISOLATED"]
    
    BoundaryGuard -->|CHEMISTRY| Scope1112Chem["Scope: Senior Chemistry (+1 & +2) (Dr. Suresh Kumar)\n- Stream: Common Medical & Non-Medical\n- Organic, Inorganic, Physical Chemistry"]

    ScopeClass10Math --> ResponseFilter["Strict JSON Filter: Class Roster & Available Assessments List"]
    ScopeClass10Sci --> ResponseFilter
    Scope1112Phy --> ResponseFilter
    Scope1112Bio --> ResponseFilter
    Scope1112Chem --> ResponseFilter
    
    ResponseFilter --> CleanDashboard["Safe, Clean, Unpolluted Faculty Portal View"]
```

---

## Diagram 6: Multi-Tenant Dual-Mode Registry (Board vs Competitive)

Added 2026-11-16 (TASK-22). Tenant profiles, exam patterns and workspace tabs are data; the frontend renders whatever the active school's profile allows.

```mermaid
flowchart TD
    subgraph FE ["frontend/ (:3008)"]
        ModeBar["Header Mode Switch (#modeSwitchBar)\nBoard Exam | Competitive Prep\nCBSE / HP Board / ICSE | JEE / NEET"]
        Engine["js/dualModeEngine.js\n- Tab filter by feature flags\n- Drawer Mode Tools\n- Module Workspace renderer"]
        Workspace["#tabModuleWorkspace / #tabStudentModuleWorkspace\nDPP, Roadmap, Cheat Sheets, NCERT Core, Rank Analytics"]
    end

    subgraph BE ["backend/ (:5050)"]
        TenantAPI["GET /api/tenant/config\nx-school-id > ?schoolId > subdomain > DEFAULT_SCHOOL_ID"]
        ModulesAPI["GET /api/modules/:moduleId\nPOST /api/modules/dpp/submit"]
        ContentAPI["GET /api/content?mode=&board=&stream=\nGET /api/questions?mode=..."]
        TenantSvc["tenantConfigService.js"]
        PatternSvc["examPatternRegistry.js\n(+ assessment scoring)"]
        CanonSvc["canonicalContentService.js\ncurriculum_content projection"]
        Registry[("src/registry/\ntenants/*.json\ntemplates/exam_patterns.json\nworkspace_tabs.json")]
        Mods["src/modules/\ndpp, roadmap, cheatsheets,\nncertCore, rankAnalytics"]
        Banks[("Subject banks\n+ curriculumTaxonomy")]
        PG[("PostgreSQL: schools,\ncurriculum_content (GIN), dpp_attempts")]
    end

    ModeBar --> Engine
    Engine -->|boot| TenantAPI
    Engine -->|open tool| ModulesAPI
    Workspace -->|PYQ drilldown| ContentAPI
    TenantAPI --> TenantSvc --> Registry
    TenantSvc --> PatternSvc --> Registry
    ModulesAPI --> Mods
    Mods --> CanonSvc --> Banks
    ContentAPI --> CanonSvc
    CanonSvc -.->|scripts/sync_curriculum_content.js| PG
    Engine --> Workspace
```

---

## Summary of Key File Locations

| Architectural Component | File Path | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Static Server** | `frontend/server.js` | Standalone zero-dependency Node server on port `3008` |
| **Frontend Backend Config** | `frontend/js/config.js` | Centralized `getHapsApiBaseUrl()` / `getHapsWsBaseUrl()` resolver (`:5050` locally) |
| **Frontend Controller** | `frontend/js/app.js` | UI state, KaTeX rendering, Solution Studio modal, Chart.js analytics |
| **Frontend Structure** | `frontend/index.html` | Portal markup, modals, Paper Studio, Student Arena |
| **Interactive Whiteboard** | `frontend/whiteboard.html` & `frontend/src_whiteboard/index.jsx` | Local `tldraw` canvas synced with backend telemetry logs |
| **Frontend Test Suite** | `frontend/scripts/test_*.js` | Offline Solution Studio, LaTeX, and DOM binding verification |
| **Backend API Gateway** | `backend/src/server.js` | Pure Express API + WebSocket server on port `5050` with `CORS_ORIGIN` |
| **Primary SQL Schema & Seeds** | `backend/database/schema.sql` & `seed_data.sql` | 12 PostgreSQL relational tables & initial institutional records |
| **Database & In-Memory Store** | `backend/src/config/database.js` & `backend/src/database/` | Dual PostgreSQL/in-memory store, custom JSON storage, bank seeds |
| **Class Analytics API** | `backend/src/routes/analytics.js` | Velocity calculations, error taxonomies, recap vs reteach action plans |
| **Curriculum & Test Builder API**| `backend/src/routes/curriculum.js` | Faculty lookup, class rosters, test generation, attempt simulation |
| **Class 10 Math Bank (438 Qs)** | `backend/src/services/class10MathQuestionBank.js` | 14 chapters, 310 PYQs, 68 NCERT exercises, step rubrics |
| **Backend Verification Suite** | `backend/scripts/test_*.js` & `verify_staging.js` | Evaluator, board paper, math bank, injection, and staging checks |
| **Tenant Profiles & Tab Registry** | `backend/src/registry/` | School JSON profiles, exam pattern templates, workspace tab registry |
| **Tenant / Pattern / Content Services** | `backend/src/services/{tenantConfigService,examPatternRegistry,canonicalContentService}.js` | School resolution, mode context, scoring patterns, dual-mode content projection |
| **Workspace Modules** | `backend/src/modules/` & `backend/src/routes/{tenant,content,modules}.js` | DPP, roadmap, cheat sheets, NCERT core, rank analytics and their APIs |
| **Frontend Mode Switcher** | `frontend/js/dualModeEngine.js` & `frontend/css/dual-mode.css` | Header mode pill, tab filtering, drawer mode tools, Module Workspace |
| **Project Change Log** | `log.md` (at workspace root) | Chronological log updated after every prompt |
