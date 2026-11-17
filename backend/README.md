# UNISOLE AI SCHOOL - SCHOLAR ASSISTANT (BACKEND & DATABASE)

**Platform:** Unisole AI School System (HIM Academy Public School, Hamirpur)  
**Module:** Standalone REST API, WebSocket Telemetry Gateway, AI Engines & PostgreSQL Schemas (`backend`)  
**Default Port:** `5050`  
**Frontend Origin (CORS):** Configured via `CORS_ORIGIN` / `FRONTEND_URL` (allows `http://localhost:3008` by default)

---

## Directory Structure

```text
backend/
├── database/              # Primary PostgreSQL schemas & seed SQL (schema.sql, seed_data.sql)
├── scripts/               # Backend test suites, verify_staging.js & Python question bank compilers
├── src/
│   ├── config/            # PostgreSQL pool & high-speed in-memory fallback (database.js)
│   ├── database/          # Persistent JSON question store & subject bank SQL migrations
│   ├── kafka/             # Apache Kafka telemetry producer & consumer
│   ├── routes/            # Express API routes (/api/questions, /api/assessments, /api/voice-tutor, etc.)
│   ├── services/          # LLM generators, Board Paper generator, Vision OCR, Voice TTS, DOCX export
│   └── server.js          # Pure API & WebSocket Gateway entry point
├── .env.example           # Environment template (Port 5050, DB, Kafka, LLM keys, CORS)
├── Dockerfile             # Production Node.js container definition
├── INTERN_ONBOARDING_GUIDE.md
├── ARCHITECTURE_EXCALIDRAW_MERMAID.md
├── TASKS.md
└── package.json           # Complete backend runtime dependencies & scripts
```

---

## Running Independently (Port 5050)

### 1. Environment Setup
```bash
cp .env.example .env
```
Configure keys in `.env`:
- `PORT=5050`
- `FRONTEND_URL=http://localhost:3008`
- `CORS_ORIGIN=http://localhost:3008,http://127.0.0.1:3008,http://localhost:3000`
- `DATABASE_URL` (optional in local dev — falls back to in-memory seed store automatically)
- `GEMINI_API_KEY` / `GROQ_API_KEY` (optional — falls back to curated NCERT/PYQ banks)

### 2. Install Dependencies & Start Server
```bash
npm install
npm start
# Or for hot reload:
npm run dev
```

Endpoints verified once live:
- **Gateway Root:** `http://localhost:5050/`
- **Health Check:** `http://localhost:5050/api/health`
- **WebSocket Telemetry:** `ws://localhost:5050`

> **Local Mode Note (Kafka & PostgreSQL):** If PostgreSQL (`5432`) or Apache Kafka (`9092`) is not running locally, the gateway may log `ECONNREFUSED` Kafka retry warnings at startup before automatically falling back to its built-in in-memory store and in-memory event bus. The server remains live on port `5050`. See [../log.md](../log.md) for workspace history.

### 3. Database Initialization (PostgreSQL)
To initialize PostgreSQL manually with the moved schemas:
```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed_data.sql
```

### 4. Backend Diagnostic Tests
```bash
npm test
npm run test:board-paper
npm run test:progress
npm run test:math-bank
npm run test:dual-mode
```

---

## Multi-Tenant Dual-Mode Architecture (Board vs Competitive)

Schools, modes, boards/streams, visible tabs and tools are configured as data (TASK-22, 2026-11-16).

```text
src/registry/
  tenants/sch_unisole_001.json      # HAPS profile (BOARD + COMPETITIVE)
  tenants/sch_demo_board_only.json  # sample board-only school
  templates/exam_patterns.json      # CBSE, HP Board, ICSE (no content yet), JEE Main, NEET UG
  workspace_tabs.json               # tabs per mode/role + gating feature flag
src/modules/                        # dpp, roadmap, cheatsheets, ncertCore, rankAnalytics
src/services/                       # tenantConfigService, examPatternRegistry, canonicalContentService
```

| Endpoint | Purpose |
| :--- | :--- |
| `GET /api/tenant/config` | Active school profile, tracks with content availability, per-mode tabs |
| `GET /api/tenant/workspace?mode=&role=` | Tabs for one mode and role |
| `GET /api/templates/exam-patterns[?mode=]` | Exam pattern template registry |
| `GET /api/content?mode=&board=&stream=...` | Canonical dual-mode content library (`includeSolutions=true` for answers) |
| `GET /api/modules/:moduleId?mode=&board=&stream=&grade=&subjectKey=` | Module payload (`dpp`, `roadmap`, `cheatsheets`, `ncert_core`, `rank_analytics`) |
| `POST /api/modules/dpp/submit`, `GET /api/modules/dpp/streak` | DPP scoring and streaks |
| `GET /api/questions?mode=COMPETITIVE&stream=JEE` | Existing bank endpoints now accept `mode` (legacy behaviour unchanged without it) |

- **Choose the school:** `x-school-id` header, `?schoolId=`, Host subdomain, or `DEFAULT_SCHOOL_ID` in `.env` (default `sch_unisole_001`).
- **Add a school:** copy a file in `src/registry/tenants/`, change `schoolId`, modes, boards/streams and feature flags, restart.
- **Scoring:** `POST /api/assessments/:id/submit` takes negative marking from the matching exam pattern (results include `examPatternId`).
- **PostgreSQL:** `schema.sql` adds `schools`, `curriculum_content` (GIN index) and `dpp_attempts`; run `node scripts/sync_curriculum_content.js` after schema + seed.
- **Test:** `npm run test:dual-mode`.

---

## Splitting Into Its Own Git Repository

```bash
cd backend
git init
git add .
git commit -m "Initialize standalone HAPS-AI Backend repository"
```

