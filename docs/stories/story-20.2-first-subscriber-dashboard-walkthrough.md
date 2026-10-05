# Story 20.2 — First-Subscriber Dashboard Walkthrough

**Status:** ready
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** —
**Design Refs:** - (no new UI; spec = founder brief "first visit to active dashboard after first subscriber", not SVG)
**Source:** [Epic 20 Story 20.2](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As a founder seeing my dashboard with a real subscriber for the first time, I want a short guided walkthrough so that I know what to do next.

## Acceptance Criteria (EARS)

- AC1: The walkthrough shall start only when ALL hold: user is on `/dashboard`, the active waitlist has `subscriber_count >= 1`, and the tour has not been completed/dismissed before (localStorage flag).
- AC2: The tour shall use `driver.js` (MIT) with a modal overlay, highlighting real dashboard elements (stat cards, subscriber table, warm panel / sidebar sections as designed) in sequence.
- AC3: Tour step count shall be ≤ 6 steps, each with a title + description, plus Next/Skip controls; Skip or completion sets the localStorage flag.
- AC4: A "Replay tour" affordance shall be available (small link/button in the dashboard header or settings) so the founder can rerun it on demand.
- AC5: Tour step content strings shall be reviewed against the copy gate: strings sourced from the feedback doc or existing app copy; any new user-facing copy requires founder approval before merge.
- AC6: The tour shall not render during the initial page-load skeleton (only after data resolves).
- AC7: Mobile (375px): tour renders without breaking layout — elements must be highlightable or the tour degrades to sequential cards (document choice).
- AC8: Lint, tests, and build shall pass (add component test: trigger conditions + completion flag).

## Tasks

- T1 (AC1, AC6) Trigger gate (subscriber count + dismissal flag + post-load)
- T2 (AC2-AC3) driver.js install + step definitions
- T3 (AC4) Replay affordance
- T4 (AC5) Copy review
- T5 (AC7) Mobile behavior
- T6 (AC8) Tests + gates

## Out of Scope

- Tours for onboarding (onboarding has its own flow/progress UX); multi-page tours; tours on public pages.

## Dev Notes

- New dependency: `driver.js` — MIT, ~5kb, no deps, commercial use free (verified 2026-10-04). Import `driver` from `driver.js` + `driver.js/dist/driver.css` (official docs pattern).
- driver.js official-doc patterns for AC6/AC7 (researched 2026-10-04): start the tour only after the target elements exist using `waitForElement` (AC6 — data-resolved gate); set `skipMissingElement: true` so a missing/highlight-blocked element falls back to a centered popover instead of dead-ending (AC7 mobile degradation, document the choice); set the localStorage completion flag from `onDestroyed` (fires on both Skip and completion, covers AC3 in one hook).
- Data for the gate: dashboard already has subscriber count + server tier via layout → shell. Persist dismissal key: `founder-dashboard-tour-complete` (v1-friendly; add version prefix if steps change: `tour-v1-done`).
- Wiring location: `src/app/dashboard/shell.tsx` (client shell owns client state) — start tour after skeletons resolve (respect `react-hooks/set-state-in-effect` lint rule: initialize refs lazily, start from an effect that reads `localStorage` via lazy init pattern used elsewhere).
- The 20.1 surveys must not fire while the tour is active (coordinate flags).
- Interaction with empty state: tour requires ≥1 subscriber so it never tours the Epic 12.1.1 empty state — that's deliberate (founder brief: "on first visit to active dashboard after first subscriber").

## Files to Create/Modify

| File                                               | Change                                                        |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `package.json`                                     | Add `driver.js` dependency (MIT) (T2)                         |
| `src/app/dashboard/shell.tsx`                      | Tour wiring: trigger gate, post-load start, flags (T1)        |
| `components/dashboard/tour.tsx`                    | New — step definitions (≤6), Next/Skip, onDestroyed flag (T2) |
| `src/app/dashboard/shell.tsx` (header) or settings | Replay tour affordance (T3)                                   |
| `src/__tests__/components/` (new test)             | Component test: trigger conditions + completion flag (T6)     |

## Risk

- `driver.js` is a new dependency — explicitly pre-approved (free-tier deps approved by founder 2026-10-04), so the ask-first gate is satisfied; record the version pin at execution.
- `react-hooks/set-state-in-effect` lint rule bites here (Dev Notes) — follow the lazy-init/ref pattern or T6 gates fail on lint.
- Copy gate (AC5): tour strings must come from the feedback doc/existing copy — new strings need founder approval before merge; don't draft step titles ad hoc.
- Survey/walkthrough collision with 20.1 — share the suppression flag; the two stories must coordinate or modals stack.
