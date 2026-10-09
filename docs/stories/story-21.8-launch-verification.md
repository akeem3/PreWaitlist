# Story 21.8 — Launch Verification

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** 19.\*, 20.\*, 21.7
**Design Refs:** - (no new UI; spec = vision `:440` exit condition + 21.7 results, not SVG)
**Source:** [Epic 21 Story 21.8](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the founder, I want a final launch-readiness sign-off against the vision exit condition so that Sprint 4 closes with a clear go/no-go.

## Acceptance Criteria (EARS)

- AC1: The vision exit condition (`:440`) shall be walked explicitly: sign up → build waitlist → collect signups → track warmth → send broadcast → export data — each step verified working on production Vercel with no broken state (evidence: 21.7 results + live check).
- AC2: Epic 19 completion shall be confirmed: 8/8 stories done or explicitly deferred with sign-off; P0 tier fix verified in production (Pro confirmation email has no Powered-by).
- AC3: Epic 20 completion shall be confirmed: PostHog capturing events live, surveys live, walkthrough firing once for a qualifying founder, feedback button + founder contact popup live, Dub playbook delivered, PH prep delivered.
- AC4: Final gates recorded: `pnpm lint` 0 errors, full suite at baseline (7 sanctioned failures), clean `pnpm build`, prettier clean.
- AC5: An open-items register shall list everything still pending outside code: Paddle production domain approval status, Resend webhook URL dashboard update (www endpoint), `*.prewaitlist.com` wildcard DNS in Vercel, founder env vars (PostHog key, Tally URL, contact channels) presence in Vercel, any 21.6 deferrals.
- AC6: A launch recommendation (go / no-go with reasons) shall be stated, tied to AC1–AC5 evidence.

## Tasks

- T1 (AC1) Live exit-condition walkthrough
- T2 (AC2-AC3) Epic completion confirmation
- T3 (AC4) Final gates
- T4 (AC5) Open-items register
- T5 (AC6) Recommendation

## Out of Scope

- Actual Product Hunt submission (20.5 prepares only); post-launch monitoring setup beyond Epic 20.

## Dev Notes

- This story is the Sprint 4 exit gate — `epic-check` (Prompt #4) runs here as the independent audit layer on top of this self-verification.
- Deploy to production before AC1 (Vercel auto-deploys from `main` per MEMORY flow: merge dev → main).
- Open items from MEMORY that predate Sprint 4 and must appear in AC5: Paddle webhook prod URL (founder updated 2026-10-03 — confirm), Paddle domain approval, Resend webhook (www, live-verified 2026-09-27 — confirm current), og:image:alt static string question.

## Files to Create/Modify

| File                                             | Change                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `docs/stories/story-21.8-launch-verification.md` | Results: exit walkthrough, epic confirmations, gates, open items, recommendation (T1–T5) |
| `docs/epics/epic-19-*.md`, `epic-20-*.md`        | Status confirmations if stories close here (T2)                                          |

## Risk

- Manual/founder dependencies stack here: production deploy (Dev Notes), Paddle/Resend/Vercel dashboard confirmations (AC5) — the story can't complete solo; gather external confirmations early.
- AC1 runs on production only — if a deploy is stale or an env var is missing (PostHog/Tally keys), live checks fail for environmental reasons; the open-items register (AC5) is where those get recorded, not silently skipped.
- `epic-check` (Prompt #4) is the independent layer on top of this self-verification (Dev Notes) — this story's output feeds that audit; keep evidence concrete so the prompt can verify claims.
