# Sprint 2 — Summary

**Status:** complete
**Date range:** 2026-08-13 → 2026-09-05
**Exit condition met:** ✅ A visitor can sign up via the public waitlist page, answer qualification questions, receive a thank-you page with referral link, and see their position on a public leaderboard. Founders can view subscribers, export CSV, and see real-time stats on a restructured dashboard.

---

## What Was Built

### Epic 7 — Public Waitlist Page (9 stories, all done)

| Story | What                                                                                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.0   | SQL migration (`subscribers` table, RLS, functions), POST `/api/subscribers`, GET `/api/leaderboard/[subdomain]`, GET `/api/subscribers/[id]`                                                 |
| 7.1   | `[subdomain]/page.tsx`, WaitlistPageContent, placeholder slots (updates, milestones, leaderboard CTA), PoweredByFooter                                                                        |
| 7.2   | Email Capture Form — email-only, honeypot, timestamp check, 2s minimum, 5/hour rate limit, position display, social proof counter                                                             |
| 7.3   | Inline Qualification Questions — dynamic free-text questions, optional toggle, live preview sync                                                                                              |
| 7.4   | Duplicate Email Handling — 409 status, "already on waitlist" message, position display for existing                                                                                           |
| 7.5   | Public Leaderboard Page — rank/email/referral columns, sticky footer CTA, anonymized emails, mobile responsive, 13 ACs met                                                                    |
| 7.6   | Email-First Updates + Milestone Hybrid + Warmth Foundation + Doc Alignment — 36 ACs, 17 tasks, 4 work streams (schema additions, milestone tracking, warmth foundation, founder updates feed) |
| 7.7   | Founder Updates Feed — LatestUpdateCard on public page, notify button in dashboard                                                                                                            |
| 7.8   | Epic 7 Tests — LeaderboardClient component tests                                                                                                                                              |

**Key architecture decisions (Epic 7):**

- `WaitlistTemplateContent` is the shared rendering component for both preview and public page
- `EmailCaptureForm` uses raw HTML elements (not design system Input/Button) for exact preview match
- `anonymizeEmail` extracted to `src/lib/format.ts`
- Social proof counter is inline in `WaitlistTemplateContent` (not a separate component)
- `page_views` table for warmth tracking foundation (no real-time scoring yet)
- `milestones_earned` and `milestones_notified` columns on subscribers table for fulfillment tracking

### Epic 8 — Thank-You & Referral Loop (6 stories, all done)

| Story | What                                                                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.0   | Thank-You Page Route — `[subdomain]/thank-you/page.tsx`, position display, referral link, share buttons, powered-by footer                               |
| 8.1   | Referral Link & Share Buttons — `ReferralLink` + `ShareButtons` client components, clipboard copy with execCommand fallback, Twitter/LinkedIn share URLs |
| 8.2   | Referral Tracking API — POST `/api/subscribers` accepts `referral_code`, resolves to UUID, validates (same-waitlist, no self-referral)                   |
| 8.3   | Referred Subscriber Variant — "Referred by" inline pill badge, referrer first name, ref param flow end-to-end                                            |
| 8.4   | Dashboard Subscriber Referral Column — batch query, sort by referrals, 6-column table, Referrals header with ↑/↓                                         |
| 8.5   | Epic 8 Tests — 31 tests across 8 test files + 2 e2e tests                                                                                                |

**Key architecture decisions (Epic 8):**

- `ReferralLink` and `ShareButtons` are separate client components (not combined)
- POST `/api/subscribers` accepts `referral_code` (8-char string) and resolves to `referrer_id` (UUID) server-side
- Self-referral is silently nullified (safety net, not hard rejection)
- `anonymizeEmail` in `src/lib/format.ts`: first char + `••••` + last char + `@domain`
- Dashboard referral counts: batch `.in("referrer_id", ids)` query, counts in memory via Map (2 queries total)
- Thank-you page dynamic referral link: uses `headers()` for protocol/host — http on localhost, https in production

### Epic 9 — Dashboard Restructure (8 stories, all done)

