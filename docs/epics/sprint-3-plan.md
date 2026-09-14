# Sprint 3 — Plan

**Status:** ready
**Date range:** 2026-09-06 → 2026-09-20 (target)
**Duration:** 11 working days
**Goal:** Warmth tracking is live and visible. Founders can send warmth-segmented broadcasts. Paddle billing gates Pro features. Domain authentication is walkable. The product is feature-complete for MVP launch.

**Pre-requisite:** Epic 10 (Public Waitlist Page & Onboarding Redesign) must ship before Sprint 3 begins.

**[UPDATED — 2026-09-13]** Sprint 3 now includes two additional epics that ship before Epic 13 (Billing):

- **Epic 12.1 — Dashboard Overhaul:** Dashboard redesign, empty states, stat cards, tier gating, mobile, founder updates compose UI
- **Epic 12.2 — Gap Fixes:** Legal compliance (Privacy Policy, ToS, consent), archive waitlist, edit after onboarding, unsubscribe mechanism, bounce suppression
- **Epic 12.3 — Dashboard Section Pages:** Unlock sidebar nav, build Leaderboard/Qualification/Warmth pages

**Execution order:** Epic 11 → Epic 12 → Epic 12.1 → Epic 12.2 → Epic 12.3 → Epic 13

---

## Exit Condition

A founder on the free tier who hits the 500-signup cap sees the upgrade modal. A Pro founder can send a warmth-segmented broadcast. Position recalculation works end-to-end (referenced subscriber signs up → referrer moves up → "you moved up" email sent). Domain authentication setup is walkable in the UI. All emails (confirmation, moved-up, milestone, broadcast) deliver via Resend.

---

## What Gets Built

| Feature                                                              | Priority  | Epic |
| -------------------------------------------------------------------- | --------- | ---- |
| Warmth scoring engine (Resend webhooks + qual answers)               | 🔵 Core   | 11   |
| Hot/Warm/Cold assignment per subscriber                              | 🔵 Core   | 11   |
| Warmth column + filter in subscriber list                            | 🔵 Core   | 11   |
| Warmth distribution panel (real data)                                | 🔵 Core   | 11   |
| Dashboard warning state (Cold % alert)                               | 🔵 Core   | 11   |
| Confirmation email (position + referral link)                        | 🔵 Core   | 12   |
| Position recalculation on referral                                   | 🔵 Core   | 12   |
| "You moved up X spots" trigger email                                 | 🔵 Core   | 12   |
| Broadcast email to full list (Pro)                                   | 🟢 Should | 12   |
| Warmth-segmented broadcast (Pro)                                     | 🟢 Should | 12   |
| Email customisation (sender name, body text)                         | 🟢 Should | 12   |
| Paddle billing integration (Pro $15/mo)                              | 🔵 Core   | 13   |
| Upgrade modal (7 context-sensitive triggers)                         | 🔵 Core   | 13   |
| Pro-tier subscriber limits enforcement (500 cap)                     | 🔵 Core   | 13   |
| Billing management (view plan, cancel, upgrade)                      | 🔵 Core   | 13   |
| Sender domain authentication walkthrough (SPF/DKIM)                  | 🟢 Should | 13   |
| Email infrastructure separation (transactional vs marketing domains) | 🟢 Should | 12   |
| Sidebar redesign (grouped nav, tooltips, labels)                     | 🔵 Core   | 12.1 |
| Empty state redesign (welcome, guidance, ghost cards)                | 🔵 Core   | 12.1 |
| Stat card upgrades (deltas, warmth summary)                          | 🔵 Core   | 12.1 |
| Tier gating consistency (lock overlays, tooltips)                    | 🔵 Core   | 12.1 |
| Founder updates compose UI                                           | 🟢 Should | 12.1 |
| Mobile responsiveness fix                                            | 🔵 Core   | 12.1 |
| Settings & bug fixes                                                 | 🟢 Could  | 12.1 |
| Design token compliance                                              | 🟢 Could  | 12.1 |
| Broadcast & duplicate API fixes                                      | 🟢 Could  | 12.1 |
| Data & performance (caching, query optimization)                     | 🟢 Could  | 12.1 |
| Schema migration (consent, archive, bounce columns)                  | 🔵 Core   | 12.2 |
| Archive waitlist                                                     | 🟢 Should | 12.2 |
| Edit after onboarding                                                | 🟢 Should | 12.2 |
| Privacy policy page                                                  | 🔵 Core   | 12.2 |
| Terms of service page                                                | 🔵 Core   | 12.2 |
| Consent tracking (GDPR checkbox)                                     | 🔵 Core   | 12.2 |
| Unsubscribe mechanism (CAN-SPAM)                                     | 🔵 Core   | 12.2 |
| Bounce suppression                                                   | 🔵 Core   | 12.2 |
| Physical address in emails (CAN-SPAM)                                | 🔵 Core   | 12.2 |
| Unlock sidebar nav items (remove "Coming soon")                      | 🔵 Core   | 12.3 |
| Dashboard leaderboard page                                           | 🟢 Should | 12.3 |
| Dashboard qualification page                                         | 🟢 Should | 12.3 |
| Dashboard warmth page (Pro)                                          | 🟢 Should | 12.3 |

> **Scope note:** "Multiple waitlists (Pro)" is Sprint 4 scope per the product vision (line 415). It is NOT part of Sprint 3.

---

## Epic Index

| ID   | Title                        | Stories | Depends on             | Status |
| ---- | ---------------------------- | ------- | ---------------------- | ------ |
| 11   | Warmth Tracking Engine       | 8       | —                      | ready  |
| 12   | Email System                 | 7       | 11.0, 11.1             | ready  |
| 12.1 | Dashboard Overhaul           | 11      | 12.0                   | ready  |
| 12.2 | Gap Fixes (MVP Completeness) | 8       | —                      | ready  |
| 12.3 | Dashboard Section Pages      | 5       | 12.1                   | ready  |
| 13   | Billing & Feature Gating     | 7       | 12.0, 12.1, 12.2, 12.3 | ready  |

**Execution order:** Epic 11 → Epic 12 → Epic 12.1 → Epic 12.2 → Epic 13. Epic 12 depends on warmth webhooks (11.0, 11.1) for confirmation email and moved-up trigger. Epic 12.1 depends on email system (12.0) for tier gating consistency. Epic 12.2 has no dependencies on Epic 11/12 (legal/compliance items). Epic 13 depends on email system (12.0) for upgrade modal email delivery, dashboard overhaul (12.1) for settings wiring, and gap fixes (12.2) for consent tracking and unsubscribe mechanism.

---

## What's NOT Built (Sprint 4 scope)

