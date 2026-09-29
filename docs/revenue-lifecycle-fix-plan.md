# Revenue, Lifecycle & Email Fix Plan

**Date:** 2026-09-29 · **Branch:** `dev` · **Status:** Phases 1–2 + 3.1 DONE, uncommitted (commit only on founder instruction); 3.2–3.7 + Phases 4–6 not started (Phase 4 in progress)
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

## Phase 1 — Revenue path (DONE 2026-09-29 — committed `18aaba2` + `7678c32`, merged to `main`)

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
- [x] 1.6 Checkout robustness (founder-reported bug 2026-09-29 — red "Something went wrong. Please try again." on Upgrade click): `checkout/route.ts` profile `.single()` → `.maybeSingle()` + **create-if-missing** founder profile (pay-before-onboarding signups reach checkout from `onboarding/1` before any waitlist exists; `founder_profiles` was only created lazily at waitlist creation) + concurrent-create race re-select; `upgrade-modal.tsx` `!res.ok` now parses the body and surfaces the API's own error string (the old `data.error` branch was dead code — the route pairs every error with a non-2xx status, which threw first; generic fallback kept). Live-verified: profileless temp user → checkout 200. `7678c32`.
- [ ] DEFERRED (founder call): `csv_export` / `first_subscriber` left inert until Phase 2.6 / popup behavior decided.

**Gates:** lint 0/5 · suite 694/687/7 = baseline (dashboard-archive 4 + dashboard-subscriber-table 3) · clean build · +3 original modal tests (401 redirect, inline error, cooldown auto-close) +4 flicker-exemption tests +3 checkout/error tests · +9 `auth-redirect` helper tests · `next/navigation` mocked in modal tests.

## Phase 2 — Billing correctness

**Problem:** `past_due` no-op (free Pro on failed payment); no scheduled-cancel visibility; portal-return never refreshes UI; surplus waitlists + over-cap + Pro-config silently grandfathered; CSV ungated vs docs.

