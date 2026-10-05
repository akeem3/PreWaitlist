# Story 19.4 — Error & Loading States Audit

**Status:** ready
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.4](../epics/epic-19-product-fixes-polish.md)

## Story

As a user, I want every async operation to show a loading state and a recoverable error state so that failures never present as a blank or frozen screen.

## Acceptance Criteria (EARS)

- AC1: Every client-side fetch in pages/components shall be audited: each has an in-flight indicator (spinner/skeleton/"Saving…") and a failure branch with user-visible messaging.
- AC2: Loading skeletons that exist (`onboarding/loading.tsx`, `dashboard/loading.tsx`, chart/panel skeletons) shall be verified to render on the real navigation paths.
- AC3: Server route handlers shall return non-2xx with an `error` string for every failure path (no silent 200-with-error).
- AC4: Broken rows found (fetch with no error handling, unhandled promise, error swallowed to console only) shall be fixed.
- AC5: Deferred items shall be logged with founder sign-off.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2) Audit matrix with evidence
- T2 (AC3) Server error-path check
- T3 (AC4) Fixes
- T4 (AC5) Defer log
- T5 (AC6) Lint + build

## Out of Scope

- Redesigning skeletons; new loading UI beyond existing design-system patterns.

## Dev Notes

- Highest-risk spots (check first): `use-paddle-upgrade.ts` (known console-only silent failure — flagged, not fixed, in Pro-CTA session), settings `saveField` paths, dashboard auto-refresh, `FlushGate`, onboarding debounced slug check, broadcast send, updates publish, CSV download.
- Existing patterns to reuse: `EMAIL_FAILED_COPY` honest-status pattern (Phase B), `res.ok`/`data.error` modal pattern (Epic 13 post-deploy fix).

## Files to Create/Modify

| File                                                    | Change                                               |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `docs/stories/story-19.4-error-loading-states-audit.md` | Audit matrix + defer log in results section (T1, T4) |
| Files fixed during T3                                   | TBD as broken rows surface (fetch/error handling)    |
| `src/hooks/use-paddle-upgrade.ts`                       | Highest-risk: known console-only silent failure      |

## Risk

- `use-paddle-upgrade.ts` silent failure is a known-but-deferred item — fixing it here may exceed "audit" scope; small fix in, larger re-scope with founder (ask-first).
- AC3 (server error paths) can surface many small 200-with-error spots — triage by severity, defer the cosmetic ones with sign-off rather than boiling the ocean.
- Fixes must not redesign loading UI (Out of scope) — reuse `EMAIL_FAILED_COPY` / `res.ok`+`data.error` patterns only.
