# Epic 11 — Warmth Tracking Engine

**Status:** done
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

| ID   | Title                                     | Depends on | Status             |
| ---- | ----------------------------------------- | ---------- | ------------------ |
| 11.7 | Schema Migration — Sprint 3 Columns       | —          | done               |
| 11.0 | Resend Webhook Endpoint                   | —          | done               |
| 11.1 | Warmth Score Calculation Engine           | 11.0       | done               |
| 11.2 | Warmth Column + Filter in Subscriber List | 11.1       | done (warmth page) |
| 11.3 | Warmth Distribution Panel (Real Data)     | 11.1       | done               |
| 11.4 | Dashboard Warning State                   | 11.1       | done               |
| 11.5 | Warmth Score Decay + Time-Based Rules     | 11.1       | done               |
| 11.6 | Epic 11 Tests                             | 11.0–11.5  | done               |

**Execution order:** 11.7 and 11.0 can run in parallel (no dependencies). 11.1 depends on 11.0. Stories 11.2–11.5 depend on 11.1. Story 11.6 runs last after all other stories complete.

> **Sync note (Story 15.6, 2026-09-25):** Statuses and Dev Notes in this document now reflect shipped state. Where the original Epic 11 text below differs from shipped truth (scoring signals, decay sources, badge/filter surface, test file names), the canonical story files `docs/stories/completed/story-11.*.md` were amended in Story 15.6 — read those as source of truth. Open manual gates tracked in MEMORY Epic 15: run `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql` in Supabase + verify the Vercel cron deployment.

---

### Story 11.7 — Schema Migration — Sprint 3 Columns

**Status:** done
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