- [x] 2.1 `subscription.updated` handler: persist `scheduled_change` (action + `effective_at`); "Pro until X" in `SubscriptionCard`; downgrade only on effective `canceled`. (Matches Paddle semantics: portal cancel → `updated` now, `canceled` at period end.) **COPY RESOLVED 2026-09-29:** `Pro until {date} — your subscription will not renew.` **DONE 2026-09-29:** `subscription.updated` case persists status/scheduled/next_billed, downgrades only on status `canceled`; created/activated persist status + next_billed; SubscriptionCard cancel banner; `revenue-phase2-billing-columns.sql` (founder-run: scheduled_change, paddle_subscription_status, paddle_next_billed_at).
- [x] 2.2 `past_due`: keep Pro + "Update payment" portal banner. **COPY RESOLVED 2026-09-29:** banner `Payment failed. Update your payment to keep Pro active.` button `Update payment`. **DONE 2026-09-29:** `subscription.past_due` persists status only (tier kept pro); SubscriptionCard past-due banner + Update payment button wired to portal opener.
- [x] 2.3 Portal-return refresh: `?canceled=1` strip + `refreshTier()`; un-silence portal errors (inline + pending states); null-ID limbo branch. **DONE 2026-09-29:** billing client strips `?canceled=1` + refreshes tier, `openPortal(source)` with pending/error states surfaced inline (`role=alert`), portal route `.single()` → `.maybeSingle()`.
- [x] 2.4 Billing surfaces: real renewal/cancel dates (**COPY:** `Your Pro renews on {date}.`), real `waitlistCount`, wire invoice history (decided: wire, not remove — billing subtitle promises invoices; avoids copy change). **DONE 2026-09-29:** profile API returns scheduledChange/subscriptionStatus/nextBilledAt/waitlistCount (PGRST204 fallback preserved); SubscriptionCard renewal line; `GET /api/billing/invoices` (paid+completed, perPage 20, billedAt DESC, `{id, invoiceNumber, date, amount, currency}`) + `GET /api/billing/invoices/[transactionId]/pdf` (ownership-checked redirect); InvoiceHistory rewrite (fetch on mount, skeleton/empty/error/list with Download links).
- [x] 2.5 Surplus-waitlist policy (lock-read-only / auto-archive / bless) + over-cap banner + Pro-config-on-downgrade rules. **GATE RESOLVED 2026-09-29:** founder agreed to **lock surplus read-only**, with requirement: read-only waitlists must stop accepting signups — research competitor best practices for this flow first (what competitors/tools do for downgraded/over-limit lists), then implement. **RESEARCH DONE + POLICY RESOLVED 2026-09-29: auto-archive surplus, newest stays active** (research: waitlist tools 3/3 keep signups flowing — MakeEmWait/Wait.li/LaunchList; form tools deactivate surplus — Dubsado all-but-one, Typeform, HubSpot; founder's stop-signups must matches Dubsado camp → reuse existing `is_archived` → `/gone`, reversible via unarchive). **Over-cap banner copy:** `Free includes 1 waitlist — you have {n}. Upgrade to Pro to manage them all, or archive the ones you don't need.` **Pro-config rules:** (A) qual questions grandfather — save allowed iff `count ≤ freeCap OR count ≤ existingCount` (block additions only; today ANY save with >2 400s, blocking downgraded founders); (B) sender identity falls back to default on Free — `sending_domain`/`sender_name` only passed to `resolveFromAddress` when tier = pro (config stays in row, resumes on re-upgrade). **DONE 2026-09-29:** surplus auto-archive (`archiveSurplusWaitlists` in the Paddle webhook — newest ACTIVE kept, manual archives preserved, throws → 500 so Paddle retries; wired into `subscription.canceled` + `subscription.updated`-with-status-canceled); over-cap banner in the billing client (approved copy verbatim, text-only, real `waitlistCount`); (A) `checkQuestionCap(count, tier, existingCount)` + PATCH count query (pro path skips it, POST unchanged); (B) confirmation + moved-up + milestone sends condition both params on tier (updates/broadcast routes are requirePro-gated already; cap-warning email passes no sender params).
- [x] 2.6 CSV gate: `requirePro` on export route OR correct docs. **GATE RESOLVED 2026-09-29: keep Free export, fix docs** — no route change. **DONE 2026-09-29:** corrected PRD (3 spots), `dashboard-design-guide.md`, `sprint-3-plan.md` (AC1/AC2 7→6 triggers, AC2 Pro-gated list), `sprint-3-design-specs.md` (S9 7→6 triggers, modal mock + feature list + trigger table + impl mapping), amendment notes on epic-13 (AC9/AC3), story-13.1 (AC9/status/files), story-13.2 (AC3), story-12.1.3 (AC4/T3/verification), epic-12.1 (AC4/T3), story-9.3 + epic-9 (story line + out-of-scope). Code already matched: route ungated, leaderboard button always visible, `tier-gating.ts` marks `csv_export` free, `FREE_FEATURES` lists "CSV export, all columns".

**Verify:** sandbox portal cancel → scheduled state → period-end downgrade (Paddle test clock); downgrade walkthrough; webhook unit tests for `updated`/`past_due`. **TESTS DONE 2026-09-29 (+39):** `webhook-paddle.test.ts` (10: scheduled persist, schedule clear, canceled-downgrade + surplus archive newest-kept, manual-archive preservation, single-list skip, archive-failure 500, past_due keeps Pro, created upgrade, missing user_id, bad signature) · `question-cap.test.ts` (+3 grandfather keep/trim/add-block) · `milestones.test.ts` (+2 rule B pro/free) · `subscribers-referral.test.ts` (+2 moved-up rule B) · `subscribers.test.ts` (+2 confirmation rule B) · `billing-invoices.test.ts` (9: list 401/empty/map/fallbacks/502, pdf 401/404-no-sub/404-foreign-owner/redirect) · `profile-get.test.ts` (3: 401/fields/PGRST204 fallback) · `subscription-card.test.tsx` (4: cancel banner/past-due+button/renewal/free usage) · `invoice-history.test.tsx` (4: free upsell/list+download/empty/error). **GATES 2026-09-29:** lint 0 errors / 5 pre-existing warnings · full suite 733 = 726 pass / 7 fail = exact baseline (dashboard-archive 4 + dashboard-subscriber-table 3) · clean build (`.next` deleted first) · prettier clean on touched files · dev server restarted. Phase 2 uncommitted (ship discipline: commit only on founder instruction).

## Phase 3 — Email platform

**Problem:** quota rejections are silent email loss; no metering/quotas/alerts (REQ-7.1a.4 unimplemented); unbounded Pro bulk on one shared Resend account; batch blind spots; resubscribe dead end.

- [x] 3.1 Classify Resend 429s (`daily_quota_exceeded` / `monthly_quota_exceeded` / `rate_limit_exceeded`) → retry queue + `email_events failed` rows + founder warning. **GATE RESOLVED 2026-09-29 (founder picked recommended both):** retry policy = rate_limit → bounded inline retry with backoff (no new infra), daily_quota → parked until midnight UTC then retried (stale risk capped ~24h), monthly_quota → dead-letter `failed` row, no retry; founder warning = dashboard banner (reliable leg) + best-effort email (rides the same exhausted account, may itself 429). Batch per-item failed accounting stays 3.3 — 3.1 covers taxonomy + sendEmail retry + daily queue/cron + transactional failed rows + warning. **DONE 2026-09-29:** `classifyResendError` (SDK `ErrorResponse.name` verified in resend@6.23.0 types; bare 429 → transient); `sendEmail` preserves `errorKind`/`errorName` + inline rate_limit retry (same idempotency key; `retryDelaysMs` injectable for tests); `email_retry_queue` table + SQL `revenue-phase3-email-retry-queue.sql` (founder-run) + `enqueueEmailRetry`/`drainEmailRetryQueue`/`maybeWarnFounderQuota` in `src/lib/retry-queue.ts` + `/api/cron/email-retry` (CRON_SECRET; vercel.json 00:15 + 12:15 UTC); confirmation/moved-up failure branches park daily (`delivery_delayed` row) / dead-letter monthly+other (`failed` row) + once-daily founder warning; `sendBatchWithRetry` shared by broadcast + updates chunk loops; `/api/dashboard/email-health` + `QuotaWarningBanner` in shell main (additive fetch, tier-refresh tests unaffected); copy approved verbatim (see Copy gaps). **TESTS +27:** email-retry (7) · retry-queue (9) · cron (2) · email-health (4) · banner (3) · subscribers failure paths (2). **GATES:** lint 0/5 · suite 760 = 753 pass / 7 fail = exact baseline · clean build · prettier clean · server restarted. Uncommitted.
- [ ] 3.2 Platform meter + budgets: nightly per-founder aggregation; dashboard meter; 70/90% alerts; monthly bulk budget enforced pre-send; compose shows "this send = N emails".
- [ ] 3.3 Send-path fixes: updates idempotency key; per-item batch accounting; `cap_warning_sent_at` column; single milestone email per referral.
- [ ] 3.4 Deliverability: `List-Unsubscribe` headers on transactional (extend `sendEmail`); Reply-To; `www`-pinned one-click URL; send-time `sending_domain` re-verification.
- [ ] 3.5 Branding: remove/invert Pro logo header; tier fail-loud (not `|| "free"`); milestone tier branch. **GATE RESOLVED 2026-09-29: branding seen = logo header** → remove the logo header for Pro, keep for Free; no footer-string work.
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

**APPROVED 2026-09-29 (Phase 3.1d, verbatim):** quota banner: `Some emails couldn't be sent because the email quota was exceeded. Daily-quota emails retry automatically after midnight UTC.` · founder warning email subject: `Your waitlist emails hit the Resend quota` · body: `Some of your PreWaitlist emails failed to send ({kind} quota). Daily-quota emails retry automatically after midnight UTC. Monthly-quota failures need a Resend plan upgrade — reply to this email if you need help.` ({kind} = daily/monthly).

Pro CTA button · 1.5b headline · post-pay confirmation UX · "Pro until X" / dunning strings · portal error strings · over-cap + surplus-waitlist banners · broadcast partial-success (B7, open) · platform-tab mock (design).
