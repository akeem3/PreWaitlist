# Revenue, Lifecycle & Email Fix Plan

**Date:** 2026-09-29 · **Branch:** `dev` · **Status:** Phase 1 DONE (uncommitted); Phases 2–6 not started
**Source:** two-pass investigation (4 codebase agents + Paddle/Resend docs), founder's 7 observed issues.
**Standing rules:** lint 0 errors + full suite at baseline + clean build per phase; copy gaps stop-and-ask; no new env/deps without asking; SQL migrations are founder-run with verification probes.

## Phase 0 — Founder ops (no code; unblocks money + mail)

| #   | Action                                                                                                                         | Why                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 0.1 | Vercel: rotate 5 Paddle vars to live (`pdl_live_*`, `live_*`, `NEXT_PUBLIC_PADDLE_ENV=production`)                             | Sandbox tokens can't take real payments                 |
| 0.2 | Paddle dashboard: approve `prewaitlist.com`; webhook → `https://www.prewaitlist.com/api/webhooks/paddle`; re-send failed event | Apex 308 kills webhook (Paddle won't follow)            |
| 0.3 | Resend dashboard: webhook → `https://www.prewaitlist.com/api/webhooks/resend`                                                  | Warmth/bounce/complaint ingestion dark until then       |
| 0.4 | Vercel: `NEXT_PUBLIC_BASE_URL=https://www.prewaitlist.com`; verify `CRON_SECRET` matches local                                 | Kills apex-308 link class; prevents silent cron freeze  |
| 0.5 | Vercel Domains: add `*.prewaitlist.com` ("Add Existing")                                                                       | All `{sub}.prewaitlist.com` links fail until then       |
| 0.6 | Supabase: run `epic16-story6-position-boost.sql`                                                                               | Skip-the-line + boost leaderboard sort inert until then |
| 0.7 | Confirm Resend key has Domains scope                                                                                           | Domain wizard 403s on sending-only keys                 |

## Phase 1 — Revenue path (DONE 2026-09-29, uncommitted on `dev`)

**Problem:** Pro pricing CTA starts free onboarding; checkout is login-walled with no signup-resume; triggers/pollers/landings assume an authed dashboard.

- [x] 1.1 Pro CTA branch (`pricing-section.tsx`): Pro card → `/signup?next=/dashboard/settings/billing&plan=pro`, label "Go Pro — live in 4 mins →" (approved verbatim). Free keeps `/onboarding/1`.
- [x] 1.2 Intent resume: `?next=` on `/signin` (password 3 sites + OAuth cookie, relative-path validated) + onboarding "Sign in" link → `?next=/onboarding/4` + signin→signup preserves `next`. Callback already honored both.
- [x] 1.2b Intent handoff hardening (founder-reported bug 2026-09-29: Pro CTA → signup → onboarding/1): shared `src/lib/auth-redirect.ts` (`getAuthIntent` + 1h cookie) carries **both** `next` and `plan=pro` through signup cookie → verify-email URL → back-to-signin link → signin cookie/pushes. Cookie lifetime 300s → 3600s (slow inbox round trips). +9 helper unit tests.
- [x] 1.3 Order = pay-before-onboarding (founder call): `dashboard/layout.tsx` skips the zero-waitlist → onboarding bounce when `?plan=pro`; billing page (guard-free) auto-opens checkout once for free tier and strips the param.
- [x] 1.4 Graceful 401 in `upgrade-modal.tsx`: logged-out attempt → signup with intent (`/signup?next=...&plan=pro`); API errors inline (`role=alert`); modal stays open on failure; Paddle-load dead button unchanged.
- [x] 1.5a `?upgrade=cap` wired: shell mount effect opens `subscriber_cap` modal + strips param (cap email link now lands).
- [x] 1.5b `email_customisation` headline: "Customise your sender name, subject and body" (approved verbatim).
- [x] 1.5c Cooldown enforced: modal auto-closes when `isSuppressed(trigger)` (AC8 live for all openers). **AMENDED 2026-09-29 (flicker fix):** explicit-intent `?plan=pro` deep links are exempt — `pro-cta-onboarding` (new-user leg) and `pro-cta-billing` (existing-account leg, split from the settings-page `billing` trigger) live in `COOLDOWN_EXEMPT_TRIGGERS` in `upgrade-modal.tsx`. Pre-fix, a prior dismissal auto-closed the arrival modal ~3ms after paint and the already-stripped param lost the pay intent ("upgrade modal just flickers"). Passive openers (sidebar, gates, settings button, cap link) still honor cooldown.
- [x] 1.5d Onboarding return-to-step: `UpgradeModal` accepts `successPath` (path, not URL — origin resolved in the click handler because render-time `window` throws during SSR prerender; fixed a `window is not defined` crash 2026-09-29, SSR-probed live on :3000); onboarding wrapper passes current step + `?upgraded=1` and polls `/api/profile` (2s×30) → flips context tier → strips param. Payer resumes where they stopped.
- [ ] DEFERRED (founder call): `csv_export` / `first_subscriber` left inert until Phase 2.6 / popup behavior decided.

**Gates:** lint 0/5 · suite 659/652/7 = baseline (dashboard-archive 4 + dashboard-subscriber-table 3) · clean build · +3 modal tests (401 redirect, inline error, cooldown auto-close); `next/navigation` mocked in modal tests · +9 `auth-redirect` helper tests.

## Phase 2 — Billing correctness

**Problem:** `past_due` no-op (free Pro on failed payment); no scheduled-cancel visibility; portal-return never refreshes UI; surplus waitlists + over-cap + Pro-config silently grandfathered; CSV ungated vs docs.

- [ ] 2.1 `subscription.updated` handler: persist `scheduled_change` (action + `effective_at`); "Pro until X" in `SubscriptionCard`; downgrade only on effective `canceled`. (Matches Paddle semantics: portal cancel → `updated` now, `canceled` at period end.)
- [ ] 2.2 `past_due`: keep Pro + "Update payment" portal banner.
- [ ] 2.3 Portal-return refresh: `?canceled=1` strip + `refreshTier()`; un-silence portal errors (inline + pending states); null-ID limbo branch.
- [ ] 2.4 Billing surfaces: real renewal/cancel dates, real `waitlistCount`, remove-or-wire invoice history.
- [ ] 2.5 Surplus-waitlist policy (lock-read-only / auto-archive / bless) + over-cap banner + Pro-config-on-downgrade rules. **GATE: founder policy.**
- [ ] 2.6 CSV gate: `requirePro` on export route OR correct docs. **GATE: founder call.**

**Verify:** sandbox portal cancel → scheduled state → period-end downgrade (Paddle test clock); downgrade walkthrough; webhook unit tests for `updated`/`past_due`.

## Phase 3 — Email platform

**Problem:** quota rejections are silent email loss; no metering/quotas/alerts (REQ-7.1a.4 unimplemented); unbounded Pro bulk on one shared Resend account; batch blind spots; resubscribe dead end.

- [ ] 3.1 Classify Resend 429s (`daily_quota_exceeded` / `monthly_quota_exceeded` / `rate_limit_exceeded`) → retry queue + `email_events failed` rows + founder warning.
- [ ] 3.2 Platform meter + budgets: nightly per-founder aggregation; dashboard meter; 70/90% alerts; monthly bulk budget enforced pre-send; compose shows "this send = N emails".
- [ ] 3.3 Send-path fixes: updates idempotency key; per-item batch accounting; `cap_warning_sent_at` column; single milestone email per referral.
- [ ] 3.4 Deliverability: `List-Unsubscribe` headers on transactional (extend `sendEmail`); Reply-To; `www`-pinned one-click URL; send-time `sending_domain` re-verification.
- [ ] 3.5 Branding: remove/invert Pro logo header; tier fail-loud (not `|| "free"`); milestone tier branch. **GATE: footer string vs logo — what was seen?**
- [ ] 3.6 Resubscribe recovery: 409 `resubscribable` + re-issue flow; `unsubscribed_at` + action on subscriber detail; bounce-clear affordance.
- [ ] 3.7 Retention: drop `sent/delivered` echoes >90d; `clicked`-only warmth reads + partial index; batched warmth UPDATEs.

**Verify:** quota-simulation tests (mocked 429s); budget tests; Resend volume check post-deploy.

## Phase 4 — Funnel dead-ends

- [ ] 4.1 FlushGate: pre-check existing waitlist before POST; discard-draft escape; headline-without-slug → Step 1.
- [ ] 4.2 Phase-B server guard: unauth `/onboarding/4*` → `/onboarding/signup`.
- [ ] 4.3 Archived: `is_archived` on leaderboard/thank-you → `/gone`; archived-dashboard read-only call.
- [ ] 4.4 `resolveActiveWaitlist` helper (newest default; `?wid` > stored > newest) shared everywhere.
- [ ] 4.5 Updates free-gate modal (broadcast pattern); tier-before-lookup ordering.
- [ ] 4.6 Thank-you recovery UI + PGRST204 silent-success fix; resubscribe GET→POST-confirm.

**Verify:** per-item walkthroughs + regression tests; suite at baseline.

## Phase 5 — Growth surfaces

- [ ] 5.1 Per-subdomain `generateMetadata` (og:title/description + twitter card) from waitlist row. **GATE: og:image strategy (static vs dynamic).**
- [ ] 5.2 Success buttons → shared `ShareButtons`; optional platform tabs (design call).
- [ ] 5.3 Footer absolute `www` URL with identifying param on both links; merge acquisition cookie on subdomain rewrite; tighten hero trigger; namespace subscriber `?ref=`. **GATE: "referred" = hero / attribution / credit?**

**Verify:** X + Facebook unfurl validators; cookie walkthrough subdomain→apex→signup.

## Phase 6 — Debt + doc honesty

`middleware.ts` → `proxy.ts` migration; delete one supabase helper; `.env.example` (from `src`, not docs); signup honeypot/timing/IP-limit; `email_normalized` (or `citext`) + 23505 hardening + no raw-error echo; atomic cap; `display_name` cap; consent checkbox-or-amend-doc; doc corrections (price var, csv trigger, cooldown, meta-tags claims, consent claim).

## Copy gaps (stop-and-ask when reached)

Pro CTA button · 1.5b headline · post-pay confirmation UX · "Pro until X" / dunning strings · portal error strings · over-cap + surplus-waitlist banners · broadcast partial-success (B7, open) · platform-tab mock (design).
