# UNISOLE AI SCHOOL - SCHOLAR ASSISTANT (FRONTEND)

**Platform:** Unisole AI School System (HIM Academy Public School, Hamirpur)  
**Module:** Standalone Web Portal & Interactive Whiteboard (`frontend`)  
**Default Port:** `3008`  
**Backend Connection:** Configured via `js/config.js` (defaults to `http://localhost:5050` / `ws://localhost:5050` in local development)

---

## Architecture Overview

This directory is structured as an independent, self-contained **Frontend Repository** that serves:
- **Teacher Co-Pilot & Paper Studio** (`index.html`, `js/app.js`)
- **Student Adaptive Exam Simulator, Telemetry & Smart Reports**
- **Interactive Whiteboard Studio** (`whiteboard.html`, `src_whiteboard/index.jsx`, bundled `vendor/tldraw/`)
- **Gemini Live Voice Assistant Client** (`js/geminiLiveVoiceTutor.js`)
- **Offline-Ready Math Rendering** (`vendor/katex/`)

All frontend work must comply with [AGENTS.md](./AGENTS.md), [GEMINI.md](./GEMINI.md), [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md), and [.agents/rules/design_principles.md](./.agents/rules/design_principles.md). Full system guides ([INTERN_ONBOARDING_GUIDE.md](./INTERN_ONBOARDING_GUIDE.md), [ARCHITECTURE_EXCALIDRAW_MERMAID.md](./ARCHITECTURE_EXCALIDRAW_MERMAID.md), [TASKS.md](./TASKS.md)) are included here and synced with `backend/`. See [../log.md](../log.md) for the workspace changelog.

---

## Running Independently (Port 3008)

### 1. Start Local Frontend Server
No build step is required to serve the portal locally (pre-built bundles are included under `vendor/`):

```bash
npm start
# Runs: node server.js -> http://localhost:3008
```

For file-watch reloads during development:
```bash
npm run dev
```

### 2. Rebuilding the Interactive Whiteboard Bundle (Optional)
If you edit `src_whiteboard/index.jsx`:
```bash
npm install
npm run build:whiteboard
```

### 3. Frontend Verification Tests
```bash
npm test
npm run test:latex
npm run test:buttons
npm run test:solution-card
```

---

## Board vs Competitive Mode Switcher (Multi-Tenant)

`js/dualModeEngine.js` + `css/dual-mode.css` (TASK-22, 2026-11-16) read the school profile from `GET {API}/api/tenant/config` and render:

- **Header mode pill** `#modeSwitchBar`: Board Exam / Competitive Prep, with CBSE / HP Board / ICSE or JEE / NEET chips. ICSE shows "No content" until content is loaded. Competitive is disabled for Class 10; Medical classes get NEET and Non-Medical classes get JEE.
- **Tab filtering:** teacher drawer cards are shown, hidden and relabelled from the tenant's tab registry. In Competitive, Scan Paper Sheets and Question Bank are hidden and Create Test becomes "Create NTA Test".
- **Mode Tools** (drawer section `#drawerSectionModeTools`) open in `#tabModuleWorkspace` (teacher) or `#tabStudentModuleWorkspace` (student): DPP, Roadmap, Cheat Sheets, NCERT Core and (teachers) Predictive Rank Analytics.
- **School selection:** `window.HAPS_SCHOOL_ID`, `?schoolId=` or `localStorage.haps_school_id`; otherwise the backend default.
- **Integration hooks:** `window.HapsDualMode.getContext()` and the `haps:modechange` window event.
- `js/app.js` and the AI Smartboard are unchanged. If the backend is unreachable, the bar stays hidden and the portal works as before.

---

## Connecting to the Backend Repository (Port 5050)

API and WebSocket URLs are resolved centrally in `js/config.js` (loaded by both `index.html` and `whiteboard.html`) using the following priority order:

1. **Global runtime override** before scripts load:
   ```html
   <script>
     window.HAPS_API_BASE = 'https://your-backend-domain.com';
   </script>
   ```
2. **URL query parameter** (`?apiBase=http://localhost:5050`)
3. **Browser `localStorage`** (`haps_backend_url` key, or call `window.setHapsBackendUrl('https://...')` in DevTools)
4. **Localhost default**: Automatically resolves to `http://localhost:5050` and `ws://localhost:5050` when running on `localhost` or `127.0.0.1`
5. **Same-origin fallback**: Uses `window.location.origin` when reverse-proxied behind a single domain (e.g. Nginx/Kubernetes Ingress).

Ensure your standalone **Backend** server is running on port `5050` with CORS enabled for `http://localhost:3008` (configured by default in `backend/.env.example`).

---

## Splitting Into Its Own Git Repository

```bash
cd frontend
git init
git add .
git commit -m "Initialize standalone HAPS-AI Frontend repository"
```

---

## CI/CD Automation & Pipelines

The frontend repository includes standalone GitHub Actions CI/CD workflows and Dependabot configuration in `.github/`.

### 1. Workflows Overview

