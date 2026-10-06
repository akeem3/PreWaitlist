# Story 20.1 — PostHog Instrumentation + Surveys

**Status:** done
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
- Touchpoint mapping (event → code location) — **[AS-BUILT 2026-10-04: every row below annotated with the actual shipped location; founder decisions D1–D7 supersede the scan-era guesses where they differ.]**
  - `account_created` → **`src/app/(auth)/signup/page.tsx`** after `auth.signUp` success, before `router.push(/verify-email…)` — **D1**: email-path only; Google-OAuth-created accounts are NOT captured (server callback has no client moment; `posthog-node` rejected as zero-dep). Property: `method: "email"`.
  - `onboarding_started` → `onboarding/1` mount ✓; `onboarding_completed` → success page existing mount effect ✓
  - `waitlist_published` → onboarding Step 5 launch success (post-PATCH `res.ok`, before push to success) ✓ property `waitlist_id`
  - `subscriber_received` → **`components/public/email-capture-form.tsx` success branch** — **D3** (exact moment, fires once for NEW subscribers; 409 duplicates return before it). Scan-era guess was the thank-you page — superseded. Property `waitlist_id` only, never email (AC3).
  - `dashboard_viewed` → `src/app/dashboard/client.tsx` mount-only effect — placed in the **client** (page.tsx is the server component); visibility/60s refresh effects explicitly excluded so they never re-fire it.
  - `warmth_viewed` → `src/app/dashboard/warmth/client.tsx` mount (page.tsx is server) ✓
  - `broadcast_started` → `broadcast/client.tsx` mount; `broadcast_sent` → after the honest-status checks (HTTP `ok` + `ok:false` both return first), properties `waitlist_id`/`segment`/`recipient_count` ✓
  - `upgrade_triggered` → **`components/dashboard/upgrade-modal.tsx` open effect** — **supersedes** the scan-era `useUpgradeModal()` shell choke point: the open effect is the one point covering ALL contexts (dashboard hook, onboarding `UpgradeModalWrapper`, `?upgrade=cap` deep link) and it co-locates the D7 suppression flag. Not captured when the cooldown auto-closes the open (that trigger never showed).
  - `checkout_started` → **both** openers: `upgrade-modal.tsx` `handleUpgrade` after `paddle.Checkout.open` + `use-paddle-upgrade.ts` `openCheckout` (property `trigger_source`)
  - `subscription_started` → **D2 client tier-flips**: shell `recordTierFlip` (applyTier + server-prop sync, `source: "dashboard"`) + `use-paddle-upgrade` onboarding poll (`source: "onboarding"`) — the two contexts are mutually exclusive (no shell during onboarding), so no double-fire. `posthog-node` webhook capture rejected (zero-dep).
  - `cancelled` → **D2 shell tier-flip pro → free** (`source: "tier_flip"`) in `recordTierFlip`, covering applyTier paths AND the server-prop path a webhook-driven downgrade takes while the tab is open. Known limitation (accepted): Paddle-portal cancellation with no dashboard tab open is never observed client-side. `cancellation-flow.tsx` instead captures the NEW **`cancel_intent`** event (first cancel click, `surveyTrigger: true`) = Survey 2's trigger.
  - Event name stays `cancelled` (one-L is Paddle's webhook spelling only) ✓
- **D6 — identify/person props (shipped):** `src/app/dashboard/layout.tsx` passes `founderId={user.id}` + selects `subscriber_count` → shell effect calls `identifyFounder(founderId, {tier, waitlist_id, subscriber_count})` + `registerContext(same)` and re-runs on tier flip / waitlist switch / layout refresh. Same-distinct-id identify = PostHog's supported person-prop update (no duplicate profiles). Fresh `subscriber_count` matters: Survey 1 targets it. `founderId` is an optional prop so tests render without analytics.
- **D7 — suppression (shipped):** `setSurveySuppressed(true)` while UpgradeModal is open, released by effect cleanup on close; wrapper drops only `surveyTrigger`-flagged captures while suppressed (currently `cancel_intent`). Funnel events are never dropped. The 20.2 walkthrough adds its own flag at that time.
- **AC5 setup = founder steps:** the two surveys are configured in the PostHog dashboard (external account = ask-first gate) using the verbatim spec in **## PostHog Dashboard Setup** below — copy, targeting, and once-per-trigger settings all written out there.
- **Prompt #3 audit (2026-10-04): 1 finding — F1 fixed.** `use-paddle-upgrade.ts` poll: an in-flight `/api/profile` tick that resumed after unmount/`cancel()` could still fire `subscription_started {source:"onboarding"}` + `onTierChanged`, racing the dashboard shell's own tier-flip capture (the D2 "mutually exclusive — no double-fire" claim held only for the common path). Fix: guard `if (!pollingRef.current) return;` placed **after the last `await`** (`res.json()`), so nothing between the guard and the capture can interleave. Locked by `src/__tests__/hooks/use-paddle-upgrade.test.ts` (4 tests, mutation-verified). All other ACs re-audited code-visible and passed.
- Surveys: PostHog surveys render as in-app popups — they collide visually with `UpgradeModal` and the planned 20.2 walkthrough. Suppress surveys while the upgrade modal or walkthrough is active (simple flag/ref check).
- Copy: survey question strings come **verbatim** from `docs/waitlist_feedback_system.md` §6 (founder-provided = pre-approved). Button/dismiss labels come from PostHog defaults or existing app copy — no new copy.
- `cancelled` vs `canceled` — our Paddle events use `subscription.canceled` (one L); keep the **event name** as `cancelled` per §16 doc, keep the **webhook** matching Paddle's spelling.
- **AC4 autocapture decision (founder-approved D4, 2026-10-04): KEEP ENABLED (PostHog default), pinned via `defaults: "2026-05-30"` in `src/lib/analytics.ts`.** Rationale: (1) the pinned preset keeps behavior explicit across SDK upgrades instead of drifting with library defaults; (2) autocapture's volume is bounded (clicks on interactive elements, form submits — not arbitrary DOM events), comfortably inside the free tier's 1M events/mo at our stage; (3) PostHog autocapture never captures input _values_ (email/password fields are excluded by the SDK), so AC3's no-PII rule holds without extra config; (4) it covers the long tail of untracked interactions (template card clicks, nav usage) without hand-wiring each one — the 13 AC2 events remain our deliberate funnel layer on top.

## Files to Create/Modify

**[AS-BUILT 2026-10-04 — this is what was actually shipped; rows that differ from the scan-era plan are annotated.]**

| File                                             | Change                                                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/analytics.ts`                           | **New** — wrapper: guarded `initAnalytics`, `capture` (+ D7 suppression), `identifyFounder`, `registerContext`, `setSurveySuppressed`                                   |
| `src/instrumentation-client.ts`                  | New — PostHog init + no-key no-op (T1/AC1)                                                                                                                              |
| `.env.example`                                   | Add `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (T5/AC6)                                                                                                      |
| `src/app/(auth)/signup/page.tsx`                 | `account_created` at email-signup success (**D1** — was `auth/callback/route.ts` in plan; OAuth gap documented)                                                         |
| `src/app/onboarding/1/page.tsx`                  | `onboarding_started` (T2)                                                                                                                                               |
| `src/app/onboarding/success/page.tsx`            | `onboarding_completed` (T2)                                                                                                                                             |
| `src/app/onboarding/5/page.tsx`                  | `waitlist_published` on launch success (T2)                                                                                                                             |
| `components/public/email-capture-form.tsx`       | `subscriber_received` (**D3** — was thank-you page in plan)                                                                                                             |
| `src/app/dashboard/client.tsx`                   | `dashboard_viewed` mount-only (was `dashboard/page.tsx` — server comp)                                                                                                  |
| `src/app/dashboard/warmth/client.tsx`            | `warmth_viewed` mount (was `warmth/page.tsx` — server comp)                                                                                                             |
| `src/app/dashboard/broadcast/client.tsx`         | `broadcast_started` / `broadcast_sent` (T2)                                                                                                                             |
| `components/dashboard/upgrade-modal.tsx`         | `upgrade_triggered` open effect + `checkout_started` + D7 suppression toggle (was shell `triggerUpgrade` in plan — see mapping)                                         |
| `src/hooks/use-paddle-upgrade.ts`                | `checkout_started` + onboarding `subscription_started` (T2); **audit F1 fix** — in-flight poll guard after last await (D2 no-double-fire)                               |
| `src/__tests__/hooks/use-paddle-upgrade.test.ts` | **New (audit)** — 4 tests: normal flip capture, free-then-flip continuity, unmount-mid-flight bail, cancel-mid-flight bail (mutation-verified: fails without the guard) |
| `src/app/dashboard/shell.tsx`                    | `recordTierFlip` (`subscription_started`/`cancelled`) + **D6** identify/register effect; `founderId` prop                                                               |
| `src/app/dashboard/layout.tsx`                   | **New (plan missed it)** — pass `founderId={user.id}`, select `subscriber_count`                                                                                        |
| `components/billing/cancellation-flow.tsx`       | `cancel_intent` survey trigger (surveyTrigger) — **D2/D7**; `cancelled` lives in the shell tier flip                                                                    |
| PostHog dashboard (external)                     | Surveys from feedback doc §6 (T4) — founder steps in ## PostHog Dashboard Setup below                                                                                   |

## PostHog Dashboard Setup (founder — AC5, external config)

Code ships the SDK + suppression gating; the surveys themselves live in the PostHog dashboard (external account — founder step, verified against PostHog survey docs 2026-10-04).

**One-time setup**

1. Create a project at `app.posthog.com` → copy the **Project API key** (`phc_…`).
2. Vercel → project env vars → add `NEXT_PUBLIC_POSTHOG_KEY` (the `phc_…` key) and `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.i.posthog.com`) → redeploy. (Local dev: leave unset — SDK no-ops.)
3. PostHog → Billing → set a **billing limit** (e.g. $0 hard limit) as belt-and-braces on the free tier (Dev Note: 1M events/mo, 1,500 survey responses/mo).

