# Story 19.5 — Mobile Responsiveness Audit

**Status:** ready
**Epic:** 19 — Product Fixes & Polish
**Depends on:** —
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.5](../epics/epic-19-product-fixes-polish.md)

## Story

As a visitor on a phone, I want every public and dashboard screen usable so that mobile traffic isn't lost.

## Acceptance Criteria (EARS)

- AC1: Each screen shall be audited at 375×667 and 768×1024 viewports: public waitlist page (3 templates), thank-you, leaderboard, gone, marketing home, auth pages (signup/signin/verify/forgot/reset), onboarding steps 1–5/4a/success (two-pane and centered layouts, sticky mobile CTA), dashboard home + all 7 section pages + subscriber detail + settings tree (hub/list/detail/billing/profile).
- AC2: Findings (overflow, unreachable controls, table clipping, text collision) shall be listed with screenshots as evidence.
- AC3: All P0/P1 findings (unusable at 375px) shall be fixed.
- AC4: P2 findings (polish-level) shall be logged for founder triage.
- AC5: Mobile fixes shall use existing responsive utilities only — no new breakpoints or tokens.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1-AC2) Audit with evidence
- T2 (AC3) Fix P0/P1
- T3 (AC4) Triage log
- T4 (AC5-AC6) Token compliance + lint/build

## Out of Scope

- Native app behavior; tablet-specific layouts beyond the 768 check.

## Dev Notes

- Playwright (21.2 capture) can double as evidence gathering — coordinate with 21.2's mobile viewport shots so the audit doesn't re-capture.
- Prior mobile work: 12.1.5 (table overflow, responsive grids), Epic 4 sticky mobile CTA, leaderboard mobile responsive (7.5) — audit verifies these still hold post-Epic 18 redesign.
- Epic 18.6–18.8 redesigned the live page + preview fit — re-verify preview scaling on small screens (this is where regressions are most likely).

## Files to Create/Modify

| File                                                     | Change                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/stories/story-19.5-mobile-responsiveness-audit.md` | Findings + screenshots evidence + P2 triage log (T1, T3)         |
| `docs/qa/screenshots/` (via 21.2)                        | Reuse mobile captures as evidence (coordinate, don't re-capture) |
| Files fixed during T2                                    | TBD — existing responsive utilities only (T2)                    |

## Risk

- Coordination risk with 21.2: capture script must ship mobile viewport shots or the audit re-captures — sync before executing either story.
- Epic 18 preview-fit is the most likely regression zone (Dev Notes) — prioritize preview scaling checks at 375px.
- AC5 forbids new breakpoints/tokens — if a fix "needs" one, it's a P2 defer or a founder decision, not an inline addition.