- **CI Pipeline (`.github/workflows/ci.yml`)**:
  - Triggers: Pull requests to `main`, pushes to `main`, and manual `workflow_dispatch`.
  - Concurrency: `cancel-in-progress: true` cancels superseded runs.
  - Least-Privilege Permissions: `contents: read` default, with `security-events: write` for SAST.
  - Job 1: `build-and-test` — Runs `npm test` (buttons & solution card), `npm run test:latex` (KaTeX parsers), `node scripts/test_screenshot_case.js` (headless LaTeX validation), `npm run build:whiteboard` followed by `git diff --exit-code vendor/tldraw/tldraw-standalone.bundle.js` (bundle compilation check), and `node scripts/test_static_guards.js` (checks for bare `/api/` fetch calls, hardcoded `../../` sibling paths, and PR added emojis).
  - Job 2: `server-smoke-test` — Starts `server.js` on port 3008, verifies `GET /` returns HTTP 200, and verifies `GET /whiteboard` returns HTTP 200. Uploads `frontend_server.log` artifact on failure.
  - Job 3: `playwright-overflow-check` — Optional, non-blocking job (`continue-on-error: true`) that spins up Playwright Chromium to test responsive layout overflow (`scrollWidth <= innerWidth`) at 360px, 768px, 1024px, and 1440px viewports.
  - Job 4: `live-backend-integration` — Dispatched on demand via `workflow_dispatch` with a `backend_url` input; executes `test_quiz_creation_and_modal_display.js` against the staging backend without checking out the backend repository.
  - Job 5: `security-scan` — Runs `npm audit --audit-level=high` and Gitleaks secret detection.
  - Job 6: `codeql-analysis` — Static application security testing (SAST) for JavaScript and HTML.

- **CD Pipeline (`.github/workflows/cd.yml`)**:
  - Triggers: Release tags matching `v*.*.*` and manual `workflow_dispatch`.
  - Packaging: Builds whiteboard bundle and archives a static distribution package `haps-frontend-<tag>.tar.gz` as a release artifact.
  - Runtime API Base Injection: Demonstrates deploy-time injection of `window.HAPS_API_BASE = '<BACKEND_URL>'` into HTML heads without baking URLs into source.
  - Environments:
    - `staging`: Automated continuous deployment to staging web host/CDN with post-deploy HTTP 200 smoke test.
    - `production`: Regulated deployment requiring manual approval via GitHub Environment protection rules.
  - Rollback Procedures: Documented step-by-step for static hosting and CDN cache invalidation.

- **Dependabot (`.github/dependabot.yml`)**:
  - Weekly dependency scans and pull requests for `npm` and `github-actions`.
  - Commit message prefix: `chore(deps)`.

### 2. Required GitHub Secrets and Variables

Configure the following under **Settings > Secrets and variables > Actions**:

#### Repository Secrets
- `DEPLOY_TOKEN`: Optional deployment authorization token for target web host (e.g. AWS S3/CloudFront, Cloudflare Pages, Vercel, Netlify)

#### Repository / Environment Variables
- `STAGING_BACKEND_URL`: URL of staging backend API (e.g. `https://staging-api.haps-scholar.internal`)
- `STAGING_FRONTEND_URL`: URL of staging frontend web portal (e.g. `https://staging.haps-scholar.internal`)
- `PRODUCTION_BACKEND_URL`: URL of production backend API (e.g. `https://api.haps-scholar.internal`)
- `PRODUCTION_FRONTEND_URL`: URL of production frontend web portal (e.g. `https://haps-scholar.internal`)

### 3. How to Run Verification Checks Locally

Before pushing commits, execute all CI validation steps locally:
```bash
# 1. Unit & DOM test suites
npm test
npm run test:latex
node scripts/test_screenshot_case.js

# 2. Whiteboard compilation integrity
npm run build:whiteboard
git diff --exit-code vendor/tldraw/tldraw-standalone.bundle.js

# 3. Static guards (bare API fetches, sibling paths, emoji additions)
node scripts/test_static_guards.js

# 4. Local server smoke test
node server.js &
curl -I http://localhost:3008/
curl -I http://localhost:3008/whiteboard
kill %1
```

### 4. Steps Once Git Access Exists

1. **Create Repository**: Initialize a standalone repository on GitHub (e.g. `haps-frontend`).
2. **Push Code**:
   ```bash
   cd frontend
   git init
   git remote add origin https://github.com/<org>/haps-frontend.git
   git add .
   git commit -m "feat(ci): initialize frontend with automated CI/CD workflows"
   git branch -M main
   git push -u origin main
   ```
3. **Configure Environments**:
   - Create `staging` (automatic, no required reviewers).
   - Create `production` and configure **Required reviewers** for manual promotion sign-off.
4. **Populate Secrets and Variables**: Set `STAGING_BACKEND_URL`, `STAGING_FRONTEND_URL`, `PRODUCTION_BACKEND_URL`, and `PRODUCTION_FRONTEND_URL`.
5. **Enable Branch Protection**:
   - Add a branch protection rule for `main`.
   - Require pull request reviews before merging.
   - Require status checks to pass before merging:
     - `Build, Static Guards, LaTeX, and Unit Tests`
     - `Frontend Server Smoke and Route Availability`
     - `Security Vulnerability and Secret Audits`
     - `CodeQL Static Application Security Testing`


