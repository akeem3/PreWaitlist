# Story 20.1 — PostHog Instrumentation + Surveys

**Status:** ready
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** —
**Design Refs:** - (no new UI; spec = feedback doc §6 surveys + §16 event list, not SVG)
**Source:** [Epic 20 Story 20.1](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As the founder, I want product analytics and a few behavior-triggered feedback surveys so that I can see where founders drop off and ask the right question at the right moment.

## Acceptance Criteria (EARS)

- AC1: PostHog shall be initialized client-side via the official Next.js App Router pattern — `instrumentation-client.ts` at app root (supported on Next.js 16) — using `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`, with no-op behavior when the key is absent (local dev must not error). [AMENDED 2026-10-04 from `next/script` per official PostHog Next.js docs research.]
- AC2: The following funnel events from the feedback doc §16 shall fire: `account_created`, `onboarding_started`, `onboarding_completed`, `waitlist_published`, `subscriber_received`, `dashboard_viewed`, `warmth_viewed`, `broadcast_started`, `broadcast_sent`, `upgrade_triggered`, `checkout_started`, `subscription_started`, `cancelled`.
- AC3: Events shall carry minimal context properties (e.g., `waitlist_id` or `tier` where relevant) but never subscriber PII (no email addresses in event payloads).
- AC4: Autocapture shall be evaluated and either enabled (default) or explicitly disabled with rationale recorded — decision documented in Dev Notes.
- AC5: 2–3 PostHog surveys shall be configured per feedback doc §6, at minimum: "After first subscriber" (`Did seeing the first signup give you the signal you expected?`) and "Before cancellation" (`What made you decide this wasn't worth continuing?`), shown only to signed-in founders and rate-limited (once per founder per trigger).
- AC6: `.env.example` (if present) or env documentation shall list the two new `NEXT_PUBLIC_POSTHOG_*` variables.
- AC7: Lint, tests, and build shall pass; test suite stays at baseline.

## Tasks

- T1 (AC1) PostHog provider script + graceful no-key path
- T2 (AC2-AC3) Event capture wiring at the touchpoints listed in Dev Notes
- T3 (AC4) Autocapture decision
- T4 (AC5) Two/three surveys from §6
- T5 (AC6) Env docs
- T6 (AC7) Gates

## Out of Scope

- Full §16 event list (remaining events added post-launch as questions arise); data warehouse/dashboards building; funnel analysis interpretation.

## Dev Notes

- Verified free tier (2026-10-04): 1M events/mo, 1,500 survey responses/mo, 5K session replays, no credit card, 1 project, 1-year retention. Set a billing limit as belt-and-braces.
- Setup pattern (official PostHog Next.js docs, verified 2026-10-04): Next.js 15.3+ supports `instrumentation-client.ts` — prefer it over the older `'use client'` `providers.tsx` + `PostHogProvider` wrapper (both are documented; instrumentation-client is the lighter current recommendation). Env naming: PostHog's own tutorial uses `NEXT_PUBLIC_POSTHOG_KEY` — our two-var plan matches. Autocapture is ON by default in current SDK defaults (AC4: keep default + record decision). Surveys require the client SDK to be initialized (AC5 depends on AC1 pattern). Reverse-proxying `/ingest` to dodge ad-blockers is documented by PostHog but NOT in scope for MVP — note as v1.1 option. If a Content-Security Policy is ever added, allow `*.posthog.com`.
- Touchpoint mapping (event → code location):
  - `account_created` → `auth/callback/route.ts` (first login) or signup completion client
  - `onboarding_started` → `onboarding/1` mount; `onboarding_completed` → success page
  - `waitlist_published` → onboarding Step 5 launch success
  - `subscriber_received` → `POST /api/subscribers` success (server-side capture needs `posthog-node` — decision: fire from thank-you page client instead to avoid new server dep; record choice)
  - `dashboard_viewed` → `dashboard/page.tsx` client
  - `warmth_viewed` → `/dashboard/warmth` mount
  - `broadcast_started`/`broadcast_sent` → `broadcast/client.tsx` compose + post-send
  - `upgrade_triggered` → `triggerUpgrade(trigger)` from `useUpgradeModal()` in `src/app/dashboard/shell.tsx:52` (the shared hook is the choke point — 9 call sites: `email_customisation`, `qual_question` ×2, `pro-cta-onboarding`, `subscriber_cap`, `warmth` ×2, `billing`, `pro-cta-billing`)
  - `checkout_started` → `use-paddle-upgrade.ts` / modal checkout open
  - `subscription_started` → Paddle webhook success (server — see `posthog-node` note) or billing page "pro" poll success
  - `cancelled` → `cancellation-flow.tsx` completion
- Server-side events (`subscription_started`, `cancelled`) either use `posthog-node` (a second small dep — flag in story execution, default = capture client-side at the moment of confirmed state change to stay zero-dep) or are deferred with a note. Do not silently skip AC2.
- Surveys: PostHog surveys render as in-app popups — they collide visually with `UpgradeModal` and the planned 20.2 walkthrough. Suppress surveys while the upgrade modal or walkthrough is active (simple flag/ref check).
- Copy: survey question strings come **verbatim** from `docs/waitlist_feedback_system.md` §6 (founder-provided = pre-approved). Button/dismiss labels come from PostHog defaults or existing app copy — no new copy.
- `cancelled` vs `canceled` — our Paddle events use `subscription.canceled` (one L); keep the **event name** as `cancelled` per §16 doc, keep the **webhook** matching Paddle's spelling.

## Files to Create/Modify

| File                                              | Change                                                         |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `src/instrumentation-client.ts`                   | New — PostHog init + no-key no-op (T1)                         |
| `.env.example`                                    | Add `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (T5) |
| `src/app/auth/callback/route.ts`                  | `account_created` capture (T2)                                 |
| `src/app/onboarding/1/page.tsx`                   | `onboarding_started` (T2)                                      |
| `src/app/onboarding/success/page.tsx`             | `onboarding_completed` (T2)                                    |
| `src/app/dashboard/page.tsx`                      | `dashboard_viewed` (T2)                                        |
| `src/app/dashboard/warmth/page.tsx`               | `warmth_viewed` (T2)                                           |
| `src/app/dashboard/broadcast/client.tsx`          | `broadcast_started` / `broadcast_sent` (T2)                    |
| `src/app/dashboard/shell.tsx`                     | `upgrade_triggered` at the `triggerUpgrade` choke point (T2)   |
| `src/hooks/use-paddle-upgrade.ts`                 | `checkout_started` (T2)                                        |
| `components/billing/cancellation-flow.tsx`        | `cancelled` (T2)                                               |
| `src/app/(public)/[subdomain]/thank-you/page.tsx` | `subscriber_received` client-side choice (T2)                  |
| PostHog dashboard (external)                      | Surveys from feedback doc §6 (T4)                              |

## Risk

- AC2's server-side events (`subscription_started`, `cancelled`) — default is client-side capture to stay zero-dep; deferring either needs a recorded note, not a silent skip ("Do not silently skip AC2").
- New `NEXT_PUBLIC_*` env vars — covered by this story's approval per plan, but Vercel env setup is a founder step; no-key no-op (AC1) keeps local dev safe regardless.
- Survey/upgrade-modal/walkthrough popup collisions (Dev Notes) — suppression flag must land with the first surface that collides, or founders see stacked modals.
- Adding `posthog-node` would be a new dependency — ask-first rule applies if execution flips away from the zero-dep default.
