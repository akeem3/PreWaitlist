# Story 21.3 — Document Cross-Reference Scan (Behavior-to-Source Matrix)

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** —
**Design Refs:** - (no new UI; spec = source docs — story ACs, PRD REQs, audits, MEMORY, design guides — not SVG)
**Source:** [Epic 21 Story 21.3](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the QA author, I want every expected behavior traceable to its source document so that no test case asserts an invented expectation.

## Acceptance Criteria (EARS)

- AC1: The scan shall produce a behavior-to-source matrix in `docs/qa/behavior-sources.md`: behavior → source (story AC / PRD REQ / audit finding / MEMORY decision / design guide section).
- AC2: Sources shall be mined: story files in `docs/stories/completed/` + remaining active stories, epic docs in `docs/epics/`, PRD REQs (incl. §7.4 data model), audit docs (`docs/scans/`, `docs/completed/` plans incl. revenue lifecycle), `MEMORY.md` standing decisions/gotchas, design guides (`dashboard-design-guide.md`, `waitlist-page-design-guide.md`).
- AC3: The matrix shall flag conflicts: places where two sources disagree (e.g., vision v1.1-vs-Sprint-4 ledger, amended ACs superseded by later founder decisions) — with the governing source identified per MEMORY amendment trail.
- AC4: Standalone decisions that govern testing shall be indexed: standing constraints (Growth tier excluded, proxy not middleware, never-inline-styles), copy-gate rule, baseline test failures (7), founder decisions from 2026-09/10 sessions.
- AC5: Lint and build shall pass.

## Tasks

- T1 (AC2) Mine each source class
- T2 (AC1) Build matrix
- T3 (AC3) Conflict flags
- T4 (AC4) Governing-decisions index
- T5 (AC5) Gates

## Out of Scope

- Updating the source docs (conflicts are flagged, fixes happen in 19.0 or later with founder input); writing test cases.

## Dev Notes

- This story runs parallel to 21.1 — no dependency.
- Highest-value sources for expected behavior: story ACs are the real spec (PRD is higher-level); when story ACs were amended (trail markers like `[AMENDED 2026-09-30]`), the amendment governs.
- Known conflict to resolve here: vision `:429` vs Appendix (v1.1) for analytics — already resolved by founder 2026-10-04 (defer); record as resolved.
- Keep the matrix behavior-keyed, not doc-keyed (one row per behavior with its single governing source + secondary refs).

## Files to Create/Modify

| File                             | Change                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| `docs/qa/behavior-sources.md`    | New — behavior → source matrix + conflicts + decisions (T1–T4) |
| `docs/stories/completed/`        | Read-only mining source (AC2)                                  |
| `docs/scans/`, `docs/completed/` | Read-only audit sources (AC2)                                  |
| `.memory/MEMORY.md`              | Read-only decisions/gotchas source (AC2)                       |

## Risk

- Amended ACs govern over originals — mining story files without reading `[AMENDED]` markers produces superseded expectations (AC3 exists for this; the amendment trail is the authority).
- Doc-conflicts are flagged, not fixed here (Out of scope) — fixes route through 19.0/founder; don't edit source docs during this scan.
- Matrix must be behavior-keyed (one row, one governing source) — doc-keyed structure multiplies rows and makes 21.5 citations ambiguous.
