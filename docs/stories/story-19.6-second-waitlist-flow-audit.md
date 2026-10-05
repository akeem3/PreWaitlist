# Story 19.6 — Second-Waitlist Flow Audit

**Status:** ready
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.6](../epics/epic-19-product-fixes-polish.md)

## Story

As a Pro founder, I want the multi-waitlist experience (switcher, create-second-list, per-waitlist settings) verified so that the feature shipped in Epic 12.2 works end-to-end.

## Acceptance Criteria (EARS)

- AC1: The flow shall be exercised: create second waitlist from settings hub → appears in waitlist list → switch via `?wid`/switcher → dashboard + all section pages reflect active waitlist → per-waitlist settings edit persists → archived list behaves (hidden/gone).
- AC2: Free-tier attempt at a second list (if gated) shall show the correct upgrade/limit behavior; ungated behavior shall be recorded as-is.
- AC3: Cross-waitlist data isolation shall be verified: subscribers, updates, broadcast, warmth of list A never render under list B.
- AC4: Findings shall be fixed or deferred with founder sign-off.
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC3) Execute flow with evidence
- T2 (AC4) Fix/defer
- T3 (AC5) Lint + build

## Out of Scope

- Building anything new — this is audit-only per vision `:432` ("lighter path for returning Pro founders" = already shipped).

## Dev Notes

- Stories 12.2.14–12.2.18 built this; `resolveActiveWaitlist` adopted in 6 section pages + shell (`?wid` > stored > newest). AC3 isolation check is the highest-value part — prior bugs in this codebase were stale-closure cross-list leaks (milestone rewards disappearing fix).
- Second-list creation entry point: settings waitlists list (`/dashboard/settings/waitlists`).

## Files to Create/Modify

| File                                                    | Change                                            |
| ------------------------------------------------------- | ------------------------------------------------- |
| `docs/stories/story-19.6-second-waitlist-flow-audit.md` | Flow evidence + fix/defer log in results (T1, T2) |
| Files fixed during T2                                   | TBD as findings surface                           |

## Risk

- AC3 (cross-list isolation) is the highest-value check — stale-closure leaks historically shipped in this codebase; test with two lists holding different data, not empty lists.
- "Audit-only" scope (Out of scope) vs AC4 "findings shall be fixed" — small fixes in, anything new-building out with founder sign-off.
- AC2 hinges on whether second-list creation is actually gated — record observed behavior as-is rather than assuming gating exists.
