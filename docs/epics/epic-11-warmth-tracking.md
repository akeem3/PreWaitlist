# Epic 11 — Warmth Tracking Engine

**Status:** ready
**Source:** [PRD §2a](../PRD.md#2a-sprint-2--public-page-dashboard-active), [MVP Vision Module 3](../product-vision-mvp-waitlist-tool.md#module-3--warmth-tracking), [MVP Vision Module 4 §Email Open Tracking](../product-vision-mvp-waitlist-tool.md)

## Design References

| Reference                 | File                                        |
| ------------------------- | ------------------------------------------- |
| Warmth distribution panel | `docs/design/sprint-3-design-specs.md` — S3 |
| Warmth badge + filter     | `docs/design/sprint-3-design-specs.md` — S2 |
| Dashboard warning banner  | `docs/design/sprint-3-design-specs.md` — S7 |
| Dashboard design guide    | `docs/design/dashboard-design-guide.md`     |
| Design tokens             | `src/app/globals.css`                       |

## Goal

Build the warmth scoring engine that calculates a 0–100 engagement score per subscriber using Resend webhook events (email clicks, bounces) and qualification answer data. Display Hot/Warm/Cold status in the dashboard subscriber list and warmth distribution panel. The warmth panel moves from placeholder to live data.

## Definition of Done

Every subscriber has a warmth score (0–100) that updates via daily batch recalculation. The dashboard subscriber list shows a warmth badge (Hot/Warm/Cold/Unscored) per row with a working filter. The warmth distribution panel shows real bar chart data. The dashboard warning state triggers when cold % exceeds a configurable threshold.

## Story Index

| ID   | Title                                     | Depends on | Status |
| ---- | ----------------------------------------- | ---------- | ------ |
| 11.7 | Schema Migration — Sprint 3 Columns       | —          | ready  |
| 11.0 | Resend Webhook Endpoint                   | —          | ready  |
| 11.1 | Warmth Score Calculation Engine           | 11.0       | ready  |
| 11.2 | Warmth Column + Filter in Subscriber List | 11.1       | done   |
| 11.3 | Warmth Distribution Panel (Real Data)     | 11.1       | ready  |
| 11.4 | Dashboard Warning State                   | 11.1       | ready  |
| 11.5 | Warmth Score Decay + Time-Based Rules     | 11.1       | ready  |
| 11.6 | Epic 11 Tests                             | 11.0–11.5  | ready  |

**Execution order:** 11.7 and 11.0 can run in parallel (no dependencies). 11.1 depends on 11.0. Stories 11.2–11.5 depend on 11.1. Story 11.6 runs last after all other stories complete.

---

### Story 11.7 — Schema Migration — Sprint 3 Columns

**Status:** ready
**Design Refs:** None
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

**Out of scope:** Data backfill, column removals, index additions (add in subsequent stories if needed)

**Dev Notes:**

- T1: Write the migration as `docs/stories/epic11-story7-sprint3-schema.sql`. Run against Supabase SQL editor or via `supabase db push`. All columns use nullable or DEFAULT — safe to apply on tables with existing data. **Status: NOT STARTED — file does not exist.**
- T1 (AC7): The `broadcasts` table stores broadcast history for the dashboard activity feed. No RLS needed — founders access via authenticated API only. **Status: NOT STARTED.**
- T1 (AC8): `subscriber_count` is an optimization: atomic increment on insert, decrement on delete, avoids `COUNT(*)` on every signup for the 500-cap check (Story 13.4). **Status: NOT STARTED.**
- T1 (AC9): The current `email_events.event_type` constraint only allows `sent/delivered/opened/clicked/bounced`. Story 11.0 needs `complained` and `failed` from Resend webhooks. Must `DROP CONSTRAINT` then `ADD CONSTRAINT` — Postgres does not support `ALTER CONSTRAINT`. **Status: NOT STARTED — current constraint in `epic7-story6-warmth-schema.sql` line 40 still shows original 5-value CHECK.**
- T1: **Untracked columns:** `email_subject`, `email_sender_name`, `email_body` are referenced in code (`src/app/api/waitlist/route.ts` GET handler, `src/app/onboarding/context.tsx` FIELD_MAP) but have no migration file in `docs/stories/sql-writeups/`. Verify they exist in the live DB before running this migration — if not, add them here. **Status: NOT VERIFIED.**

---

### Story 11.0 — Resend Webhook Endpoint

**Status:** ready
**Design Refs:** None
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

**Out of scope:** Score calculation (Story 11.1), bulk event backfill, webhook retry logic (Resend handles retries for 72h)

**Dev Notes:**

- T1: Resend webhook events: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`, `email.failed`. Payload includes `email_id` (UUID), `from`, `to`, `subject`, event-specific data (e.g., `bounce.type`, `bounce.subType`). **Status: NOT STARTED — `src/app/api/webhooks/resend/route.ts` does not exist, no `webhooks/` directory.**
- T1: **Critical:** Use `req.text()` (NOT `req.json()`) for the raw body — Svix signature verification breaks if the body is re-serialized via `JSON.stringify()`. **Status: NOT STARTED.**
- T1: Svix verification: `resend.webhooks.verify({ payload, headers: { 'svix-id', 'svix-timestamp', 'svix-signature' }, secret })`. Use `RESEND_WEBHOOK_SECRET` env var. **Status: NOT STARTED — `svix` package not installed, `RESEND_WEBHOOK_SECRET` not in `.env.local`.**
- T2: Use `waitUntil()` or background task for Postgres writes to keep response fast (Resend has a 15-second response timeout). **Status: NOT STARTED.**
- T2: `email_events` table already exists (Story 7.6) — but needs `event_data jsonb` column added via Story 11.7. Must run 11.7 first or in parallel. **Status: NOT STARTED.**
- T3: Events arrive out of order and at-least-once — dedupe on `svix-id` (store in `event_data` or a separate `webhook_msg_id` column), use `created_at` from payload for sequencing. **Status: NOT STARTED.**
- T3: Webhook auto-disables after ~5 days of continuous failures — monitor and alert (manual monitoring for MVP). **Status: NOT STARTED.**
- T4: Rate estimate: 10,000 emails/month → 30,000–50,000 events/month (~50–100 MB storage). **Status: NOT STARTED.**

---

### Story 11.1 — Warmth Score Calculation Engine

**Status:** ready
**Design Refs:** None
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

**Out of scope:** Real-time score updates on every event (daily batch is sufficient for MVP), warmth trend charts (v1.1), subscriber-facing score display

**Dev Notes:**

- T1: Create `src/lib/warmth.ts` with `calculateWarmthScore(subscriberId, supabase)` and `assignTier(score) => "hot" | "warm" | "cold" | null`. **Status: NOT STARTED — file does not exist.**
- T1: Query `email_events` for the subscriber (count clicks, bounces), `subscribers` for referral count and `qual_answers` (JSONB — check if populated for qual coverage). **Status: NOT STARTED.**
- T1: **Apple MPP caveat:** Email opens are NOT included as a warmth signal. Apple Mail Privacy Protection preloads tracking pixels for ~40-50% of email clients, making open data unreliable. Clicks (+5) and referrals (+15) are the primary intent signals. **Status: NOT STARTED.**
- T1: **Decay starts at 60 days (not 30):** Waitlist subscribers may go quiet while waiting for launch. This is not disengagement — it's expected behavior. 30-day decay would penalize early adopters unfairly. **Status: NOT STARTED.**
- T1: Time decay: calculate days since last `email_events.created_at` for the subscriber; if >60 days, apply -25 penalty; if >90 days, reset to 0. **Status: NOT STARTED.**
- T1: Score formula: `min(100, max(0, rawScore - decayPenalty))`. **Status: NOT STARTED.**
- T2: The `warmth_score` column stores the tier string ("hot", "warm", "cold"), NOT the numeric score. The numeric score is transient — recalculated in batch. **Status: NOT STARTED.**
- T3: For MVP, the daily cron is sufficient. Real-time recalculation on every webhook event is v1.1. Use `pg_cron` or a scheduled API route. **Status: NOT STARTED.**
- T3: Existing `GET /api/dashboard/warmth` route already queries by `warmth_score` column — just needs data to exist. **Status: API exists at `src/app/api/dashboard/warmth/route.ts` (44 lines), correct shape `{hot, warm, cold, unscored, total}`.**
- T1: **Effective score range:** With the signal weights defined above, the theoretical max is ~53 points (referral + qual + click + leaderboard). Most active subscribers will score 15-40. The 0-100 scale provides headroom for future signals. **Status: NOT STARTED.**

---

### Story 11.2 — Warmth Column + Filter in Subscriber List

**Status:** done
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S2
**Story:** As a founder, I want to see a warmth badge (Hot/Warm/Cold/Unscored) next to each subscriber and filter by warmth tier so that I can identify engaged vs. disengaged subscribers.

**Acceptance Criteria (EARS):**

- AC1: The subscriber table shall display a warmth badge column between Position and Referrals.
- AC2: Hot subscribers shall show a green badge (`bg-accent/10 text-accent`), Warm = amber (`bg-yellow-100 text-yellow-800`), Cold = blue (`bg-blue-100 text-blue-800`), Unscored = grey (`bg-muted text-muted-foreground`).
- AC3: The table header shall include a warmth filter dropdown: All, Hot, Warm, Cold, Unscored.
- AC4: Filtering by warmth tier shall instantly filter the displayed rows without a server call.
- AC5: The warmth badge shall use the design system's caption typography (12px, regular).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Add warmth badge column with tier-specific colors · T2 (AC3-AC4) Add filter dropdown + client-side filtering · T3 (AC5) Typography compliance · T4 (AC6) Lint + build

**Out of scope:** (none — fully contained)

**Dev Notes:**

- T1–T4: **Status: Partially implemented — color bugs.** Warmth column, badge, filter dropdown, client-side filtering, and sorting all exist in `src/app/dashboard/client.tsx` (lines 84, 112, 129-133, 140-146, 483-493, 577-595). **BUT:** Hot badge uses `bg-red-100 text-red-700` (line 581) — AC specifies `bg-accent/10 text-accent` (green). Design tokens `bg-status-hot`, `bg-status-warm`, `bg-status-cold` exist in `globals.css` lines 33-35 but are NOT used by any component. Also: Warmth column is at position 6 (far right), not "between Position and Referrals" as AC1 states. Warmth stat card (lines 423-451) still shows locked overlay with Pro badge — AC6 says warmth viewing should be available to all tiers.

---

### Story 11.3 — Warmth Distribution Panel (Real Data)

**Status:** ready
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S3, `docs/design/dashboard-design-guide.md`
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

**Out of scope:** Warmth trend charts (v1.1), real-time score updates (daily batch in Story 11.1)

**Dev Notes:**

- T1: `components/dashboard/warmth-panel.tsx` currently shows a neutral placeholder — rewrite to fetch and display real data. **Status: PARTIALLY IMPLEMENTED — has real bar rendering but with 3 blocking issues.**
- T2: **Data source swap needed:** The panel currently fetches from `/api/warmth/${subdomain}` (public, unauthenticated). Rewrite to fetch from `GET /api/dashboard/warmth` (authenticated, returns `{ hot, warm, cold, unscored, total }`). Remove the `subdomain` prop. **Status: NOT DONE — line 91 still fetches from public endpoint. The correct authenticated endpoint exists at `src/app/api/dashboard/warmth/route.ts` but is not used.**
- T3: Remove the `tier` prop dependency — warmth is visible to all tiers. Remove blur overlay and locked state. **Status: NOT DONE — `LockedOverlay` component still exists (lines 18-51), blur applied when `isFree` (line 116), overlay rendered (line 144). Props interface still requires `tier` and `subdomain` (lines 13-16).**
- T1: Bar width: `Math.round((count / total) * 100)`% of container. Design guide: horizontal bars, 8px height, rounded-full. **Status: Bar rendering exists but uses wrong colors.**
- T1: Bar colors: Hot = `bg-status-hot`, Warm = `bg-status-warm`, Cold = `bg-status-cold`, Unscored = `bg-muted`. Use design system tokens from `globals.css`, not hardcoded colors. **Status: NOT DONE — lines 122/128/134/140 use `bg-red-500`, `bg-amber-500`, `bg-blue-500`, `bg-gray-400` (hardcoded). Design tokens exist in `globals.css` lines 33-35 but are unused.**
- T3: Empty state: when total = 0, show em-dashes for all counts and 0% for all percentages. **Status: DONE — line 70 shows em-dash when total=0.**

---

### Story 11.4 — Dashboard Warning State

**Status:** ready
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S7, `docs/design/dashboard-design-guide.md`
**Story:** As a founder, I want to be alerted when my list health is declining (high cold %) so that I can take action before launch.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display a warning banner when the cold subscriber percentage exceeds a configurable threshold (default: 40%).
- AC2: The warning banner shall use the design system's warning styling: `bg-yellow-50 border border-yellow-200 text-yellow-800`.
- AC3: The banner shall show: "⚠️ {X}% of your list has gone cold. Consider sending a re-engagement email."
- AC4: The warning shall only appear when there are ≥10 subscribers (avoid warning on tiny lists).
- AC5: The threshold shall be configurable in Settings (default 40%, range 20–80%).
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Create warning banner component with cold % calculation · T2 (AC4) Minimum subscriber threshold · T3 (AC5) Threshold configuration in Settings · T4 (AC6) Lint + build

**Out of scope:** Automated email alerts to founder (was Growth tier, now deferred), warmth trend alerts (v1.1)

**Dev Notes:**

- T1: Calculate cold %: `(coldCount / totalCount) * 100` from warmth distribution data. **Status: NOT STARTED — no warning banner component exists.**
- T1: Banner placement: top of main content area, below the stat cards row. **Status: NOT STARTED.**
- T2: Only show banner when `totalCount >= 10` — avoid false alarms on tiny lists. **Status: NOT STARTED.**
- T3: Settings storage: add `cold_threshold` column to `waitlists` table (integer, default 40) — already created in Story 11.7. Settings page: `src/app/dashboard/settings/page.tsx`. **Status: NOT STARTED — `cold_threshold` column does not exist in DB (not in any migration file), `src/app/dashboard/settings/page.tsx` does not exist, sidebar shows Settings as disabled.**
- T3: This is the visual warning only — automated email alert was a Growth feature, now deferred. **Status: NOT STARTED.**

---

### Story 11.5 — Warmth Score Decay + Time-Based Rules

**Status:** ready
**Design Refs:** None (algorithmic, no UI surface)
**Story:** As a system, I want warmth scores to decay over time so that stale subscribers are correctly identified as Cold.

**Acceptance Criteria (EARS):**

- AC1: The score calculation shall apply time decay based on days since last engagement event (email click, email reply, referral).
- AC2: Decay rules: 0–59 days = no penalty, 60–89 days = -25 points, 90+ days = score resets to 0.
- AC3: "Last engagement" shall be determined by the most recent `email_events.created_at` for the subscriber.
- AC4: Subscribers with zero events shall have score = 0 regardless of signup date.
- AC5: The decay shall be applied during the daily batch recalculation (Story 11.1), not on every read.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC3) Implement decay logic in warmth calculation · T2 (AC4) Handle zero-event subscribers · T3 (AC5) Integrate with daily batch job · T4 (AC6) Lint + build

**Out of scope:** Real-time decay (every read is v1.1), page-visit-based decay (page_views table not populated)

**Dev Notes:**

- T1: Decay is applied in `calculateWarmthScore()` — after summing all signal points, subtract decay penalty. **Status: NOT STARTED — `src/lib/warmth.ts` does not exist.**
- T1: Last engagement: use `MAX(created_at)` from `email_events` where `subscriber_id = $1`. **Status: NOT STARTED.**
- T2: **`page_views` table is NOT populated.** No code inserts into this table. Decay relies solely on `email_events.created_at` for last engagement signal. Page-visit-based warmth scoring is deferred to v1.1 when the tracking middleware is built. **Status: NOT STARTED.**
- T3: For MVP, daily batch is sufficient. Real-time decay (every read) is v1.1. **Status: NOT STARTED.**
- T3: Decay is integrated into Story 11.1's batch recalculation job — this story provides the algorithm, Story 11.1 provides the execution trigger. **Status: NOT STARTED.**

---

### Story 11.6 — Epic 11 Tests

**Status:** ready
**Design Refs:** None
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

**Out of scope:** E2E tests (manual testing for MVP), load/stress testing

**Dev Notes:**

- T1: Test file: `src/__tests__/api/webhook-resend.test.ts`. Mock Supabase client, mock Svix verification. Test cases: valid event → row in email_events, invalid signature → 401, duplicate svix-id → no duplicate row, unknown event type → 400. **Status: NOT STARTED — file does not exist.**
- T2: Test file: `src/__tests__/lib/warmth.test.ts`. Pure function tests — no DB calls. Test cases: score with clicks+refs+qual, score clamped at 0 and 100, tier assignment thresholds, decay at 60/90 days, zero events → score 0 / tier null. **Status: NOT STARTED — file does not exist.**
- T3: Test file: `src/__tests__/components/warmth-badge.test.tsx`. Render with each tier prop, verify correct color class and label text. **Status: NOT STARTED — file does not exist.**
- T4: Test file: `src/__tests__/components/warmth-filter.test.tsx`. Render dropdown, select each option, verify callback fires with correct tier. **Status: NOT STARTED — file does not exist.**
- T4: Test file: `src/__tests__/components/warmth-panel.test.tsx`. Mock fetch, verify bars render with correct widths, empty state shows em-dashes. **Status: NOT STARTED — file does not exist.**
- T5: Run `pnpm test` and count total tests. Current baseline: 231 tests. Sprint 3 target: ≥250. **Note:** Existing test `src/__tests__/api/warmth.test.ts` (109 lines) tests the PUBLIC endpoint, not Epic 11 functionality. Will need updating or replacement.
