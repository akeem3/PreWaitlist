# Story 19.6 — Second-Waitlist Flow Audit

**Status:** done
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
| `tests/e2e/second-waitlist-audit.spec.ts`               | Audit harness (single evidence run → report)      |
| `docs/qa/second-waitlist-audit/findings.json`           | Auto-generated per-run report (steps/findings)    |
| `docs/qa/screenshots/19.6-*.png`                        | Evidence screenshots (15)                         |
| Files fixed during T2                                   | TBD as findings surface                           |

## Results — T1 (AC1–AC3) Evidence

**Harness:** `tests/e2e/second-waitlist-audit.spec.ts` — one self-contained evidence run (login → free gate → tier flip → create → switch → isolate → persist → archive → unarchive → tier restore) writing `docs/qa/second-waitlist-audit/findings.json` + `19.6-*.png`.

**Final evidence run:** 2026-10-05 — **23/23 steps green, `ok: true`, fresh wizard creation** (qa2 deleted first so Steps 1→4 + FlushGate pickup are on the record; prior successful run covered the reuse path). Account handed back on **free** (`tierFlips: pro → free`, both 200).

### AC1 — flow exercised end-to-end

| Step                            | Evidence                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Create second list (wizard)     | `slug=qa2: Step 1→4 completed, FlushGate picked up the new list` (fresh run after REST delete)                        |
| Appears in settings hub         | `qa2 listed alongside qa-mobile` — `19.6-settings-hub-two-lists.png`                                                  |
| Switch via `?wid`               | `dashboard?wid=ef23deb1…` renders switcher labelled `"QA Second"`                                                     |
| Switch via switcher dropdown    | A ⇄ B via dropdown, URL keeps `wid=` — `19.6-switcher-two-lists.png`                                                  |
| Settings edit persists per list | B headline `"QA Second B updated"` after reload; A headline unchanged — `19.6-settings-persist-after-reload.png`      |
| Archive → hidden                | `Archived (1)` section shows the list — `19.6-archived-section.png`                                                   |
| Active archived → banner        | active stays on archived B with banner `"This waitlist is archived."` + Unarchive — `19.6-archived-active-banner.png` |
| Switcher marks archived         | `Archived` badge visible in dropdown                                                                                  |
| Archived → gone / no signups    | leaderboard → `/qa2/gone`; signup email inputs on main page = 0 — `19.6-archived-main-page.png`                       |
| Unarchive restores              | B back in the active list — `19.6-unarchived-active.png`                                                              |

### AC2 — free-tier gating (recorded as-is)

| Attempt                                | Verbatim evidence                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Header "Add new waitlist" (free)       | Upgrade modal, heading `"Upgrade to Pro"` — `19.6-free-attempt-header-modal.png`   |
| Switcher "Add new waitlist" (free)     | Upgrade modal, heading `"Upgrade to Pro"` — `19.6-free-attempt-switcher-modal.png` |
| `POST /api/waitlist` second list (API) | `status 402: {"error":"Upgrade to Pro to create more waitlists"}`                  |

Gating works correctly at both entry points and at the API. See findings F11 (headline copy) + F12 (alternate path) below.

### AC3 — cross-waitlist isolation (all pass)

| Surface        | Result                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stat cards     | Total signups **B=2, A=5** (each matches its own seed)                                                                                                                    |
| Leaderboard    | Pagination totals disjoint (B `of 2`, A `of 5`); anonymized names carry no domain so identity is asserted via totals — `19.6-leaderboard-A.png`, `19.6-leaderboard-B.png` |
| Updates feed   | A's update shows on A, does **not** render under B                                                                                                                        |
| Warmth         | Warmth totals isolated: B=2, A=5 — `19.6-warmth-B.png`                                                                                                                    |
| Broadcast page | Per-list content; A's update text absent from B — `19.6-broadcast-B.png`                                                                                                  |

## Results — T2 (AC4) Findings: fix / defer

| ID  | AC  | Severity    | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Disposition | Sign-off            |
| --- | --- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------- |
| F3  | AC1 | observation | Settings hub (`/dashboard/settings/waitlists`) has no create/add button when ≥1 list exists; second-list creation entry points are the **header + switcher** buttons. The list **does** appear in the hub after creation. AC1's "create from settings hub" wording reflects the story spec, not the shipped UI.                                                                                                                                                          | as-designed | **pending founder** |
| F11 | AC2 | P2          | Free "Add new waitlist" opens the upgrade modal with headline `"Upgrade to Pro"` — off-context for a create-more-lists action. Copy gate: cannot change without founder approval.                                                                                                                                                                                                                                                                                        | deferred    | **pending founder** |
| F12 | AC2 | observation | Alternate path (code-survey, not runtime-verified): a free founder who reaches `/onboarding/3` directly (bookmark/back-nav/resume) hits `flushToAPI()` → 402 → the fallback `GET /api/waitlist` returns 200 (their existing list) → silently pushed to `/onboarding/4` with **no message** and the draft never created (`src/app/onboarding/3/page.tsx:289-295`, `src/app/onboarding/context.tsx:347`). Normal entry points gate correctly at runtime (AC2 table above). | deferred    | **pending founder** |

No P0/P1 findings — **zero code fixes required by this story.**

### Harness notes (how the evidence was produced)

- Sign-in intermittently hangs >30s ("Signing in…", 2 of 6 runs) → harness retries login up to 3× with fresh page loads.
- Two `Unarchive` buttons exist when the archived-banner is visible (banner + row) → row click scoped to `main`.
- Reused runs re-edit B's headline, so broadcast char counts vary between runs — isolation assertion is content-based, not count-based.
- DB column is `subdomain` (API maps it to `slug`); qa2 deleted via REST before the final run (`on delete cascade` clears children).

## Results — T3 (AC5) Gates

- Lint: **0 errors** (5 baseline warnings) — 2026-10-05
- Build: **clean pass** (`.next` deleted first) — 2026-10-05
- Full suite: **1002 = 995 pass / 7 fail = exact sanctioned baseline** (dashboard-archive 4 + dashboard-subscriber-table 3; includes this story's spec run) — 2026-10-05

## Close-out

All ACs met (evidence tables written, 23/23 spec GREEN ×2, zero code fixes required, gates green). Founder closed Epic 19 on 2026-10-05 — F3 (settings hub has no add-waitlist button — entry = header + switcher; as-designed), F11 (P2 `"Upgrade to Pro"` headline — copy gate), and F12 (P2 edge path) recorded as non-blocking follow-ups.

## Risk

- AC3 (cross-list isolation) is the highest-value check — stale-closure leaks historically shipped in this codebase; test with two lists holding different data, not empty lists.
- "Audit-only" scope (Out of scope) vs AC4 "findings shall be fixed" — small fixes in, anything new-building out with founder sign-off.
- AC2 hinges on whether second-list creation is actually gated — record observed behavior as-is rather than assuming gating exists.
