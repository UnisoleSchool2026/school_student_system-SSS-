# Ingestion Architecture: Mode-Aware Question Ingestion & Count Reconciliation

## 1. Overview & Context

This document outlines the architecture for mode-aware question ingestion, paper profile resolution, manifest verification, count reconciliation, and validation across Board mode (`CBSE`, `HP_BOARD`, `ICSE`) and Competitive mode (`JEE`, `NEET`).

### Key Deficiencies in Legacy Ingestion (Resolved)
1. **Unconditional `CBSE_BOARD` Default**: Resolved via Phase 1 context propagation and Zod schema validation requiring explicit `mode` and `track`.
2. **Positional Marks Guesswork**: Resolved via Phase 3 paper profile registry and Phase 4 declared manifest extraction.
3. **Absence of Reconciliation**: Resolved via Phase 5 count reconciliation engine auditing section counts, sequence continuity, and marks sums.
4. **Immediate Visibility**: Resolved via Phase 2 lifecycle status (`DRAFT`, `PENDING_REVIEW`, `APPROVED`); only `APPROVED` questions are visible to students and eligible for test generation.
5. **No Idempotency**: Resolved via Phase 2 deterministic SHA-256 `contentHash` deduplication.

---

## 2. Core Architecture Components

```
Client Ingestion Request (mode, track, subject, payload, paperMeta)
                │
                ▼
[1] Request Validation & Tenant Authorization Gate (Phase 1)
                │
                ▼
[2] Paper Profile & Manifest Resolution (Phase 3)
                │
                ▼
[3] Chunked Structured Extraction (Phase 4)
                │
                ▼
[4] Normalization & Canonical Schema Projection (Phase 2 & 4)
                │
                ▼
[5] Validation & Count Reconciliation Engine (Phase 5)
                │
                ▼
[6] Mode Rules & Exam Classifier Review (Phase 6 & 7)
                │
                ├── Passed: PENDING_REVIEW -> Teacher Inline Approval -> APPROVED
                └── Mismatch: Flagged Diagnostic -> DRAFT (Save as Draft or Override)
```

---

## 3. Implementation Phasing Log

| Phase | Description | Status | Verification Record |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Context propagation and server-side authorization | **COMPLETED** | `scripts/test_phase1_ingestion_auth.js` (9/9 passed) |
| **Phase 2** | Canonical question schema and lifecycle (`contentHash`, invariants) | **COMPLETED** | `scripts/test_phase2_canonical_schema.js` (6/6 passed) |
| **Phase 3** | Paper Profiles and manifest extraction registry | **COMPLETED** | `src/services/paperProfileRegistry.js` |
| **Phase 4** | Structured extraction engine & manifest normalization | **COMPLETED** | `src/services/extractionReconciler.js` |
| **Phase 5** | Validation and automatic reconciliation (`reconcileExtraction`) | **COMPLETED** | Verified in `test:ingestion` benchmarks |
| **Phase 6** | Mode rules and classifier (strict pedagogical separation) | **COMPLETED** | Enforced via `validateQuestionInvariants` & reconciler |
| **Phase 7** | Frontend review UI with reconciliation banner & action buttons | **COMPLETED** | `index.html` & `app.js` (Static guards verified) |
| **Phase 8** | Idempotent migration of legacy questions with dry-run & apply | **COMPLETED** | `scripts/migrate_legacy_injected_questions.js` |
| **Phase 9** | Golden test set, benchmarks runner & diagnostic metrics | **COMPLETED** | `docs/extraction-benchmarks.md` |

---

## 4. Key Design Decisions

1. **One Canonical Store with Mode Tags**: Questions are stored in the unified subject banks with explicit tags (`target_modes`, `board_targets`, `competitive_targets`, `curriculum_board`, `target_exam`). No physical database divergence.
2. **Strict Client-to-Backend Context**: The client sends `{ mode, track, subject, grade, sourceType, payload }`. Missing mode or track triggers a strict 400 Bad Request.
3. **Tenant & Role Authorization Boundary**: Teachers can only ingest for active modes enabled in the school tenant's configuration (`sch_*.json`).
4. **Deterministic Content Hashing**: `computeContentHash` sanitizes whitespace and LaTeX delimiters into a normalized SHA-256 hash. Identical uploads are deduplicated idempotently.
5. **No Negative Marking on Questions**: Marking rules (+4/-1) are dynamic test properties declared in `exam_patterns.json`, never hard-coded onto question records.
6. **Visibility Lifecycle**: Unapproved questions (`DRAFT`, `PENDING_REVIEW`) are never served to students in homework, practice, DPPs, or test generation.
