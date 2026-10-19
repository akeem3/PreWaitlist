# Story 19.0 — Doc Debt: PRD Sprint 4 + Stale Tables

**Status:** done
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.0](../epics/epic-19-product-fixes-polish.md)

## Story

As the maintainer, I want the PRD to contain a Sprint 4 section and stale planning tables corrected so that Epics 19–21 have authoritative doc sources.

## Acceptance Criteria (EARS)

- AC1: The PRD shall contain a Sprint 4 section describing the scope captured in this plan (fixes, tooling additions, QA suite), cross-referencing Epics 19–21.
- AC2: `docs/epics/sprint-3-plan.md` "What's NOT Built (Sprint 4 scope)" table shall be annotated: items actually moved to v1.1 (custom domain mapping), post-MVP, or shipped elsewhere (multi-waitlist) shall be relabeled so no row falsely claims "Sprint 4 scope".
- AC3: The vision doc Sprint 4 section (`:420-440`) shall carry an amendment note: referral tree + traffic summary deferred to v1.1 (founder decision 2026-10-04); the six 👑 additions are tracked in Epics 20–21.
- AC4: `docs/planning-docs/user-flow-waitlist-tool.md` shall be marked as historical/outdated with a pointer to `docs/qa/manual-test-cases.md` (once created by 21.5).
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) PRD Sprint 4 section
- T2 (AC2-AC4) Stale-table + vision + user-flow annotations
- T3 (AC5) Lint + build

## Out of Scope

- Rewriting the user-flow doc itself.

## Dev Notes

- PRD currently declares 5 sprints (1, 2, 3, 3.1, 3.2) with no Sprint 4 section; header still says "Sprint 2 active" — fix the header while there.
- Keep the PRD section short and pointer-style (this plan is the detail source).
- AC4 pointer target won't exist until 21.5 — write the note as "superseded by docs/qa/manual-test-cases.md (Epic 21)".

## Files to Create/Modify

| File                                            | Change                                                     |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `docs/PRD.md`                                   | Sprint 4 section + stale "Sprint 2 active" header fix (T1) |
| `docs/epics/sprint-3-plan.md`                   | "What's NOT Built (Sprint 4 scope)" table relabeling (T2)  |
| `docs/product-vision-mvp-waitlist-tool.md`      | Sprint 4 amendment note at `:420-440` (T2)                 |
| `docs/planning-docs/user-flow-waitlist-tool.md` | Historical/outdated marker + pointer (T2)                  |

## Risk

- AC4's pointer target (`docs/qa/manual-test-cases.md`) doesn't exist until 21.5 — the note must be written in its future-pointing form now (per Dev Notes), not skipped.
- Doc edits to PRD/vision can drift from `sprint-4-plan.md` — keep the PRD section pointer-style so the plan stays the single detail source.
- Docs-only change, but AC5 still gates on lint + build — run both before marking done.