| Feature                                                                  | Notes                                                    |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| Automated warmth alerts (email to founder when cold % crosses threshold) | Was Growth tier — deferred to post-MVP                   |
| Team member access                                                       | Was Growth tier — deferred to post-MVP                   |
| Priority support                                                         | Was Growth tier — deferred to post-MVP                   |
| Custom domain mapping                                                    | v1.1 — most technically complex feature                  |
| Email sequences (drip)                                                   | Post-MVP — broadcast first                               |
| Fraud detection                                                          | Post-MVP                                                 |
| Feature voting, comments                                                 | Post-MVP                                                 |
| Multiple waitlists (Pro)                                                 | Sprint 4 scope — lighter path for returning Pro founders |
| Warmth trend charts                                                      | Post-MVP                                                 |

---

# Epic 11 — Warmth Tracking Engine

**Status:** ready
**Source:** [PRD §2a](../PRD.md#2a-sprint-2--public-page-dashboard-active), [MVP Vision Module 3](../product-vision-mvp-waitlist-tool.md#module-3--warmth-tracking), [MVP Vision Module 4 §Email Open Tracking](../product-vision-mvp-waitlist-tool.md)

## Goal

Build the warmth scoring engine that calculates a 0–100 engagement score per subscriber using Resend webhook events (email clicks, bounces) and qualification answer data. Display Hot/Warm/Cold status in the dashboard subscriber list and warmth distribution panel. The warmth panel moves from placeholder to live data.

## Definition of Done

Every subscriber has a warmth score (0–100) that updates via daily batch recalculation. The dashboard subscriber list shows a warmth badge (Hot/Warm/Cold/Unscored) per row with a working filter. The warmth distribution panel shows real bar chart data. The dashboard warning state triggers when cold % exceeds a configurable threshold.

## Story Index

| ID   | Title                                     | Depends on | Status |
| ---- | ----------------------------------------- | ---------- | ------ |
| 11.0 | Resend Webhook Endpoint                   | —          | ready  |
| 11.1 | Warmth Score Calculation Engine           | 11.0       | ready  |
| 11.2 | Warmth Column + Filter in Subscriber List | 11.1       | done   |
| 11.3 | Warmth Distribution Panel (Real Data)     | 11.1       | ready  |
| 11.4 | Dashboard Warning State                   | 11.1       | ready  |
| 11.5 | Warmth Score Decay + Time-Based Rules     | 11.1       | ready  |
| 11.6 | Epic 11 Tests                             | 11.0–11.5  | ready  |
| 11.7 | Schema Migration — Sprint 3 Columns       | —          | ready  |

---

### Story 11.0 — Resend Webhook Endpoint

**Status:** ready
**Story:** As a developer, I want a webhook endpoint that receives Resend email events (opened, clicked, bounced, complained) so that the system can track subscriber engagement.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `POST /api/webhooks/resend` route handler that accepts Resend webhook payloads.
- AC2: The endpoint shall verify webhook signatures using Svix (Resend's signing mechanism) with the `RESEND_WEBHOOK_SECRET` environment variable.
- AC3: The endpoint shall store verified events in the `email_events` table with columns: `id`, `subscriber_id` (FK), `waitlist_id` (FK), `event_type` (text, check: in sent/delivered/opened/clicked/bounced/complained), `event_data` (jsonb, nullable), `created_at` (timestamptz).
- AC4: The endpoint shall resolve `email_id` from the webhook payload to a `subscriber_id` by looking up the subscriber's email address.
- AC5: The endpoint shall be idempotent — duplicate events (same Svix message ID) shall not create duplicate rows.
- AC6: The endpoint shall return HTTP 200 within 5 seconds. Heavy processing (score recalculation) shall be deferred, not blocking the response.
- AC7: The endpoint shall handle events out of order — use `created_at` timestamp from the event, not insertion order.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Create webhook route + Svix signature verification · T2 (AC3-AC4) Event storage + email-to-subscriber resolution · T3 (AC5-AC7) Idempotency + ordering + performance · T4 (AC8) Lint + build

**Dev Notes:**

- Resend webhook events: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`, `email.failed`
- Payload includes `email_id` (UUID), `from`, `to`, `subject`, event-specific data (e.g., `bounce.type`, `bounce.subType`)
- **Critical:** Use `req.text()` (NOT `req.json()`) for the raw body — Svix signature verification breaks if the body is re-serialized via `JSON.stringify()`
- Svix verification: `resend.webhooks.verify({ payload, headers: { 'svix-id', 'svix-timestamp', 'svix-signature' }, secret })`
- Use `waitUntil()` or background task for Postgres writes to keep response fast (Resend has a 15-second response timeout)
- `email_events` table already exists (Story 7.6) — but needs `event_data jsonb` column added via Story 11.7
- Events arrive out of order and at-least-once — dedupe on `svix-id`, use `created_at` from payload for sequencing
- Webhook auto-disables after ~5 days of continuous failures — monitor and alert
- Rate estimate: 10,000 emails/month → 30,000–50,000 events/month (~50–100 MB storage)

**Out of scope:** Score calculation (Story 11.1), bulk event backfill, webhook retry logic (Resend handles retries for 72h)

---

### Story 11.1 — Warmth Score Calculation Engine

**Status:** ready
**Story:** As a founder, I want each subscriber to have an engagement score (0–100) so that I can see who's Hot, Warm, or Cold.

**Acceptance Criteria (EARS):**

- AC1: The system shall calculate a warmth score (0–100) for each subscriber based on engagement signals.
- AC2: The score shall be calculated from the following signals with these point values: email click (+5), email reply (+10), referral signup (+15), qualification answers completed (+8), leaderboard page visit (+5).
- AC3: The score shall include time-based decay: no activity in 0–59 days = no penalty, no activity in 60–89 days = -25 points, no activity in 90+ days = score resets to 0.
- AC4: The score shall be clamped to 0–100 range (never below 0, never above 100).
- AC5: The system shall assign tiers based on score: Hot (70+), Warm (40–69), Cold (<40).
- AC6: New subscribers with no engagement signals shall have score = 0 and tier = "Unscored".
- AC7: The score shall be stored in the `subscribers.warmth_score` column (text, check: in hot/warm/cold, nullable).
- AC8: A daily cron job shall recalculate scores for all subscribers in all waitlists. This is a deliberate scope decision for MVP — real-time recalculation on every webhook event is v1.1.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC4) Score calculation function with signal weights + decay · T2 (AC5-AC7) Tier assignment + DB storage · T3 (AC8) Cron job / trigger for batch recalculation · T4 (AC9) Lint + build

**Dev Notes:**

- Create `src/lib/warmth.ts` with `calculateWarmthScore(subscriberId, supabase)` and `assignTier(score) => "hot" | "warm" | "cold" | null`
- Query `email_events` for the subscriber (count clicks, bounces), `subscribers` for referral count and `qual_answers` (JSONB — check if populated for qual coverage)
- **Apple MPP caveat:** Email opens are NOT included as a warmth signal. Apple Mail Privacy Protection preloads tracking pixels for ~40-50% of email clients, making open data unreliable. Clicks (+5) and referrals (+15) are the primary intent signals.
- **Decay starts at 60 days (not 30):** Waitlist subscribers may go quiet while waiting for launch. This is not disengagement — it's expected behavior. 30-day decay would penalize early adopters unfairly.
- Time decay: calculate days since last `email_events.created_at` for the subscriber; if >60 days, apply -25 penalty; if >90 days, reset to 0
- Score formula: `min(100, max(0, rawScore - decayPenalty))`
- The `warmth_score` column stores the tier string ("hot", "warm", "cold"), NOT the numeric score. The numeric score is transient — recalculated in batch.
- For MVP, the daily cron is sufficient. Real-time recalculation on every webhook event is v1.1.
- Existing `GET /api/dashboard/warmth` route already queries by `warmth_score` column — just needs data to exist.
- **Effective score range:** With the signal weights defined above, the theoretical max is ~53 points (referral + qual + click + leaderboard). Most active subscribers will score 15-40. The 0-100 scale provides headroom for future signals.

**Out of scope:** Real-time score updates on every event (daily batch is sufficient for MVP), warmth trend charts (v1.1), subscriber-facing score display

---

### Story 11.2 — Warmth Column + Filter in Subscriber List

**Status:** done
**Story:** As a founder, I want to see a warmth badge (Hot/Warm/Cold/Unscored) next to each subscriber and filter by warmth tier so that I can identify engaged vs. disengaged subscribers.

**Acceptance Criteria (EARS):**

- AC1: The subscriber table shall display a warmth badge column between Position and Referrals.
- AC2: Hot subscribers shall show a green badge (`bg-accent/10 text-accent`), Warm = amber (`bg-yellow-100 text-yellow-800`), Cold = blue (`bg-blue-100 text-blue-800`), Unscored = grey (`bg-muted text-muted-foreground`).
- AC3: The table header shall include a warmth filter dropdown: All, Hot, Warm, Cold, Unscored.
- AC4: Filtering by warmth tier shall instantly filter the displayed rows without a server call.
- AC5: The warmth badge shall use the design system's caption typography (12px, regular).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Add warmth badge column with tier-specific colors · T2 (AC3-AC4) Add filter dropdown + client-side filtering · T3 (AC5) Typography compliance · T4 (AC6) Lint + build

**Dev Notes:**

- **Status: Fully implemented.** Warmth column, badge (red/amber/blue/grey), filter dropdown, client-side filtering, and sorting all exist in `src/app/dashboard/client.tsx` (lines 84, 112, 129-133, 140-146, 483-493, 577-595). No work needed.

---

### Story 11.3 — Warmth Distribution Panel (Real Data)

**Status:** ready
**Story:** As a founder, I want the warmth distribution panel to show real data so that I can see the health of my list at a glance.

**Acceptance Criteria (EARS):**

- AC1: The warmth distribution panel shall display four horizontal bars: Hot, Warm, Cold, Unscored.
- AC2: Each bar shall show the count of subscribers in that tier and the percentage of total.
- AC3: The bars shall use the same color scheme as the warmth badges (green/amber/blue/grey).
- AC4: The panel shall fetch data from `GET /api/dashboard/warmth` which returns `{ hot: number, warm: number, cold: number, unscored: number }`.
- AC5: When the waitlist has zero subscribers, the panel shall show em-dashes (not zeros).
- AC6: The panel shall no longer be blurred or locked for any tier — warmth viewing is available to all founders.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Update WarmthPanel to render real bars with correct colors · T2 (AC4) Verify API returns correct data shape · T3 (AC5-AC6) Remove blur/lock, handle empty state · T4 (AC7) Lint + build

**Dev Notes:**

- `components/dashboard/warmth-panel.tsx` currently shows a neutral placeholder — rewrite to fetch and display real data
- **Data source swap needed:** The panel currently fetches from `/api/warmth/${subdomain}` (public, unauthenticated). Rewrite to fetch from `GET /api/dashboard/warmth` (authenticated, returns `{ hot, warm, cold, unscored, total }`). Remove the `subdomain` prop.
- Remove the `tier` prop dependency — warmth is visible to all tiers
- Bar width: `Math.round((count / total) * 100)`% of container
- Design guide: horizontal bars, 8px height, rounded-full
- Bar colors: Hot = `bg-accent` (green), Warm = `bg-yellow-500` (amber), Cold = `bg-blue-500` (blue), Unscored = `bg-gray-400`

---

### Story 11.4 — Dashboard Warning State

**Status:** ready
**Story:** As a founder, I want to be alerted when my list health is declining (high cold %) so that I can take action before launch.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display a warning banner when the cold subscriber percentage exceeds a configurable threshold (default: 40%).
- AC2: The warning banner shall use the design system's warning styling: `bg-yellow-50 border border-yellow-200 text-yellow-800`.
- AC3: The banner shall show: "⚠️ {X}% of your list has gone cold. Consider sending a re-engagement email."
- AC4: The warning shall only appear when there are ≥10 subscribers (avoid warning on tiny lists).
- AC5: The threshold shall be configurable in Settings (default 40%, range 20–80%).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Create warning banner component with cold % calculation · T2 (AC4) Minimum subscriber threshold · T3 (AC5) Threshold configuration in Settings · T4 (AC6) Lint + build

**Dev Notes:**

- Calculate cold %: `(coldCount / totalCount) * 100` from warmth distribution data
- Banner placement: top of main content area, below the stat cards row
- Settings storage: add `cold_threshold` column to `waitlists` table (integer, default 40)
- This is the visual warning only — automated email alert was a Growth feature, now deferred

---

### Story 11.5 — Warmth Score Decay + Time-Based Rules

**Status:** ready
**Story:** As a system, I want warmth scores to decay over time so that stale subscribers are correctly identified as Cold.

**Acceptance Criteria (EARS):**

- AC1: The score calculation shall apply time decay based on days since last engagement event (email click, email reply, referral).
- AC2: Decay rules: 0–59 days = no penalty, 60–89 days = -25 points, 90+ days = score resets to 0.
- AC3: "Last engagement" shall be determined by the most recent `email_events.created_at` for the subscriber.
- AC4: Subscribers with zero events shall have score = 0 regardless of signup date.
- AC5: The decay shall be applied during the daily batch recalculation (Story 11.1), not on every read.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Implement decay logic in warmth calculation · T2 (AC4) Handle zero-event subscribers · T3 (AC5) Integrate with daily batch job · T4 (AC6) Lint + build

**Dev Notes:**

- Decay is applied in `calculateWarmthScore()` — after summing all signal points, subtract decay penalty
- Last engagement: use `MAX(created_at)` from `email_events` where `subscriber_id = $1`
- **`page_views` table is NOT populated.** No code inserts into this table. Decay relies solely on `email_events.created_at` for last engagement signal. Page-visit-based warmth scoring is deferred to v1.1 when the tracking middleware is built.
- For MVP, daily batch is sufficient. Real-time decay (every read) is v1.1.

---

### Story 11.6 — Epic 11 Tests

**Status:** ready
**Story:** As a developer, I want comprehensive tests for the warmth tracking engine so that I can verify correctness and prevent regressions.

**Acceptance Criteria (EARS):**

- AC1: The system shall have API route tests for `POST /api/webhooks/resend` covering: valid event storage, signature verification failure (401), idempotent handling (duplicate event), event type validation.
- AC2: The system shall have unit tests for `calculateWarmthScore()` covering: score with multiple signals, score clamping (0–100), tier assignment (Hot/Warm/Cold/Unscored), time decay application, zero-event subscriber.
- AC3: The system shall have component tests for the warmth badge rendering (Hot/Warm/Cold/Unscored variants).
- AC4: The system shall have component tests for the warmth filter dropdown (filter by each tier, filter reset).
- AC5: The system shall have component tests for the warmth distribution panel (real data, empty state).
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count for Sprint 3 shall be ≥250 (current: 231).

**Tasks:** T1 (AC1) Webhook route tests · T2 (AC2) Warmth calculation unit tests · T3 (AC3-AC4) Warmth badge + filter component tests · T4 (AC5) Warmth panel component tests · T5 (AC6-AC7) Lint + build + count verification

---

### Story 11.7 — Schema Migration — Sprint 3 Columns

**Status:** ready
**Story:** As a developer, I want all Sprint 3 database schema additions in a single migration so that subsequent stories can depend on the correct columns existing.

**Acceptance Criteria (EARS):**

- AC1: The system shall apply a SQL migration that adds all Sprint 3 columns and tables.
- AC2: The migration shall add `event_data jsonb DEFAULT NULL` to the `email_events` table.
- AC3: The migration shall add `sender_name text DEFAULT NULL` to the `waitlists` table.
- AC4: The migration shall add `cold_threshold integer DEFAULT 40` to the `waitlists` table.
- AC5: The migration shall add `sending_domain text DEFAULT NULL` to the `waitlists` table.
- AC6: The migration shall add `paddle_subscription_id text DEFAULT NULL` to the `founder_profiles` table.
- AC7: The migration shall create the `broadcasts` table: `{ id uuid PK, waitlist_id uuid FK, subject text NOT NULL, sent_at timestamptz, recipient_count integer, created_at timestamptz DEFAULT now() }`.
- AC8: The migration shall add `subscriber_count integer DEFAULT 0` to the `waitlists` table (cached counter for 500-cap check).
- AC9: The migration shall DROP and recreate the `email_events.event_type` CHECK constraint to add `complained`, `failed`, and `delivery_delayed` to the allowed values. New constraint: `CHECK (event_type IN ('sent','delivered','opened','clicked','bounced','complained','failed','delivery_delayed'))`.
- AC10: All columns shall be nullable or have defaults — no NOT NULL without defaults (avoids breaking existing rows).
- AC11: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC10) Write and apply SQL migration · T2 (AC11) Lint + build

**Dev Notes:**

- Write the migration as `docs/stories/epic10-story7-sprint3-schema.sql`
- Run against Supabase SQL editor or via `supabase db push`
- All columns use nullable or DEFAULT — safe to apply on tables with existing data
- The `broadcasts` table stores broadcast history for the dashboard activity feed
- `subscriber_count` is an optimization: atomic increment on insert, decrement on delete, avoids `COUNT(*)` on every signup for the 500-cap check (Story 12.4)
- **CHECK constraint update (AC9):** The current `email_events.event_type` constraint only allows `sent/delivered/opened/clicked/bounced`. Story 11.0 needs `complained` and `failed` from Resend webhooks. Must `DROP CONSTRAINT` then `ADD CONSTRAINT` — Postgres does not support `ALTER CONSTRAINT`.
- **Untracked columns:** `email_subject`, `email_sender_name`, `email_body` are referenced in code (`src/app/api/waitlist/route.ts` GET handler, `src/app/onboarding/context.tsx` FIELD_MAP) but have no migration file in `docs/stories/sql-writeups/`. Verify they exist in the live DB before running this migration — if not, add them here.

---

# Epic 12 — Email System

**Status:** ready
**Source:** [MVP Vision Module 4](../product-vision-mvp-waitlist-tool.md#module-4--email-system), [PRD §2a](../PRD.md#2a-sprint-2--public-page-dashboard-active)

## Goal

Wire up the complete email system: confirmation emails on signup, "you moved up" trigger emails on referral conversion, position recalculation, broadcast email to full list (Pro), warmth-segmented broadcast (Pro), and email customisation (sender name). All emails sent via Resend.

## Definition of Done

Every new subscriber receives a confirmation email with their position and referral link. When a referred subscriber signs up, the referrer's position moves up and they receive a "you moved up" email. Pro founders can compose and send broadcast emails to their full list or a warmth-segmented segment. Founders can customise their sender name. Transactional and marketing emails use separate sending domains.

## Story Index

| ID   | Title                              | Depends on | Status |
| ---- | ---------------------------------- | ---------- | ------ |
| 12.0 | Confirmation Email                 | 11.7       | ready  |
| 12.1 | Position Recalculation on Referral | —          | ready  |
| 12.2 | "You Moved Up" Trigger Email       | 12.0, 12.1 | ready  |
| 12.3 | Broadcast Email (Pro)              | 11.1, 11.7 | ready  |
| 12.4 | Warmth-Segmented Broadcast (Pro)   | 11.1, 12.3 | ready  |
| 12.5 | Email Customisation (Pro)          | 12.0       | ready  |
| 12.6 | Email Infrastructure Separation    | 11.7       | ready  |

---

### Story 12.0 — Confirmation Email

**Status:** ready
**Story:** As a subscriber, I want to receive a confirmation email immediately after signing up so that I have my position number and referral link.

**Acceptance Criteria (EARS):**

- AC1: The system shall send a confirmation email via Resend immediately after a subscriber is created via `POST /api/subscribers`.
- AC2: The email shall include: position number ("You're #{position} in line"), referral link, share prompt.
- AC3: The email shall be branded with the founder's product name (`product_name` from the waitlist, falling back to `headline` if null), not "PreWaitlist".
- AC4: The email shall be sent from the founder's configured sender name (or default "PreWaitlist <notifications@prewaitlist.com>" if not customised).
- AC5: The email shall be sent via Resend's Emails API (transactional, single send — not Batch or Broadcast).
- AC6: If the email send fails, the subscriber shall still be created (email failure must not block signup).
- AC7: The system shall provide an email sending utility (`src/lib/email.ts`) that resolves the correct `from` address based on sender name and stream (transactional vs broadcast).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Build confirmation email template + Resend send · T2 (AC4, AC7) Create email utility with from-address resolution + sender name fallback · T3 (AC5-AC6) Emails API integration + error handling · T4 (AC8) Lint + build

**Dev Notes:**

- The `POST /api/subscribers` route already exists and creates the subscriber — add email send after insert
- **Email utility (AC7):** `src/lib/resend.ts` is currently a bare 9-line wrapper (`new Resend(apiKey)`). Must create `src/lib/email.ts` with: `sendEmail({ to, subject, html, stream, senderName, waitlistId })`. The `stream` parameter ("transactional" | "broadcast") determines the `from` address: transactional → `notifications@prewaitlist.com`, broadcast → `updates@prewaitlist.com`. Sender name resolution: `senderName` → `product_name` (from DB) → `headline` (from DB) → "PreWaitlist" (hardcoded fallback).
- Use `resend.emails.send({ from, to, subject, html })` — single transactional send, not Batch API (Batch is for bulk sends of 100+)
- Email template: position + referral link + share CTA. Keep it short (3-5 lines).
- `from` address: `{senderName} <notifications@prewaitlist.com>` — transactional stream, separate from marketing
- Referral link: `https://{subdomain}.prewaitlist.com?ref={referral_code}`
- Error handling: `try/catch` around Resend send, log error, don't throw — subscriber creation succeeds regardless
- Confirmation emails are the highest-open-rate email you'll ever send (60-80%). Include: confirm they're on the list, show position, include referral link, set expectations ("you'll hear from us when we launch").

---

### Story 12.1 — Position Recalculation on Referral

**Status:** ready
**Story:** As a subscriber, I want my position to move up when someone I referred signs up so that the referral system feels fair and rewarding.

**Acceptance Criteria (EARS):**

- AC1: When a new subscriber signs up with a valid `referral_code`, the referrer's position shall be recalculated.
- AC2: Position recalculation shall sort all subscribers in the waitlist by `referral_count DESC, created_at ASC` and reassign position numbers (1, 2, 3...).
- AC3: The referrer's new position shall be lower (closer to 1) than their previous position.
- AC4: Non-referred subscribers shall maintain their relative order based on signup time.
- AC5: Position recalculation shall happen synchronously during subscriber creation (not deferred).
- AC6: The number of spots moved up shall be calculated: `old_position - new_position`.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Implement position recalculation function · T2 (AC3-AC4) Verify referrer moves up, others maintain order · T3 (AC5-AC6) Sync execution + spots-moved calculation · T4 (AC7) Lint + build

**Dev Notes:**

- Create `src/lib/positions.ts` with `recalculatePositions(waitlistId, supabase)` and `getSpotsMoved(subscriberId, oldPosition, supabase)`
- **Critical: Current position logic is append-only.** `POST /api/subscribers` (line 67-75) calculates `position = maxPos + 1` — it never recalculates existing subscribers' positions. Story 12.1 must REPLACE this logic with full recalculation. The `maxPos + 1` code becomes dead code after this story.
- SQL approach: `UPDATE subscribers SET position = subquery.new_pos FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC) as new_pos FROM subscribers WHERE waitlist_id = $1) subquery WHERE subscribers.id = subquery.id`
- Or: fetch all subscribers, sort in JS, batch update positions
- Store `old_position` before recalculation to calculate spots moved for the trigger email
- This is the critical missing piece — the product vision says "position recalculation on referral" is a 🔵 Core feature

---

### Story 12.2 — "You Moved Up" Trigger Email

**Status:** ready
**Story:** As a referrer, I want to receive a "you moved up" email when someone I referred signs up so that I'm motivated to share more.

**Acceptance Criteria (EARS):**

- AC1: When a referrer's position improves due to a referral conversion, the system shall send a "You moved up {X} spots" email.
- AC2: The email shall include: new position number, spots moved, referral link (for continued sharing).
- AC3: The email shall be sent via Resend's Emails API (transactional, single send).
- AC4: The email shall only be sent when the referrer moves up by ≥1 spot (no email if position unchanged).
- AC5: The email shall be sent from the founder's configured sender name or default.
- AC6: If the email send fails, the position recalculation shall not be rolled back.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build "moved up" email template + trigger logic · T2 (AC3) Resend Emails API integration · T3 (AC4-AC6) Minimum spots threshold + error handling · T4 (AC7) Lint + build

**Dev Notes:**

- Trigger: after `recalculatePositions()` in Story 12.1, check if referrer's position improved
- `spots_moved = old_position - new_position` — only send email if > 0
- Email template: "🎉 You moved up {spots_moved} spots! You're now #{new_position} in line. Keep sharing → {referral_link}"
- Chain into `POST /api/subscribers` after position recalculation
- Use `resend.emails.send()` — single transactional send
- Error handling: try/catch, log, don't block subscriber creation

---

### Story 12.3 — Broadcast Email (Pro)

**Status:** ready
**Story:** As a Pro founder, I want to compose and send a broadcast email to all my subscribers so that I can communicate updates and launch announcements.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display a "Broadcast" nav item that is active (clickable) for Pro founders and locked for Free founders.
- AC2: Clicking Broadcast shall open a compose screen with: subject line input, HTML body textarea, preview button, send button.
- AC3: The compose screen shall show the subscriber count ("Send to {N} subscribers").
- AC4: Clicking "Send" shall send the email via Resend's Broadcast API to all subscribers of the waitlist.
- AC5: The broadcast shall include an unsubscribe mechanism (`{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag) for CAN-SPAM compliance.
- AC6: The broadcast shall include a physical mailing address in the footer (CAN-SPAM requirement).
- AC7: After sending, the system shall show a confirmation: "Email sent to {N} subscribers."
- AC8: Free founders shall see an upgrade prompt when clicking Broadcast ("Upgrade to Pro to send broadcasts").
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Activate Broadcast nav item + compose screen · T2 (AC3) Subscriber count display · T3 (AC4-AC6) Resend Broadcast API + unsubscribe + footer · T4 (AC7) Send confirmation · T5 (AC8) Free tier upgrade prompt · T6 (AC9) Lint + build

**Dev Notes:**

- Create `src/app/dashboard/broadcast/page.tsx` (client component)
- Resend Broadcast API: `resend.broadcasts.create({ segmentId, from, subject, html, send: true })`
- For "send to all": create a segment with no filters, or use the Batch API with all subscriber emails
- **CAN-SPAM compliance:** physical address in footer, unsubscribe link, accurate from/to headers
- **List-Unsubscribe header:** Verify Resend auto-adds RFC 8058 one-click unsubscribe header for Broadcast API sends. If not, add manually via Resend SDK options. Required for Gmail/Yahoo deliverability (5,000+ daily sends).
- **Marketing stream:** Broadcast emails use `updates@prewaitlist.com` (separate from transactional `notifications@prewaitlist.com`). See Story 12.6.
- The "Broadcast" nav item already exists in the sidebar (Story 9.0) — just needs to be activated for Pro
- Compose screen: simple textarea with subject + body, no rich text editor for MVP
- Store broadcast history in the `broadcasts` table (created in Story 11.7): `{ id, waitlist_id, subject, sent_at, recipient_count }`

---

### Story 12.4 — Warmth-Segmented Broadcast (Pro)

**Status:** ready
**Story:** As a Pro founder, I want to send a broadcast to a specific warmth segment (Hot+Warm or Cold) so that I can target re-engagement emails to cold subscribers.

**Acceptance Criteria (EARS):**

- AC1: The broadcast compose screen shall include a segment selector: "All subscribers", "Hot + Warm only", "Cold only".
- AC2: The segment selector shall show the count for each segment ("All (234)", "Hot + Warm (180)", "Cold (54)").
- AC3: Selecting a segment shall filter the recipient list before sending.
- AC4: The send confirmation shall show the segment name and count ("Sent to 54 cold subscribers").
- AC5: The segment filter shall use the `warmth_score` column on subscribers.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Add segment selector with counts · T2 (AC3-AC4) Filter recipients by warmth tier · T3 (AC5) Verify warmth_score query · T4 (AC6) Lint + build

**Dev Notes:**

- Extend the compose screen from Story 12.3
- Segment queries: `WHERE warmth_score IN ('hot', 'warm')` for Hot+Warm, `WHERE warmth_score = 'cold'` for Cold
- Counts: run count queries before rendering the selector
- For Resend Broadcast API: create a segment with warmth filter, or filter subscriber emails before sending via Batch API
- The "Cold only" segment is the primary use case — re-engagement emails before launch

---

### Story 12.5 — Email Customisation (Pro)

**Status:** ready
**Story:** As a Pro founder, I want to customise the sender name and email body text so that my emails feel personal and on-brand.

**Acceptance Criteria (EARS):**

- AC1: The dashboard Settings page shall include an "Email" section with editable fields: sender name, subject prefix.
- AC2: The sender name shall default to the waitlist `product_name` (falling back to `headline` if null).
- AC3: The customised sender name shall be used in all transactional emails (confirmation, moved-up, milestone).
- AC4: The customised sender name shall be used in broadcast emails.
- AC5: Changes shall be saved to the `waitlists` table (`sender_name` column, nullable).
- AC6: When `sender_name` is null, the system shall fall back to `product_name`, then to `headline`.
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings UI with sender name field · T2 (AC3-AC4) Wire sender name into email sending logic · T3 (AC5-AC6) DB storage + fallback · T4 (AC7) Lint + build

**Dev Notes:**

- Add `sender_name` column to `waitlists` table (text, nullable) — already created in Story 11.7
- Settings page: `src/app/dashboard/settings/page.tsx` (may need to create)
- Wire into `src/lib/email.ts` (created in Story 12.0) — pass `senderName` parameter
- Fallback chain: `senderName` (from DB) → `product_name` (from DB) → `headline` (from DB) → "PreWaitlist" (hardcoded)
- Format: `{senderName} <notifications@prewaitlist.com>` for transactional, `{senderName} <updates@prewaitlist.com>` for broadcast
- For MVP, only sender name is customisable. Subject prefix and body templates are v1.1.

---

### Story 12.6 — Email Infrastructure Separation

**Status:** ready
**Story:** As a system, I want transactional emails and marketing broadcasts to use separate sending domains so that a spam complaint on a broadcast does not affect deliverability of critical transactional emails (signup confirmations, position updates).

**Acceptance Criteria (EARS):**

- AC1: Transactional emails (confirmation, moved-up, milestone) shall be sent from `notifications@prewaitlist.com`.
- AC2: Marketing emails (broadcasts) shall be sent from `updates@prewaitlist.com`.
- AC3: The `from` address resolution shall check: (1) founder's custom sender name + verified domain, (2) fallback to default prewaitlist.com addresses.
- AC4: When a founder verifies their own domain (Story 12.5), transactional emails shall use `{sender_name}@{verified_domain}` and broadcasts shall use `{sender_name}@{verified_domain}`.
- AC5: The email sending utility (`src/lib/email.ts`, created in Story 12.0) shall accept a `stream` parameter ("transactional" | "broadcast") to resolve the correct `from` address.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Define default from addresses per stream · T2 (AC3-AC4) Build from-address resolver with verified domain fallback · T3 (AC5) Add stream parameter to email utility (extends Story 12.0 utility) · T4 (AC6) Lint + build

**Dev Notes:**

- **Depends on Story 12.0:** The email utility (`src/lib/email.ts`) must already exist with basic `sendEmail()` and `stream` parameter. Story 12.6 extends it with verified domain fallback logic.
- **Why separate domains:** If a broadcast triggers spam complaints, Gmail/Yahoo may flag the sending domain. Transactional emails (which users depend on for login, confirmations) must not be affected.
- `notifications@prewaitlist.com` — transactional stream (signup confirm, moved-up, milestone, position update)
- `updates@prewaitlist.com` — marketing stream (broadcasts, launch announcements)
- The `sender_name` column (Story 11.7) controls the friendly name; the `sending_domain` column (Story 11.7) controls the domain
- When `sending_domain` is set (verified custom domain), use it for both streams. When null, use the prewaitlist.com defaults.
- This is a deliverability best practice recommended by Resend, Mailgun, Postmark, and every major ESP.

---

# Epic 13 — Billing & Feature Gating

**Status:** ready
**Source:** [MVP Vision Module 6](../product-vision-mvp-waitlist-tool.md#module-6--account-tiers--billing), [PRD §2a](../PRD.md#2a-sprint-2--public-page-dashboard-active)

## Goal

Integrate Paddle billing for Pro subscriptions ($15/mo), enforce tier-based feature gating (500 signup cap on Free, qual question limits, broadcast access), build the upgrade modal with 7 context-sensitive triggers, and create the domain authentication walkthrough UI.

## Definition of Done

A free founder who hits the 500-signup cap sees an upgrade modal. Pro founders have full access to broadcast, warmth-segmented sends, email customisation, and 5 qual questions. The Paddle checkout overlay works for upgrading. Billing management (view plan, cancel) is accessible via Paddle's portal. Domain authentication setup is walkable in Settings.

## Story Index

| ID   | Title                                    | Depends on | Status |
| ---- | ---------------------------------------- | ---------- | ------ |
| 13.0 | Paddle Integration Foundation            | —          | ready  |
| 13.1 | Upgrade Modal (7 Triggers)               | 13.0       | ready  |
| 13.2 | Feature Gating Enforcement               | 13.0       | ready  |
| 13.3 | Billing Management (Paddle Portal)       | 13.0       | ready  |
| 13.4 | Pro-Tier Subscriber Limits (500 Cap)     | 13.2       | ready  |
| 13.5 | Sender Domain Authentication Walkthrough | —          | ready  |
| 13.6 | Epic 13 Tests                            | 13.0–13.5  | ready  |

---

### Story 13.0 — Paddle Integration Foundation

**Status:** ready
**Story:** As a founder, I want to upgrade to Pro via Paddle checkout so that I can access premium features.

**Acceptance Criteria (EARS):**

- AC1: The system shall install `@paddle/paddle-js` (client) and `@paddle/paddle-node-sdk` (server).
- AC2: A `PaddleProvider` shall be initialized in the root layout using `Paddle.Initialize({ token })` with the client token from `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`. The Paddle.js script shall be loaded via `next/script` with `strategy="afterInteractive"`.
- AC3: The Pro price shall be configured in Paddle dashboard as $15/month recurring.
- AC4: The system shall provide a `POST /api/billing/checkout` route that opens Paddle overlay checkout with `customData: { user_id, waitlist_id }`.
- AC5: The checkout overlay shall open when the founder clicks "Upgrade to Pro" via `Paddle.Checkout.open()`.
- AC6: On checkout completion (event `checkout.completed`), the system shall poll for the `subscription.created` webhook confirmation before showing success.
- AC7: The system shall provide a `POST /api/webhooks/paddle` route handler that handles: `subscription.created`, `subscription.activated`, `subscription.canceled`, `subscription.past_due`, `transaction.completed`.
- AC8: The webhook handler shall update `founder_profiles.tier` to "pro" on successful subscription.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Install Paddle SDK + create PaddleProvider · T2 (AC3-AC4) Price config + checkout session API · T3 (AC5-AC6) Checkout overlay + completion polling · T4 (AC7-AC8) Webhook handler + tier update · T5 (AC9) Lint + build

**Dev Notes:**

- **Packages:** `@paddle/paddle-js` (client, wraps CDN script) + `@paddle/paddle-node-sdk` (server, API + webhook verification)
- **Paddle.js loading:** Use `next/script` with `src="https://cdn.paddle.com/paddle/v2/paddle.js"` and `strategy="afterInteractive"`. NOT the npm package for client-side — the CDN script IS the client.
- **Initialization:** `Paddle.Initialize({ token, eventCallback })` — NOT `Paddle.Setup()` (that's Paddle Classic)
- **Environment variables:** `PADDLE_API_KEY` (server), `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (client), `PADDLE_WEBHOOK_SECRET_KEY` (webhook verification), `NEXT_PUBLIC_PADDLE_ENV` (sandbox/production)
- **Custom data:** Use `customData` (Paddle.js) / `custom_data` (API) — NOT `passthrough` (Paddle Classic, silently ignored in Billing)
- **Webhook raw body:** Use `request.text()` (not `request.json()`) for signature verification
- **Paddle Billing events use `subscription.canceled`** (one L), NOT `subscription.cancelled` (two L's) — Paddle Billing uses American English
- **Customer portal:** Use `paddle.customerPortals.createSession(customerId)` — Paddle hosts the UI. Do NOT iframe it — link directly.
- **Provisioning in webhooks, not redirects:** The user's browser goes to a success page, but the durable, retried, signed event is the webhook. Never provision access based on the redirect alone.
- **Money is strings in minor units:** `"1500"` = $15.00
- **Sandbox testing:** Use test card `4242 4242 4242 4242`

---

### Story 13.1 — Upgrade Modal (7 Triggers)

**Status:** ready
**Story:** As a free founder, I want to see a context-sensitive upgrade modal when I hit a feature limit so that I understand what I'm missing and how to get it.

**Acceptance Criteria (EARS):**

- AC1: The system shall display an upgrade modal with 7 context-sensitive trigger variants.
- AC2: Trigger variants: (1) signup cap hit (500), (2) qual question cap hit (2), (3) warmth panel clicked, (4) broadcast attempted, (5) CSV export attempted, (6) domain auth attempted, (7) settings email customisation attempted.
- AC3: Each trigger shall show a contextual headline (e.g., "Upgrade to send broadcasts" for trigger 4).
- AC4: The modal shall show: Pro features list, $15/mo price, "Upgrade to Pro" CTA, "Maybe later" dismiss.
- AC5: The modal shall use the design system: `bg-card`, `border-border`, `rounded-(--card-radius)`, centered overlay with backdrop blur.
- AC6: The modal shall not show again for the same trigger within 7 days (cooldown).
- AC7: The modal shall be closable via X button, "Maybe later", or clicking the backdrop.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Build modal component with 7 trigger variants · T2 (AC4-AC5) Modal design + feature list · T3 (AC6) Cooldown logic (localStorage) · T4 (AC7) Dismiss behavior · T5 (AC8) Lint + build

**Dev Notes:**

- Create `components/dashboard/upgrade-modal.tsx` (client component)
- Trigger detection: check tier in each gated feature's click handler, show modal if tier === "free"
- Cooldown: `localStorage.setItem('upgrade-modal-dismissed-{trigger}', Date.now())`, check on mount
- 7-day cooldown: `if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return`
- Modal content varies by trigger but shares the same CTA and feature list
- Design: centered on screen, max-w-md, backdrop backdrop-blur-sm bg-black/50

---

### Story 13.2 — Feature Gating Enforcement

**Status:** ready
**Story:** As a system, I want to enforce tier-based feature access so that Free founders cannot access Pro features.

**Acceptance Criteria (EARS):**

- AC1: The system shall check `founder_profiles.tier` before rendering Pro-gated features.
- AC2: Pro-gated features: broadcast email, warmth-segmented broadcast, email customisation, CSV export (already gated), domain authentication.
- AC3: When a Free founder attempts a Pro feature, the system shall show the upgrade modal (Story 12.1) instead of the feature.
- AC4: The tier check shall be performed server-side in API routes and client-side in UI components.
- AC5: The tier shall be fetched from `founder_profiles.tier` and passed through the dashboard layout.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Define Pro-gated feature list + tier check utility · T2 (AC3) Wire upgrade modal triggers to gated features · T3 (AC4-AC5) Server-side + client-side tier checks · T4 (AC6) Lint + build

**Dev Notes:**

- Create `src/lib/tier-gating.ts` with `isPro(tier: string): boolean` and `requirePro(tier: string, feature: string): void`
- Server-side: check tier in API routes before executing Pro logic
- Client-side: check tier in component render, show upgrade modal or locked state
- Pass `tier` from server component through to client components (already done in some places)
- The sidebar already shows locked state for some items — extend this pattern

---

### Story 13.3 — Billing Management (Paddle Portal)

**Status:** ready
**Story:** As a Pro founder, I want to view my plan, cancel, or update my payment method so that I can manage my subscription.

**Acceptance Criteria (EARS):**

- AC1: The dashboard Settings page shall display a "Billing" section showing: current plan (Free/Pro), next billing date, payment method last 4 digits.
- AC2: The Billing section shall include a "Manage Billing" button that opens Paddle's customer portal.
- AC3: The Paddle customer portal shall allow: view invoices, update payment method, cancel subscription.
- AC4: On subscription cancellation, the system shall downgrade `founder_profiles.tier` to "free" via webhook.
- AC5: The Billing section shall show an "Upgrade to Pro" button for Free founders (opens checkout).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings billing section + Paddle portal link · T2 (AC3) Paddle customer portal setup · T3 (AC4) Cancellation webhook handler · T4 (AC5) Free tier upgrade button · T5 (AC6) Lint + build

**Dev Notes:**

- **Paddle customer portal:** Use `paddle.customerPortals.createSession(customerId, { subscription_ids: [...] })` to get an authenticated URL. Link to it directly — do NOT iframe.
- Store Paddle subscription ID in `founder_profiles` (`paddle_subscription_id` column — created in Story 11.7)
- Webhook: `subscription.canceled` → update tier to "free"
- Settings page: `src/app/dashboard/settings/page.tsx` (shared with Story 12.5, 13.5)
- `subscription.canceled` fires once when the founder cancels. The subscription remains active until the end of the billing period, then downgrades.

---

### Story 13.4 — Pro-Tier Subscriber Limits (500 Cap)

**Status:** ready
**Story:** As a system, I want to enforce the 500 subscriber cap on Free tier so that Free founders upgrade when they hit the limit.

**Acceptance Criteria (EARS):**

- AC1: The system shall check subscriber count before creating a new subscriber via `POST /api/subscribers`.
- AC2: If the waitlist is on Free tier and has ≥500 subscribers, the API shall return HTTP 403 with `{ error: "Subscriber limit reached. Upgrade to Pro for unlimited signups." }`.
- AC3: The public waitlist page shall show a message when the cap is reached: "This waitlist has reached its subscriber limit. Please check back later."
- AC4: Pro tier waitlists shall have no subscriber cap.
- AC5: The subscriber count check shall use a cached `subscriber_count` column on the `waitlists` table (atomic increment on insert, decrement on delete).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) API route subscriber cap check · T2 (AC3) Public page cap message · T3 (AC4) Pro tier bypass · T4 (AC5) Count query optimization · T5 (AC6) Lint + build

**Dev Notes:**

- Add cap check at the top of `POST /api/subscribers` handler, before position calculation
- Query tier: join `waitlists` with `founder_profiles` to get tier
- **Cached counter approach:** Use `waitlists.subscriber_count` (integer, DEFAULT 0 — created in Story 11.7). On insert: `UPDATE waitlists SET subscriber_count = subscriber_count + 1 WHERE id = $1`. On delete: `UPDATE waitlists SET subscriber_count = subscriber_count - 1 WHERE id = $1`. The cap check becomes: `if (tier === 'free' && subscriber_count >= 500) return 403`.
- **Counter increment (must not be missed):** After the successful subscriber insert in `POST /api/subscribers` (currently at line 84-91 of `src/app/api/subscribers/route.ts`), add: `await supabase.rpc('increment_subscriber_count', { p_waitlist_id: waitlist_id })` or a direct `UPDATE waitlists SET subscriber_count = subscriber_count + 1 WHERE id = $1`. This is currently NOT implemented — the counter column doesn't exist yet (Story 11.7 adds it), and no code increments it.
- The public page (`[subdomain]/page.tsx`) needs to check count before rendering the email capture form
- For MVP, 500 is the cap. This is configurable in the tier definition.
- Use a database transaction for the insert + counter increment to prevent race conditions

---

### Story 13.5 — Sender Domain Authentication Walkthrough

**Status:** ready
**Story:** As a Pro founder, I want a step-by-step walkthrough to set up my own sending domain (SPF/DKIM) so that my emails have better deliverability.

**Acceptance Criteria (EARS):**

- AC1: The dashboard Settings page shall include a "Domain Authentication" section visible only to Pro founders.
- AC2: The section shall show a step-by-step wizard: (1) Add domain in Resend, (2) Copy DNS records, (3) Verify.
- AC3: Step 1 shall display the exact DNS records Resend provides (MX, TXT SPF, TXT DKIM) with copy-to-clipboard buttons.
- AC4: Step 2 shall guide the founder to add records to their DNS provider (Cloudflare, Route53, etc.) with plain-language instructions.
- AC5: Step 3 shall have a "Verify" button that checks DNS propagation status via Resend's API.
- AC6: On successful verification, the system shall update the waitlist's sender domain to the verified domain.
- AC7: The section shall show the current sending domain status: unverified, pending, verified.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings UI with domain auth section · T2 (AC3-AC4) DNS record display + copy buttons + instructions · T3 (AC5-AC6) Verify button + Resend API check · T4 (AC7) Status display · T5 (AC8) Lint + build

**Dev Notes:**

- Resend domain verification: `resend.domains.create({ name })` → returns DNS records → `resend.domains.verify({ id })` → check status
- DNS records: MX (feedback-smtp.us-east-1.amazonses.com, priority 10), TXT SPF (v=spf1 include:amazonses.com ~all), TXT DKIM (resend._domainkey)
- DMARC: not set by Resend — guide founder to add `_dmarc` TXT record on root domain
- Store verified domain in `waitlists` table (`sending_domain` column, nullable)
- When `sending_domain` is set, use `{sender_name}@{sending_domain}` as the from address
- The wizard should be simple: 3 steps, copy buttons, verify button. No complex DNS management.

---

### Story 13.6 — Epic 13 Tests

**Status:** ready
**Story:** As a developer, I want comprehensive tests for billing and feature gating so that I can verify correctness and prevent regressions.

**Acceptance Criteria (EARS):**

- AC1: The system shall have API route tests for `POST /api/billing/checkout` covering: creates checkout session, returns error for unauthenticated user.
- AC2: The system shall have API route tests for `POST /api/webhooks/paddle` covering: subscription.created updates tier, subscription.cancelled reverts to free, invalid signature rejected.
- AC3: The system shall have component tests for the upgrade modal: renders for each trigger, dismiss behavior, cooldown logic.
- AC4: The system shall have API route tests for `POST /api/subscribers` covering: returns 403 when Free tier cap hit (500), allows Pro tier past cap.
- AC5: The system shall have component tests for feature gating: Pro features locked for Free, unlocked for Pro.
- AC6: Lint and build shall pass with zero errors.
- AC7: Total test count for Sprint 3 shall be ≥270.

**Tasks:** T1 (AC1-AC2) Billing API tests · T2 (AC3) Upgrade modal component tests · T3 (AC4) Subscriber cap API tests · T4 (AC5) Feature gating component tests · T5 (AC6-AC7) Lint + build + count verification

---

## Sprint 3 Cumulative Target

| Metric     | Sprint 2 End | Sprint 3 Target                                                                                                                                                                                 |
| ---------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Epics      | 10           | 13                                                                                                                                                                                              |
| Stories    | 71           | 93                                                                                                                                                                                              |
| Screens    | 21           | ~28                                                                                                                                                                                             |
| Tables     | 8            | 12 (+broadcasts, +email_events.event_data, +waitlists.sending_domain, +waitlists.sender_name, +waitlists.cold_threshold, +waitlists.subscriber_count, +founder_profiles.paddle_subscription_id) |
| API Routes | 15           | ~24                                                                                                                                                                                             |
| Tests      | 225          | ≥270                                                                                                                                                                                            |
| Components | 37           | ~45                                                                                                                                                                                             |
