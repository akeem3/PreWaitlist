# Story 21.1 — Full App Inventory & Behavior Scan

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** —
**Design Refs:** - (no new UI; spec = live codebase — pages, APIs, proxy behavior — not SVG)
**Source:** [Epic 21 Story 21.1](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the QA author, I want a code-derived inventory of every route, guard, API endpoint, and state variant so that test cases are grounded in what actually exists.

## Acceptance Criteria (EARS)

- AC1: The scan shall produce `docs/qa/app-inventory.md` containing: (a) every App Router page (36 identified 2026-10-04) with purpose, auth requirement, tier gating, and template/tier variants; (b) every API route with method, auth model, validation inputs, and error responses; (c) proxy.ts routing behavior (subdomain rewrite, auth guards, redirects, trailing-slash/double-subdomain handling); (d) non-route surfaces: 6 email templates + footers, upgrade modal, walkthrough (20.2), feedback surfaces (20.3).
- AC2: Each entry shall list observable states: empty vs populated, free vs pro (where behavior differs), loading, error.
- AC3: Each entry shall list its guards: signed-in required, email verified, archived/`?wid` handling, rate limits, cap checks.
- AC4: The inventory shall cross-reference existing known-good behaviors (from MEMORY/audits) so 21.5 doesn't re-discover fixed items as bugs.
- AC5: Findings that contradict docs (route exists but undocumented, or doc claims route that doesn't exist) shall be listed in a "discrepancies" section.
- AC6: Lint and build shall pass.

## Tasks

- T1 (AC1a) Page inventory (glob `src/app/**/page.tsx` + read each)
- T2 (AC1b) API inventory (glob `src/app/api/**/route.ts`)
- T3 (AC1c) Proxy/guard mapping
- T4 (AC1d) Email + component surfaces
- T5 (AC2-AC4) States/guards/cross-refs
- T6 (AC5) Discrepancies
- T7 (AC6) Gates

## Out of Scope

- Testing (that's 21.7); writing test cases (21.5); fixing anything found.

## Dev Notes

- Starting inventory (2026-10-04 glob): 36 pages — unsubscribe, unsubscribe/resubscribe, legal/terms, legal/privacy, onboarding/{success,signup,1,2,3,4,4a,5}, auth/{auth-code-error}, dashboard/{qualification,page,leaderboard,settings/{page,waitlists,security,profile,billing},broadcast,updates,warmth,subscribers/[id],[waitlistId]/settings}, (public)/[subdomain]/{page,thank-you,leaderboard,gone}, (marketing)/page, (auth)/{forgot-password,signin,verify-email,reset-password,signup}.
- Read each page file — do not infer behavior from filenames.
- Email surfaces to inventory: confirmation, moved-up, milestone congratulatory, broadcast, unsubscribe footer variants + tier-conditional footers (19.1 changes this — inventory records post-19.1 state).
- State variants worth explicit rows: waitlist page × 3 templates × free/pro (PoweredByFooter), dashboard × free/pro (locked nav/panels), onboarding two-pane vs centered layouts.

## Files to Create/Modify

| File                       | Change                                            |
| -------------------------- | ------------------------------------------------- |
| `docs/qa/app-inventory.md` | New — pages/APIs/proxy/surfaces inventory (T1–T6) |
| `src/app/**/page.tsx`      | Read-only source (do not infer from filenames)    |
| `src/app/api/**/route.ts`  | Read-only source (T2)                             |
| `src/proxy.ts`             | Read-only source (T3) — routing/guard mapping     |

## Risk

- Inventory must record the **post-19.1** footer state (Dev Notes) — sequencing matters: if 19.1 hasn't landed, note the intended state or re-verify after it does.
- 36 pages + all API routes is a large read pass — "read each file, don't infer" (Dev Notes) is the correctness rule; skimming filenames produces a wrong inventory that poisons 21.5.
- AC4 cross-refs to MEMORY/audits prevent false bugs in 21.5 — skip it and known-good items resurface as "failures" during execution.
