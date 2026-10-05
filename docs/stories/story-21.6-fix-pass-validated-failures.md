# Story 21.6 — Fix Pass on Validated Failures

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** 21.4, 21.5
**Design Refs:** - (no new UI; spec = founder-approved 21.4 failure list, not SVG)
**Source:** [Epic 21 Story 21.6](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the founder, I want the validation failures I approved for fixing corrected so that the test document's expected outcomes are honest.

## Acceptance Criteria (EARS)

- AC1: Every failure marked "fix" in the founder approval (21.5 AC5) shall be fixed with a regression test where practical.
- AC2: Every failure marked "defer" shall carry an explicit deferral note in `docs/qa/manual-test-cases.md` (what, why, target release) — no silent drops.
- AC3: Fixed behaviors shall have their test-case expected results confirmed against the fix (no stale expectations).
- AC4: No fix shall regress the sanctioned baseline: full suite returns 7 known failures (or fewer).
- AC5: Lint and build shall pass.

## Tasks

- T1 (AC1) Fix approved failures
- T2 (AC2) Deferral notes
- T3 (AC3) Expectation sync
- T4 (AC4-AC5) Baseline + gates

## Out of Scope

- Deferred items; any improvement not on the approved list.

## Dev Notes

- Severity order: broken → weak → strict (21.4 AC4 grouping).
- If a "fix" turns out to be architecturally larger than a validation tweak (e.g., requires schema/API contract change), stop and re-scope with founder — do not expand scope silently (ask-first).
- Run targeted tests per fix + one full suite at the end.

## Files to Create/Modify

| File                           | Change                                          |
| ------------------------------ | ----------------------------------------------- |
| Code files for approved fixes  | TBD — only items on the founder "fix" list (T1) |
| `docs/qa/manual-test-cases.md` | Deferral notes (AC2) + expectation sync (AC3)   |
| Test files per fix             | Regression tests where practical (T1)           |

## Risk

- Scope guard: only founder-approved "fix" items (Out of scope = everything else) — the temptation to opportunistically fix "while here" invalidates 21.4's evidence and the approval gate.
- Architecturally large "fix" discoveries must stop and re-scope (Dev Notes, ask-first) — schema/API contract changes are not validation tweaks.
- AC4 baseline: full suite must return **7 known failures or fewer** — a new failure beyond baseline means a fix regressed something; re-run before concluding (flaky-under-load gotcha from MEMORY).