**Survey 1 — "After first subscriber"**

- Type: in-app survey, single **open text** question.
- Question (verbatim, `waitlist_feedback_system.md` §6): `Did seeing the first signup give you the signal you expected?`
- Display conditions (ALL must match): **User sent event** `dashboard_viewed` — with the event-repeat option set to **Just once**; **person property** `subscriber_count` greater than or equal to `1`; (optional belt) URL contains `/dashboard`.
- Why event-based, not URL-based: `subscriber_received` fires in the _subscriber's_ browser, not the founder's — so eligibility rides the founder's next dashboard visit, and PostHog's default "once per person until dismissed/completed" plus **Just once** satisfies AC5's once-per-founder-per-trigger limit.
- Signed-in founders only: `/dashboard` auth-redirects anonymous visitors, and `identify()` (shell) only ever runs for signed-in founders — so person properties exist only for them.
- Known accepted edge: a `?upgrade=cap` email deep link mounts dashboard + modal together; PostHog may show Survey 1 over the modal on that single visit (rare, dismissible-on-both).

**Survey 2 — "Before cancellation"**

- Type: in-app survey, single **open text** question.
- Question (verbatim, §6): `What made you decide this wasn't worth continuing?`
- Trigger: **User sent event** `cancel_intent` (captured on the billing page's first "Cancel subscription" click, `cancellation-flow.tsx`) — event-repeat option **Just once** (AC5 rate limit).
- Extra display condition (belt): URL contains `/dashboard/settings/billing`.
- Suppression: `cancel_intent` is sent with `surveyTrigger: true`, so the wrapper holds it back while the UpgradeModal owns the UI (D7) — the upgrade modal is never stacked by Survey 2.

**Verification**

- Trigger each event in-app → PostHog → Activity (live) shows the 13 events; `identify` shows person props `tier`, `waitlist_id`, `subscriber_count`.
- Launch both surveys → walk the display conditions in PostHog's preview/"why didn't my survey show" tool.
- Responses land under Surveys → each response links to the person + session replay.

## Risk

- AC2's server-side events (`subscription_started`, `cancelled`) — **[RESOLVED 2026-10-04, D2]** client-side tier-flip capture shipped in both contexts (shell + onboarding poll); zero-dep held, nothing skipped. Accepted limitation: Paddle-portal cancel with no dashboard tab open is never observed (also recorded in the mapping above).
- New `NEXT_PUBLIC_*` env vars — covered by this story's approval per plan, but **Vercel env setup is a founder step** (see ## PostHog Dashboard Setup); no-key no-op (AC1) keeps local dev safe regardless.
- Survey/upgrade-modal/walkthrough popup collisions (Dev Notes) — **[LANDED 2026-10-04, D7]** suppression flag ships with the upgrade modal (the colliding surface that exists today); the 20.2 walkthrough sets the same flag when it lands. Remaining accepted edge: Survey 1 on a `?upgrade=cap` deep-link mount (rare, documented in the setup section).
- Adding `posthog-node` would be a new dependency — ask-first rule applies if execution flips away from the zero-dep default. **Never added (D1/D2 hold).**