---

## CI/CD Automation & Pipelines

The backend repository features an independent, production-grade GitHub Actions CI/CD pipeline and Dependabot configuration located in `.github/`.

### 1. Workflows Overview

- **CI Pipeline (`.github/workflows/ci.yml`)**:
  - Triggers: Pull requests to `main`, pushes to `main`, and manual `workflow_dispatch`.
  - Concurrency: `cancel-in-progress: true` cancels superseded runs.
  - Least-Privilege Permissions: Explicit `contents: read` top-level, with scoped `security-events: write` for SARIF uploads.
  - Job 1: `unit-integration` — Executes `npm test`, `npm run test:board-paper`, `npm run test:progress`, and `node scripts/test_latex_rendering_and_options.js`.
  - Job 2: `live-server` — Boots `src/server.js` on port 5050 in-memory mode, polls `/api/health` with a 30s timeout, executes `npm run test:math-bank` and `node scripts/verify_staging.js http://localhost:5050`. Uploads `server.log` artifact on failure.
  - Job 3: `postgres-integration` — Provisions a `postgres:16-alpine` service container, installs `postgresql-client`, executes `database/schema.sql` and `database/seed_data.sql`, starts the server with `DATABASE_URL`, and validates live `/api/health`.
  - Job 4: `network-integration` — Runs `node scripts/test_voice_tutor_hinglish.js` as a non-blocking job (`continue-on-error: true`). Note: Real WhatsApp dispatch (`test_real_whatsapp_dispatch.js`) is deliberately excluded from CI.
  - Job 5: `security-scan` — Runs `npm audit --audit-level=high` and Gitleaks secret scanning.
  - Job 6: `codeql-analysis` — Static application security testing (SAST) for JavaScript/Node.js.
  - Job 7: `docker-build-smoke` — Multi-stage Buildx container build with GitHub Actions layer cache (`type=gha`), starts container, probes `/api/health`, and scans for vulnerabilities using Trivy (`HIGH,CRITICAL`).

- **CD Pipeline (`.github/workflows/cd.yml`)**:
  - Triggers: Git release tags matching `v*.*.*` and manual `workflow_dispatch` (target environment input: `staging` or `production`).
  - Container Publishing: Builds and pushes production container image to GitHub Container Registry (`ghcr.io/${{ github.repository }}`).
  - Environments:
    - `staging`: Automated continuous deployment on tag push.
    - `production`: Regulated deployment requiring manual approval via GitHub Environment protection rules.
  - Deployment Gate: Executes `node scripts/verify_staging.js <DEPLOYED_URL>` against the target environment.
  - Rollback Procedures: Documented step-by-step in the workflow for container image rollbacks and database migrations.

- **Dependabot (`.github/dependabot.yml`)**:
  - Automated weekly dependency vulnerability scans and pull requests for `npm`, `docker`, and `github-actions`.
  - Commit message prefix: `chore(deps)`.

### 2. Required GitHub Secrets and Variables

Configure the following under **Settings > Secrets and variables > Actions**:

#### Repository Secrets
- `DATABASE_URL`: PostgreSQL connection string (`postgres://user:pass@host:5432/dbname`)
- `JWT_SECRET`: Secret key for signing authentication tokens
- `GEMINI_API_KEY`: Google Gemini API key for AI evaluations
- `GROQ_API_KEY`: Groq API key for LPU inference
- `DEPLOY_TOKEN`: Optional deployment authorization token for target cloud provider (e.g., Kubernetes, AWS, Render, Railway)

#### Repository / Environment Variables
- `STAGING_BACKEND_URL`: URL of deployed staging API (e.g. `https://staging-api.haps-scholar.internal`)
- `PRODUCTION_BACKEND_URL`: URL of deployed production API (e.g. `https://api.haps-scholar.internal`)
- `FRONTEND_URL`: Allowed frontend origin for CORS (e.g. `https://staging.haps-scholar.internal`)
- `CORS_ORIGIN`: Comma-delimited origins permitted to access API endpoints

### 3. How to Run Verification Checks Locally

Before pushing commits, execute the complete CI test matrix locally:
```bash
# 1. Unit & Integration test suites
npm test
npm run test:board-paper
npm run test:progress
node scripts/test_latex_rendering_and_options.js

# 2. Live server and staging gate validation
node src/server.js &
npm run test:math-bank
node scripts/verify_staging.js http://localhost:5050
kill %1

# 3. Security audit
npm audit --audit-level=high
```

### 4. Steps Once Git Access Exists

1. **Create Repository**: Initialize a standalone repository on GitHub (e.g. `haps-backend`).
2. **Push Code**:
   ```bash
   cd backend
   git init
   git remote add origin https://github.com/<org>/haps-backend.git
   git add .
   git commit -m "feat(ci): initialize backend with automated CI/CD workflows"
   git branch -M main
   git push -u origin main
   ```
3. **Configure Environments**:
   - Go to **Settings > Environments** and create `staging` (automatic, no required reviewers).
   - Create `production` and enable **Required reviewers** (select senior DevOps / Tech Leads for manual sign-off).
4. **Populate Secrets and Variables**: Add `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, and `GROQ_API_KEY` to the corresponding environments.
5. **Enable Branch Protection**:
   - Go to **Settings > Branches** and add a rule for `main`.
   - Require pull request reviews before merging.
   - Require status checks to pass before merging:
     - `Unit and Integration Tests`
     - `Live Server Smoke and Math Bank Tests`
     - `PostgreSQL Integration and Schema Migration Test`
     - `Security Vulnerability and Secret Audits`
     - `CodeQL Static Application Security Testing`
     - `Docker Build, Health Smoke Test, and Trivy Scan`