| Story | What                                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 9.0   | Dashboard Layout Shell — left sidebar (268px, 8 nav items), active state (green pill), locked items, mobile hamburger, upgrade CTA            |
| 9.1   | Stat Cards with Real Data — Total Signups, Referral %, Today, Warmth (locked), em-dash for empty                                              |
| 9.2   | Subscriber Table Design Alignment — 4-column table (#, Email, Date, Referrals), search, sort, row click, empty state                          |
| 9.3   | CSV Export (Pro Tier) — client-side generation, correct filename, 7 headers                                                                   |
| 9.4   | Subscriber Detail Page — auth check, back button, position/email/grid, referral code, referred list, qual answers, 404                        |
| 9.5   | Epic 9 Tests — 8 test files (sidebar, stat-cards, subscriber-table, csv-export, subscriber-detail, chart, qualification-panel, warmth)        |
| 9.6   | Dashboard Remediation — MVP Gap Fill — chart, qual breakdown, quality scores, top referrers, warmth distribution, table enhancements (32 ACs) |
| 9.7   | Epic 9 Final Tests — comprehensive test pass (231 tests total)                                                                                |

**Key architecture decisions (Epic 9):**

- Quality Score formula: `(subscribers this subscriber referred / total referrals across all subscribers) × 100`
- Warmth panel: neutral "coming in a future update" placeholder for ALL tiers (warmth engine is Sprint 3)
- Dashboard data flow: server component fetches subscribers + batch referral counts, passes to client component
- SignupChart uses Recharts with 30d/All Time toggle
- Design Guide created: `docs/design/dashboard-design-guide.md` — 16 sections, binding compliance
- Sidebar "Subscribers" link points to `/dashboard` (no separate subscribers list page per Sprint 2 scope)

---

## Screens Delivered (7 new, 1 updated)

| #   | Screen                        | Route                        | Status |
| --- | ----------------------------- | ---------------------------- | ------ |
| 1   | Public waitlist page          | `/:subdomain`                | ✅     |
| 2   | Thank you — direct signup     | `/:subdomain/thank-you`      | ✅     |
| 3   | Thank you — referred signup   | `/:subdomain/thank-you`      | ✅     |
| 4   | Public leaderboard            | `/:subdomain/leaderboard`    | ✅     |
| 5   | Dashboard — active state      | `/dashboard`                 | ✅     |
| 6   | Dashboard — subscriber detail | `/dashboard/subscribers/:id` | ✅     |
| 7   | Dashboard — loading skeleton  | `/dashboard` (loading)       | ✅     |

**Updated:** Dashboard empty state (replaced placeholder with real data panels)

---

## Database Schema Additions

### New Tables

| Table          | Purpose                                                                                                                              | RLS |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --- |
| `subscribers`  | Subscriber records (email, referral_code, referrer_id, position, qual_answers, warmth_score, milestones_earned, milestones_notified) | ✅  |
| `page_views`   | Warmth tracking foundation (subscriber_id, waitlist_id, path, created_at)                                                            | ✅  |
| `email_events` | Engagement tracking foundation (subscriber_id, event_type, created_at)                                                               | ✅  |

### Schema Alterations

| Table         | Column Added                | Type        | Purpose                                  |
| ------------- | --------------------------- | ----------- | ---------------------------------------- |
| `waitlists`   | `milestone_rewards_enabled` | boolean     | Toggle milestone display on public pages |
| `waitlists`   | `signup_counter_enabled`    | boolean     | Toggle social proof counter              |
| `waitlists`   | `view_count`                | integer     | Total page views                         |
| `waitlists`   | `unique_viewers`            | integer     | Unique visitors                          |
| `waitlists`   | `last_viewed_at`            | timestamptz | Last page view                           |
| `subscribers` | `warmth_score`              | text        | Hot/Warm/Cold/NULL                       |
| `subscribers` | `milestones_earned`         | jsonb       | `[{threshold, label, earned_at}]`        |
| `subscribers` | `milestones_notified`       | jsonb       | `[5, 10, 25]` thresholds notified        |

---

## API Routes (8 new)

| Method | Route                             | Purpose                                                                                |
| ------ | --------------------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/api/subscribers`                | Add subscriber (email validation, referral resolution, milestones, confirmation email) |
| GET    | `/api/subscribers/[id]`           | Subscriber detail (auth required, ownership check)                                     |
| GET    | `/api/subscribers/[id]/referrals` | Subscriber's referral list (auth required)                                             |
| GET    | `/api/leaderboard/[subdomain]`    | Public leaderboard data (anonymized emails)                                            |
| GET    | `/api/dashboard/chart`            | Signup time-series chart data (30d or all)                                             |
| GET    | `/api/dashboard/qualification`    | Qualification answer aggregation per question                                          |
| GET    | `/api/dashboard/warmth`           | Warmth score distribution (auth required)                                              |
| GET    | `/api/warmth/[subdomain]`         | Public warmth distribution for subdomain                                               |

---

## Component Inventory (14 new)

| Component               | File                                             | Purpose                                                         |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Sidebar                 | `components/dashboard/sidebar.tsx`               | 8 nav items, active state, locked items, mobile responsive      |
| SignupChart             | `components/dashboard/signup-chart.tsx`          | Recharts BarChart with 30d/All toggle, custom tooltip           |
| QualificationPanel      | `components/dashboard/qualification-panel.tsx`   | Qualification answer distribution per question                  |
| TopReferrers            | `components/dashboard/top-referrers.tsx`         | Top 5 referrers by quality score                                |
| WarmthPanel             | `components/dashboard/warmth-panel.tsx`          | Neutral placeholder for all tiers                               |
| ReferralLink            | `components/share/referral-link.tsx`             | Clipboard copy with execCommand fallback                        |
| ShareButtons            | `components/share/share-buttons.tsx`             | Twitter/LinkedIn/Copy with fallback                             |
| EmailCaptureForm        | `components/public/email-capture-form.tsx`       | Email capture with qualification questions                      |
| WaitlistTemplateContent | `components/share/waitlist-template-content.tsx` | Shared template rendering (logo, headline, counter, milestones) |
| LatestUpdateCard        | `components/public/updates-feed.tsx`             | Latest update card for public page                              |
| MetaPreview             | `components/onboarding/meta-preview.tsx`         | OG-card mock preview                                            |
| StickyCTA               | `components/onboarding/sticky-cta.tsx`           | Sticky mobile CTA bar                                           |
| Spinner                 | `components/ui/spinner.tsx`                      | Loading spinner                                                 |
| PasswordInput           | `components/ui/password-input.tsx`               | Show/hide + strength indicator                                  |

---

## Test Summary

| Category        | Files  | Tests   |
| --------------- | ------ | ------- |
| Component tests | 23     | 193     |
| API tests       | 6      | 25      |
| E2E tests       | 3      | 7       |
| **Total**       | **32** | **225** |

**Test infrastructure:** Vitest 4.1.10 + happy-dom 20.11.1 + @testing-library/react 16.3.2 + Playwright 1.62.0

---

## Architecture Decisions Made

1. **Shared template rendering** — `WaitlistTemplateContent` is reused for onboarding preview, public page, and thank-you page. Never a second implementation.
2. **Raw HTML for email capture** — `EmailCaptureForm` uses raw HTML elements (not design system Input/Button) for pixel-perfect preview match.
3. **Referral code resolution** — POST `/api/subscribers` accepts 8-char string code, resolves to UUID `referrer_id` server-side. Self-referral silently nullified.
4. **Batch referral counting** — Dashboard uses `.in("referrer_id", ids)` query + in-memory Map (2 queries, not N+1).
5. **Quality score transparency** — Formula exposed to founders: `(referrals by subscriber / total referrals) × 100`. Zero-referral = null.
6. **Warmth is Sprint 3** — All warmth panels show neutral placeholder. No code writes `warmth_score` to DB yet.
7. **Sidebar nav 8 items** — Overview, Subscribers, Qualification, Leaderboard, Warmth, Updates, Broadcast, Settings.
8. **Dashboard design guide** — `docs/design/dashboard-design-guide.md` is binding for all dashboard UI (467 lines, 16 sections).
9. **Thank-you dynamic milestones** — Queries `milestone_rewards` table when `milestone_rewards_enabled` is true, shows tier pills with progress text.
10. **Email-first updates** — Founder updates sent via Resend batch API; on-page shows only latest update card (not full feed).

---

## What's NOT Built (Sprint 3 scope)

| Feature                                                              | Priority  | Notes                                                            |
| -------------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| Warmth scoring engine (email opens + clicks + qual answers)          | 🔵 Core   | Schema + foundation built (Story 7.6). Runtime scoring Sprint 3. |
| Resend webhook endpoint (email.opened, email.clicked, email.bounced) | 🔵 Core   | Required for warmth scoring.                                     |
| Hot/Warm/Cold assignment per subscriber                              | 🔵 Core   | Calculated from webhook events + qual answers.                   |
| Warmth column + filter in subscriber list                            | 🔵 Core   | Dashboard UI for warmth data.                                    |
| Warmth distribution panel (real data)                                | 🔵 Core   | Currently a placeholder.                                         |
| Dashboard warning state (Cold % alert)                               | 🔵 Core   | Trigger when Cold % crosses threshold.                           |
| "You moved up X spots" trigger email                                 | 🔵 Core   | On referral conversion. Position recalculation + email.          |
| Position recalculation on referral                                   | 🔵 Core   | When referred subscriber signs up, referrer moves up.            |
| Confirmation email (position + referral link)                        | 🔵 Core   | Via Resend on subscriber signup.                                 |
| Paddle billing integration (Pro $15/mo)                              | 🔵 Core   | Subscription management, checkout overlay.                       |
| Upgrade modal (7 context-sensitive triggers)                         | 🔵 Core   | Feature gating across all tiers.                                 |
| Pro-tier subscriber limits enforcement                               | 🔵 Core   | 500 cap on Free tier.                                            |
| Broadcast email to full list (Pro)                                   | 🟢 Should | Resend Broadcast API. Compose + send.                            |
| Warmth-segmented broadcast (Pro)                                     | 🟢 Should | Send to Hot+Warm only, or Cold only.                             |
| Email customisation (sender name, body text)                         | 🟢 Should | Pro feature.                                                     |
| Sender domain authentication (SPF/DKIM walkthrough)                  | 🟢 Should | Pro. DNS record setup wizard.                                    |
| Billing management (view plan, cancel, upgrade)                      | 🔵 Core   | Via Paddle billing portal.                                       |

**Note:** Growth tier ($29/mo) is out of scope for MVP. Only Free and Pro tiers ship. Growth features (automated warmth alerts, team member access, priority support) are deferred to post-MVP.

---

## Cumulative Progress

| Sprint    | Epics  | Stories | Screens | Tables | API Routes | Tests   |
| --------- | ------ | ------- | ------- | ------ | ---------- | ------- |
| 1         | 7      | 48      | 14      | 5      | 7          | 166     |
| 2         | 3      | 23      | 7       | 3      | 8          | 225     |
| **Total** | **10** | **71**  | **21**  | **8**  | **15**     | **225** |

**Branch:** `dev` (all epic branches merged — epic-7, epic-8, epic-9)
