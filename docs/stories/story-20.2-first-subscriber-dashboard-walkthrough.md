# Story 20.2 — First-Subscriber Dashboard Walkthrough

**Status:** done
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

## AS-BUILT (executed 2026-10-05)

**Status:** T1-T6 done. Gates: lint 0 errors / 5 baseline warnings · prettier clean · full suite **1033 = 1026 pass / 7 fail = exact sanctioned baseline** (+13 tests in `dashboard-tour.test.tsx`) · clean build (`ƒ Proxy (Middleware)`). Dependency pinned: `driver.js@1.9.0` (newer than the researched 1.8.0; API verified against shipped types).

**Files (actual):** `package.json` · `components/dashboard/tour.tsx` (new — gate, 6 steps, driver lifecycle, Skip, flags, replay listener) · `components/dashboard/panel.tsx` (`dataTour` prop pass-through) · `components/dashboard/warmth-panel.tsx` + `qualification-panel.tsx` + `sidebar.tsx` (`data-tour` attrs — warmth has TWO roots: free-tier button + pro Panel; qualification has 4 overview returns, all tagged) · `src/app/dashboard/client.tsx` (header/stat-cards/signup-chart attrs + **Replay tour** button in header right cluster, gated `!isEmpty`) · `src/app/dashboard/shell.tsx` (mount after `{children}` — page captures run first) · `src/__tests__/components/dashboard-tour.test.tsx` (new, 13 tests).

**AC5 — copy:** founder approved the six step drafts verbatim (question tool, 2026-10-04, "Approve drafts as written"). Button labels = driver.js defaults + AC-quoted "Skip" and "Replay tour" (no gate). Step titles: Your waitlist is live · Overview · Signups Over Time · Warmth Distribution · Qualification Breakdown · Your toolkit. Order: header → stat cards → chart → warmth → qualification → sidebar. Subscriber table is NOT on `/dashboard` (it lives on `/dashboard/leaderboard`; multi-page tours out of scope) — tour highlights the real overview elements instead; flagged in the scan report.

**AC7 — mobile choice (documented):** below `lg` (1024px) the sidebar drawer is off-canvas, so the sidebar step is **omitted** (5 steps) and remaining steps highlight real elements; `skipMissingElement: true` + `waitForElement: 3000` cover slow dynamic chunks.

**AC1/AC6 — trigger:** single effect gated on `pathname === "/dashboard"`; count read via ref (a mid-tour `subscriber_count` refresh must not restart the tour); polls 400ms up to 15s for `[data-tour="dashboard-header"]` (absent while `loading.tsx` renders), then gives up silently — retries on the next `/dashboard` visit.

**AC3 — flag:** written only from `onDestroyed` (Skip / Done / close X). Cleanup-triggered destroy is guarded by `unmountingRef`, so StrictMode double-invoke and navigation never write the flag (dev never self-blocks; navigating away is not a dismissal).

**Survey coordination (20.1):** `setSurveySuppressed(true)` before `drive()`, `false` on destroy/unmount. `dashboard_viewed` (funnel) untouched. Residual multi-tab edge documented like 20.1's accepted `?upgrade=cap` edge: single-tab sequencing lands Survey 1 on visit >=2 (flag set, suppression released).

**Replay (AC4):** window CustomEvent `prewaitlist-tour-replay` (exported `TOUR_REPLAY_EVENT`); listener live whenever on `/dashboard`; force-start bypasses the completion flag but still requires `subscriber_count >= 1`; replay while active is a no-op (`isActive` guard).

**Prompt #3 audit (2026-10-05) — 1 finding, F1 fixed:**

- **F1 — tour stacked over the UpgradeModal on the `?upgrade=cap` deep link.** The cap-email deep link mounts the Pro modal at shell mount (`shell.tsx` `?upgrade=cap` effect) while the tour's poll auto-starts ≥400ms later with no modal awareness — driver.js gives the popover `z-index:1000000000` and `.driver-active *{pointer-events:none}`, so the modal (z-50) became unclickable until the tour was dismissed (a revenue moment behind an education moment; dismissing also burned the one-time flag). Fix: `DashboardTour` gains `interruptOpen` prop (shell passes `upgradeModal.open`); `startTour`/`attemptAutoStart` gate on it and the effect dep list is `[pathname, interruptOpen]` — modal-close resumes a fresh attempt same visit, modal-open mid-tour destroys via cleanup with the existing `unmountingRef` guard (no flag written). Locked by 3 new tests (no-start while open · starts after clear · interrupt destroy writes no flag), mutation-verified (3 failures with `startTour` gate removed). Gates re-run: lint 0/5 · full suite **1047 = 1040 pass / 7 fail = exact baseline** (+3 tests) · clean build.
- **Audit note (no code change) — survey suppression scope:** the tour's `setSurveySuppressed(true)` only gates `surveyTrigger`-flagged captures (currently `cancel_intent`); `dashboard_viewed` (Survey 1's trigger) is a funnel event AC2 requires to fire, so Survey 1's absence during the first-visit tour rests on identify/person-prop timing (identify runs after `dashboard_viewed` on visit 1), not on the flag. driver.js's `z-index:1000000000` popover would visually beat a PostHog popover (`z-index:1000`) anyway, and any survey left standing appears only after the tour is dismissed. Verify with PostHog's "why didn't my survey show" tool per the Verification steps; if Survey 1 ever shows mid-tour, change its trigger event or position (see story 20.1 setup).