- T1 (AC1–AC10): ✅ Implemented — `docs/stories/sql-writeups/epic11-story7-sprint3-schema.sql`, applied to Supabase (audit §2.8: "SQL exists + applied"). All columns nullable/defaults per AC10; CHECK extended to the 8 values per AC9 (`:64`).
- T1 (AC7): ✅ `broadcasts` table created — accessed via authenticated API only, per original design (no public read path).
- T1 (AC8): ✅ `subscriber_count` cached counter added — wired to atomic increment/decrement on subscriber insert/delete (Story 13.4's 500-cap check).
- T1: Untracked columns (`email_subject`, `email_sender_name`, `email_body`) shipped separately in `epic12.2-story-email-columns.sql`.
- Epic 15 add-on: `epic15-story2-email-events-svix-unique.sql` (partial unique index for webhook idempotency) exists — **manual gate: still to run in Supabase before Epic 15 deploys**.

---

### Story 11.0 — Resend Webhook Endpoint

**Status:** done
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

- T1 (AC1): ✅ `POST /api/webhooks/resend` at `src/app/api/webhooks/resend/route.ts`.
- T1 (AC2): ✅ Signature verification via the Resend SDK (`resend.webhooks.verify()`) with `RESEND_WEBHOOK_SECRET` — no `svix` npm package was ever needed (the original note assumed one).
- T1: ✅ Raw body via `req.text()` — HMAC verification would break on re-serialized JSON.
- T2 (AC3): ✅ Verified events stored in `email_events` with `event_data` jsonb (added Story 11.7). Stored types match the live 8-value CHECK; AC3's six-value list predates that migration.
- T2 (AC4): ✅ `email_id` resolved to `subscriber_id` by email-address lookup.
- T3 (AC5): ✅ Idempotency: svix message id persisted in `event_data.svix_id`; duplicate insert hits the 23505 unique-violation catch. DB-side guarantee = partial unique index in `epic15-story2-email-events-svix-unique.sql` — **manual gate: still to run**.
- T3 (AC6/AC7): ✅ Fast 200 response; heavy recalculation deferred via `after()` (route:84); event `created_at` from payload used for sequencing. Multi-waitlist attribution fixed in Epic 15 Story 15.2.
- Validation: missing/invalid svix headers or failed signature → **401** (route:39–42, :58) — the pre-fix 400-vs-401 drift (audit §2.4 finding 20) is corrected.

---

### Story 11.1 — Warmth Score Calculation Engine

**Status:** done
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

- T1 (AC1–AC4): ✅ `src/lib/warmth.ts` — scored signals: email click +5, referral signup +15, qualification answers +8. The original weights in AC2 above are superseded: **reply (+10) and leaderboard visit (+5) were dropped** (Epic 15 Story 15.0) — Resend emits no reply event and `page_views` is never written. Canonical ACs: `story-11.1-warmth-calculation.md`.
- T1 (Apple MPP): ✅ Opens are NOT a warmth signal — `docs/product-vision-mvp-waitlist-tool.md` amended in Story 15.6 (5 sites).
- T1 (decay): ✅ Clicked-only last engagement with `subscribers.created_at` fallback; windows 0–59 free / 60–89 −25 / 90+ → 0. Boundary is `daysSince >= 60` (day 59 not penalized).
- T2 (AC5/AC6): ✅ `assignTier(score, hadEngagement)` — Hot ≥70, Warm ≥40, Cold >0; score 0 **with** lifetime engagement → Cold; Unscored only when never engaged.
- T3 (AC8): ✅ Daily batch at `src/app/api/cron/warmth/route.ts` (Bearer `CRON_SECRET`), scheduled `0 5 * * *` UTC in `vercel.json`. **Manual gate: verify the Vercel cron deployed.**
- T3: `GET /api/dashboard/warmth` (44 lines) already returns `{hot, warm, cold, unscored, total}`.
- Batch iteration is paginated (Story 15.0) — no full-table load for large waitlists.

---

### Story 11.2 — Warmth Column + Filter in Subscriber List

**Status:** done (warmth page only — see Dev Notes)
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

- T1–T4: ✅ Implemented — warmth badge + client-side tier filter live on `/dashboard/warmth` (`src/app/dashboard/warmth/client.tsx`): badge classes at :49–55 (Hot = `bg-accent/10 text-accent` green — fixes the original red-badge bug, Warm amber, Cold blue, Unscored grey), filter select at :188–199, row filtering via `useMemo` at :70–87.
- **Scope correction (Story 15.6):** the badge/filter are NOT in the dashboard subscriber table (`src/app/dashboard/client.tsx`) — the original line references (84, 483–493, 577–595) were dead after Story 12.1.9. Canonical ACs rewritten in `story-11.2-warmth-column-filter.md`.
- Story 15.4 follow-up: Hot badge/bar tones confirmed against design tokens (accent green).

---

### Story 11.3 — Warmth Distribution Panel (Real Data)

**Status:** done
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

- T1 (AC1–AC3): ✅ `components/dashboard/warmth-panel.tsx` renders four horizontal bars (Hot/Warm/Cold/Unscored) with counts + percentages; Hot = `bg-accent` (brand green), Warm/Cold/Unscored per design tokens — the original hardcoded `bg-red-500`/`bg-amber-500`/`bg-blue-500`/`bg-gray-400` bars are gone.
- T2 (AC4): ✅ Data comes from the shared dashboard stats fetch with props passed into the panel (no independent fetch since Story 15.4); shape `{hot, warm, cold, unscored, total}` from `GET /api/dashboard/warmth`. The original `/api/warmth/${subdomain}` public fetch was removed.
- T3 (AC5): ✅ Zero-subscriber state shows em-dashes.
- T3 (AC6): ✅ `LockedOverlay`/blur removed — panel visible to all tiers. Free-tier UX nudges added in Story 15.4 (upgrade badge, no lock). Pro gating of the separate warmth _page_ is Story 12.3.3.
- Tests: `src/__tests__/components/dashboard-warmth-page.test.tsx` (Story 15.5) covers distribution rendering + empty state (canonical AC5 file mapping — the original `warmth-panel.test.tsx` suite also exists).

---

### Story 11.4 — Dashboard Warning State

**Status:** done
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

- T1 (AC1–AC3): ✅ `components/dashboard/warning-banner.tsx` — cold-% calculation, warning-styled banner, placement at top of main content below stat cards.
- T2 (AC4): ✅ Minimum 10 subscribers gate before the banner renders.
- T3 (AC5): ✅ `waitlists.cold_threshold` (integer, default 40) added by Story 11.7; configurable on the settings page (range 20–80).
- Note: the settings `warning-threshold` helper copy describes the cold-% warning (20–80), not a score cutoff. Hardened in Story 15.4 (props-only — no independent fetch).
- Tests: `src/__tests__/components/warning-banner.test.tsx` (Story 15.5).

---

### Story 11.5 — Warmth Score Decay + Time-Based Rules

**Status:** done
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

- T1 (AC1–AC3): ✅ Decay lives in `calculateWarmthScore()` (`src/lib/warmth.ts`) — applied after signal summing. Last engagement = most recent **clicked** event; fallback to `subscribers.created_at` when no clicks exist. The original AC1/AC3 wording (click/reply/referral, `email_events.created_at`) is superseded — reply events don't exist in Resend and `created_at` of _any_ event (incl. old sends) skewed staleness. Canonical ACs: `story-11.5-warmth-decay.md`.
- T2 (AC4): ✅ Never-engaged subscribers → Unscored (not Cold); engaged-but-score-0 → Cold (Story 15.0 tier rule).
- T3 (AC5): ✅ Applied inside the daily batch (`/api/cron/warmth`, `0 5 * * *` UTC) — never on read. **Manual gate: verify Vercel cron deployed.**
- Boundary: `daysSince >= 60` — the pre-15.0 `>= 59` off-by-one is fixed and covered by tests in `src/__tests__/lib/warmth.test.ts`.

---

### Story 11.6 — Epic 11 Tests

**Status:** done
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

- T1 (AC1): ✅ `src/__tests__/api/webhook-resend.test.ts` — 7 tests (lines 84, 99, 112, 147, 161, 171, 183) covering missing-header 401, signature-failure 401, valid-event storage, idempotent duplicate handling, event types, and the Epic 15 multi-waitlist attribution fix.
- T2 (AC2): ✅ `src/__tests__/lib/warmth.test.ts` (19 tests) + `warmth-batch.test.ts` — multi-signal scores, clamping, tier thresholds (incl. engagement-aware Unscored vs Cold), decay windows + the `>= 60` boundary, zero-event handling, batch pagination.
- T3 (AC3–AC4): ✅ Warmth badge + filter coverage ships in `src/__tests__/components/dashboard-warmth-page.test.tsx` (Story 15.5) — the originally planned `warmth-badge.test.tsx` / `warmth-filter.test.tsx` files were never created; canonical ACs updated accordingly.
- T4 (AC5): ✅ `src/__tests__/components/dashboard-warmth-page.test.tsx` (distribution rendering + empty state) + `warning-banner.test.tsx` + `warmth-panel.test.tsx` (Story 15.5).
- T5 (AC7): ✅ Suite total **527** (520 passing + 7 pre-existing failures: dashboard-archive 4, dashboard-subscriber-table 3) — far above the ≥250 target (original baseline 231).
