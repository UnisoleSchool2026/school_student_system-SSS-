# UNISOLE AI SCHOOL - SCHOLAR ASSISTANT

**Platform:** Unisole AI School System (HIM Academy Public School, Hamirpur)  
**Architecture:** Decoupled Two-Part Workspace (`backend/` + `frontend/`), ready for independent deployment and separate Git repositories.

---

## Workspace Structure

```text
.
├── backend/       # Standalone Node.js/Express API, WebSocket Gateway, AI Services & Database Schemas (:5050)
├── frontend/      # Standalone Web Portal, Student Simulator, KaTeX Engine & Interactive Whiteboard (:3008)
├── .gitignore     # Root Git ignore rules
├── README.md      # Workspace overview & quickstart
└── log.md         # Chronological log of all project changes
```

- See [backend/README.md](./backend/README.md) for API routes, PostgreSQL schemas (`backend/database/` & `backend/src/database/`), environment variables, and backend tests.
- See [frontend/README.md](./frontend/README.md) for frontend server setup, whiteboard bundling, and `js/config.js` backend URL resolution.
- Full engineering documentation ([INTERN_ONBOARDING_GUIDE.md](./frontend/INTERN_ONBOARDING_GUIDE.md), [ARCHITECTURE_EXCALIDRAW_MERMAID.md](./frontend/ARCHITECTURE_EXCALIDRAW_MERMAID.md), [TASKS.md](./frontend/TASKS.md)) is maintained cleanly inside **both** `frontend/` and `backend/` so each future standalone repository retains full documentation.
- See [log.md](./log.md) for a full record of all structural and code changes.

---

## Board vs Competitive (Multi-Tenant Dual-Mode)

Since 2026-11-16 the platform follows the multi-tenant dual-mode architecture: each school is a JSON profile in `backend/src/registry/tenants/`, and the header mode switch in the frontend (`frontend/js/dualModeEngine.js`) shows Board (CBSE / HP Board / ICSE) or Competitive (JEE / NEET) tabs and tools from that profile. See `backend/README.md` and `frontend/README.md`, and the 2026-11-16 entry in [log.md](./log.md) for every changed file and revert steps. Pre-change copies are in `_revert_backups/` (not part of either repo).

---

## Running Both Parts Locally (Separate Ports)

### 1. Start the Backend API & WebSocket Server (`http://localhost:5050`)
```bash
cd backend
cp .env.example .env
npm install
npm start
```
Verify backend health: `http://localhost:5050/api/health`

> **Note on local Kafka logs:** If Apache Kafka is not running locally on `localhost:9092`, `kafkajs` logs initial connection errors and automatically falls back to the built-in in-memory event bus while keeping the server running normally on port `5050`.

### 2. Start the Frontend Portal (`http://localhost:3008`)
Open a second terminal:
```bash
cd frontend
npm start
```
Open **`http://localhost:3008`** in your browser — `frontend/js/config.js` automatically connects API and WebSocket requests to `http://localhost:5050` / `ws://localhost:5050`.

---

## Splitting Into Two Separate Repositories Later

Both folders are fully self-contained and include their own `package.json`, `README.md`, `AGENTS.md`, `GEMINI.md`, `DESIGN_PRINCIPLES.md`, and `.gitignore`:

1. Move or copy `backend/` to its own Git repo (`git init` inside `backend/`). Set `CORS_ORIGIN` / `FRONTEND_URL` in `backend/.env` to your deployed frontend origin.
2. Move or copy `frontend/` to its own Git repo (`git init` inside `frontend/`). Configure the deployed backend URL via `window.HAPS_API_BASE` or `localStorage.setItem('haps_backend_url', 'https://...')` in `frontend/js/config.js`.
