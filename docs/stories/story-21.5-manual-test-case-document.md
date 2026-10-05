# Story 21.5 — Manual Test-Case Document

**Status:** ready (founder approval gate on validation-failure list)
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** 21.1–21.4, 19.1–19.2, 20.1–20.3
**Design Refs:** - (no new UI; spec = 21.1–21.4 outputs, not SVG)
**Source:** [Epic 21 Story 21.5](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the founder, I want a single executable test document covering every flow of the real app so that I can verify the product by hand before launch.

## Acceptance Criteria (EARS)

- AC1: `docs/qa/manual-test-cases.md` shall exist as a single file (founder decision 2026-10-04), structured with anchored sections per flow area: (1) Auth & account, (2) Onboarding, (3) Founder dashboard, (4) Public waitlist & thank-you, (5) Leaderboard & referrals, (6) Warmth, (7) Email & broadcast, (8) Billing & upgrade, (9) Feedback/tooling surfaces (20.1–20.3), (10) Edge cases & guards, (11) Mobile, (12) Input validation (pre-flagged from 21.4).
- AC2: Every case shall have: ID (`TC-<area>-NN`), title, preconditions, numbered steps, expected result **with citation** to a 21.3 source (story AC/REQ/decision) or a 21.2 screenshot reference, and a pass/fail column.
- AC3: Cases shall be derived ONLY from 21.1 inventory + 21.2 screenshots + 21.3 matrix + 21.4 findings (not from the outdated user-flow doc).
- AC4: Coverage check: every inventory row (21.1 AC1) has ≥1 case; every 21.4 failure has a pre-flagged case; every 20.x surface has ≥1 case.
- AC5: **Founder approval gate:** the 21.4 failing-validations list is presented to the founder for fix/defer decisions BEFORE the document finalises; outcomes recorded in the doc (fixed-in-21.6 vs deferred-with-signoff).
- AC6: The doc shall open with a "How to execute" header: prerequisites (accounts, tiers, seed data, local vs prod), result-recording convention, and the sanctioned test-baseline note (7 known suite failures are code-suite, not manual — don't confuse).
- AC7: Lint and build shall pass.

## Tasks

- T1 (AC1) Outline + case skeletons from inventory
- T2 (AC2-AC3) Write cases with citations
- T3 (AC4) Coverage check
- T4 (AC5) Founder approval gate
- T5 (AC6) Exec header
- T6 (AC7) Gates

## Out of Scope

- Automating these cases (manual doc is the deliverable); rewriting the user-flow doc.

## Dev Notes

- Target size: comprehensive but executable — expect ~150–250 cases. Prefer one case per meaningful behavior; combine trivial assertions (e.g., all legal pages render = one case with 3 checks).
- Citation format: `Expected: ... (source: story-12.3 AC5)` or `Expected: ... (see screenshots/07-broadcast-pro-desktop.png)`.
- Template research validation (2026-10-04): Katalon/Smartsheet manual test-case templates use exactly the AC2 field set (test-case ID, steps, expected results, actual results, pass/fail) and stress traceability — "if another tester cannot follow your steps and reproduce your result, the documentation has failed"; TestMatick's pre-launch QA checklist categories (core flows, transactional email rendering incl. unsubscribe links, edge/error states, mobile, smoke test) align with the AC1 section list. No AC changes needed — structure already matches industry practice.
- Free/pro cases need tier-switching instructions (SQL tier flip per MEMORY or Paddle sandbox upgrade) — put in the exec header.
- Email cases: note that warmth/webhook/cron paths don't work locally (MEMORY) — mark prod-only cases explicitly.
- 19.1's fix must land first: confirmation-email footer cases assert tier-correct behavior.

## Files to Create/Modify

| File                                         | Change                                        |
| -------------------------------------------- | --------------------------------------------- |
| `docs/qa/manual-test-cases.md`               | New — single executable test document (T1–T5) |
| Inputs: `docs/qa/app-inventory.md` (21.1)    | Read-only source (AC3)                        |
| Inputs: `docs/qa/screenshots/` (21.2)        | Read-only citations (AC2)                     |
| Inputs: `docs/qa/behavior-sources.md` (21.3) | Read-only citations (AC2)                     |

## Risk

- AC5 is a hard **founder approval gate** — the document cannot finalise before the 21.4 failing-validations list gets fix/defer decisions; this is a stop-and-wait dependency, not a parallel task.
- Dependencies span three epics (19.1–19.2, 20.1–20.3) — writing cases against unfixed/unbuilt behavior creates stale expectations; 19.1's footer fix is explicitly required first (Dev Notes).
- Standing rule (epic): NEVER derive cases from `docs/planning-docs/user-flow-waitlist-tool.md` — only 21.1/21.2/21.3/21.4 inputs (AC3).
- Scale risk: ~150–250 cases with per-case citations — coverage check (AC4) must be mechanical (inventory row → case ID cross-ref), not eyeballed.
