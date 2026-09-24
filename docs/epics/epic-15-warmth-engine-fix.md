# Epic 15 — Warmth Engine Fix & Hardening

**Status:** ready
**Source:** [Five-Engine Audit §2 Warmth](../scans/engine-audit-5-engines.md#2-warmth--%EF%B8%8F-partial-verified-rescan-confidence-96), [PRD §2 Sprint 3](../PRD.md), [MVP Vision Module 3 — Warmth Tracking](../product-vision-mvp-waitlist-tool.md#module-3--warmth-tracking), [Story 11.0–11.7](completed/story-11.0-resend-webhook.md), [Story 12.3.3](completed/story-12.3.3-dashboard-warmth.md), Vercel Cron docs, Resend Webhook event types

## Design References

| Reference                                                                             | File                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| S1 — Warmth Distribution Panel (ASCII; Hot fill superseded — see Standing Decision 3) | `docs/design/sprint-3-design-specs.md` §S1                                |
| S2 — Dashboard Warning Banner                                                         | `docs/design/sprint-3-design-specs.md` §S2                                |
| Warmth badge colors / filter on warmth page                                           | `docs/design/dashboard-design-guide.md` (Warmth Badge Colors)             |
| Warmth page summary + table (Pro)                                                     | `docs/design/sprint-3-design-specs.md` (warmth page notes) + Story 12.3.3 |
| Settings Warmth tab (cold threshold field)                                            | `src/app/dashboard/[waitlistId]/settings/client.tsx` (no dedicated SVG)   |

No high-fidelity Sprint 3 SVGs exist for warmth; Sprint 3 is markdown-spec driven. Colors use Design System v2.0 tokens from `src/app/globals.css`.

## Goal

Repair the warmth tracking engine so production scores are **produced daily**, **correct**, and **honest**: schedule the existing daily cron, fix batch scoring bugs (page-scoped referrals, unstable pagination), decay only on real engagement (`clicked`), force **Cold** when an engaged subscriber decays to zero, drop unimplementable signals (email reply, leaderboard visit), harden the Resend webhook (401, multi-waitlist attribution, idempotency), align segment counts with send-time eligibility and Pro gating, fix display/copy mismatches (bar colors, settings helper, orphan fallback fetch), ship the missing webhook/cron/batch/panel/segment tests, and synchronize Epic 11 stories + vision docs with research-backed truth (opens stay out of scoring post-MPP).

## Definition of Done

`vercel.json` schedules `/api/cron/warmth` and the endpoint is verified in Vercel (manual invoke returns processed counts). Batch scoring orders pages stably and counts referrals correctly across pages. Decay uses last `clicked` (signup date fallback), days 0–59 free / 60–89 −25 / 90+ → 0; score 0 with lifetime engagement stores `warmth_score = 'cold'`; never-engaged stays null/Unscored. Dead reply/visit weights are gone from code and Story 11.1 AC2. Webhook returns 401 on bad signature/headers, attributes events without arbitrary `.limit(1)` single-waitlist pick, and is race-safe after the unique index migration. Segments honor `?wid=`, `requirePro`, and exclude unsubscribed (and bounced where feasible) so UI counts match deliverable send counts. Panel Hot bar uses accent green consistent with badges; WarningBanner has no broken no-`waitlist_id` fetch; warmth page Last Engagement uses clicks only; settings helper text matches cold-% semantics (**COPY GAP** — founder-approved string required). New tests cover webhook, cron, batch, panel, and segments; existing unit tests updated for new score/tier rules. Stories 11.1–11.6, vision opens lines, MEMORY, and audit §2 are amended. `pnpm lint`, `pnpm test`, and `pnpm build` pass with no new failures beyond the documented baseline.

## Standing Decisions (locked 2026-09-24 — do not relitigate)

| #   | Decision                                                                                                                                  | Rationale                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | **Drop** `email_reply (+10)` and `leaderboard_visit (+5)` weights; rewrite Story 11.1 AC2 to click + referral + qual only                 | Resend has no reply webhook; `page_views` never written                               |
| 2   | Story 11.2 badge + filter live on **`/dashboard/warmth` only** — rewrite ACs; do **not** restore a main-dashboard subscriber table        | Main dashboard has no subscriber table; surface already built on warmth page          |
| 3   | **Decayed-to-zero (score 0 with lifetime engagement) → Cold**, not Unscored; Unscored = never engaged / null column                       | Fixes warning% and segment undercount of fully lapsed subscribers                     |
| 4   | **Decay clock = last `clicked` only** (fallback: subscriber `created_at` if never clicked); `sent`/`delivered`/`opened` never reset decay | Matches Story 11.5 AC1 intent; MPP makes opens unreliable; outbound mail ≠ engagement |
| 5   | **Keep Hot ≥ 70** (and Warm ≥ 40); no negative bounce/unsub signals in this epic                                                          | Calibrate after real cron data; negatives = v1.1                                      |
| 6   | Schedule cron via **`vercel.json` `crons[]`** (`0 5 * * *` UTC default)                                                                   | Reviewable in repo; Vercel docs-supported path                                        |
| 7   | Webhook invalid signature / missing headers → **401** (not 400)                                                                           | Aligns with Story 11.0 / 11.6 ACs                                                     |
| 8   | Panel **Hot bar = `bg-accent`** (green), not `bg-status-hot`                                                                              | Story 11.3 AC3 (bars = badge colors) supersedes S1 ASCII `bg-status-hot` note         |
| 9   | Free tier still sees panel **numbers** + upgrade nudge; `/dashboard/warmth` page remains **Pro-gated**                                    | 2026-09-22 + Story 12.3.3 AC6 — not reopened                                          |
| 10  | Opens **never** enter warmth score (amend vision :150)                                                                                    | Apple MPP; code already correct                                                       |

**Copy rule:** Agent never invents user-facing copy. Strings marked **COPY GAP** require founder approval before shipping.

## Story Index

| ID   | Title                                             | Depends on | Status |
| ---- | ------------------------------------------------- | ---------- | ------ |
| 15.0 | Warmth Scoring Core (signals, decay, tier, batch) | —          | ready  |
| 15.1 | Daily Cron Schedule (`vercel.json`)               | —          | ready  |
| 15.2 | Resend Webhook Ingestion Hardening                | —          | ready  |
| 15.3 | Segment Counts, Pro Gate & Eligibility            | —          | ready  |
| 15.4 | Warmth Display, Copy & Read Path Fixes            | —          | ready  |
| 15.5 | Epic 15 Tests                                     | 15.0–15.4  | ready  |
| 15.6 | Story, Vision, MEMORY & Audit Sync                | 15.0–15.5  | ready  |

**Execution order:** 15.0 first (scoring correctness everything else reads). Then **15.1 + 15.2 + 15.3 + 15.4 in parallel** (independent surfaces). Then 15.5 (tests), then 15.6 (docs). 15.1 can ship with 15.0 in the same release train so scores actually refresh after the core fix.

Stories must be executed in dependency order where listed; status workflow: `ready` → `in-progress` → `done` (or `blocked`). Manual gates: Supabase unique-index SQL (15.2) and settings helper **COPY GAP** approval (15.4) block those stories’ completion criteria.

---

### Story 15.0 — Warmth Scoring Core (signals, decay, tier, batch)

**Status:** ready
**Design Refs:** — (algorithm + batch; no SVG)
**Story:** As a platform, I want warmth scores computed from only real engagement signals with correct decay and referral counts so that Hot/Warm/Cold in production reflect who actually engaged.

**Acceptance Criteria (EARS):**

- AC1: The system shall score subscribers using only: `email_click` (+5), `referral_signup` (+15), `qualification_completed` (+8). The `email_reply` and `leaderboard_visit` weights and any `replied` event filtering shall be removed from `src/lib/warmth.ts`.
- AC2: Time decay shall consider **only** `email_events.event_type === "clicked"` for the "last engagement" timestamp; if the subscriber has zero clicked events, the decay clock shall start from `subscribers.created_at`.
- AC3: Decay windows shall be: days since last engagement 0–59 → no penalty; 60–89 → −25 points; 90+ → score forced to 0 (clamped). Day 59 shall **not** apply the −25 penalty (`daysSince >= 60`, not `>= 59`).
- AC4: `assignTier` (or score+tier helper) shall return `hot` for score ≥ 70, `warm` for ≥ 40, `cold` for score > 0 **or** (score === 0 **and** the subscriber has lifetime engagement: clicks > 0, referrals > 0, or qual answers present), and `null` (Unscored) only when score is 0 **and** there is no lifetime engagement.
- AC5: `batchRecalculateWarmth` shall paginate subscribers with a stable `.order("id", { ascending: true })` before `.range(...)`.
- AC6: For each page of subscriber IDs, referral counts shall be computed as the number of rows whose `referrer_id` is **in that page’s subscriber IDs** (referrals _made by_ page members), not referrers _of_ page members — so cross-page referrals still credit the referrer on the page where the referrer is scored.
- AC7: The batch shall continue to write only the tier string (`hot`/`warm`/`cold`/`null`) to `subscribers.warmth_score` and return `{ processed, hot, warm, cold, unscored }`.
- AC8: Clamp shall remain 0–100; qualitative +8 and referral ×15 multi-signal paths shall remain covered by tests.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Remove dead weights · T2 (AC2–AC3) Click-only decay + boundary fix · T3 (AC4) Tier-at-zero rules · T4 (AC5–AC7) Batch pagination + referral count fix · T5 (AC8–AC9) Unit test updates + lint/build

**Out of scope:** Cron scheduling (15.1), webhook (15.2), segments (15.3), UI (15.4), negative signals, lowering Hot threshold, building `page_views` or inbound reply.

**Dev Notes:**

- **T1:** `SIGNAL_WEIGHTS` currently at `warmth.ts:4」-10` — keep `email_click`, `referral_signup`, `qualification_completed` only. Remove `replyCount` block at `:35-36`.
- **T2:** `calculateDecay` at `:51-66` currently reduces over **all** events (`:54-56`). Filter to `clicked` first; if empty, use `createdAt` parameter (extend `calculateWarmthScore` signature or accept `{ events, createdAt }`). Change `DECAY.no_penalty_max` usage so penalty starts at **60** full days. Delete or document unused `penalty_max`.
- **T3:** Current `assignTier` `:72-77` returns `null` for any score 0 — that mislabels decayed-to-zero as Unscored. Implement Standing Decision 3. Prefer returning `{ score, hadEngagement, tier }` from a single helper so batch does not recompute engagement flags. Existing test `assignTier(0) → null` at `warmth.test.ts:134-136` must become `assignTier(0, { hadEngagement: true }) → "cold"` and `assignTier(0)` / no engagement → `null`.
- **T4:** Bug at `:123-146`: `referrerIds = subscribers.map(s => s.referrer_id)` then count those referrers’ referrals, then only update page rows — cross-page referrers never get credits. Fix: `.in("referrer_id", pageSubscriberIds)` and count into `Map<referrer_id, n>`. Add `.order("id")` at `:101-104`. Optional: one `.in("id", updates.map(u => u.id))` bulk update per page instead of N sequential updates (`:169-175`).
- **T5:** Update `src/__tests__/lib/warmth.test.ts` in the **same** PR as score changes (do not leave red). Add cases: sent/delivered do **not** reset decay; day 59 no penalty; day 60 −25; decayed engaged zero → cold; never-engaged zero → null; zero-click subscriber with old `created_at` still decays.
- Supabase join/get pattern unchanged; use `createAdminClient()` only inside batch (already).
- Numeric score remains transient — founders still see tier labels only (Standing Decision: no schema change for numeric storage).

---

### Story 15.1 — Daily Cron Schedule (`vercel.json`)

**Status:** ready
**Design Refs:** — (infrastructure)
**Story:** As a platform, I want the daily warmth recalculation cron scheduled in production so that scores refresh without manual runs.

**Acceptance Criteria (EARS):**

- AC1: `vercel.json` shall include a `crons` array entry `{ "path": "/api/cron/warmth", "schedule": "0 5 * * *" }` (UTC daily 05:00) while preserving the existing `git.deploymentEnabled` config.
- AC2: `GET /api/cron/warmth` shall continue to require `Authorization: Bearer ${CRON_SECRET}` and return 401 without it / 500 if `CRON_SECRET` is unset.
- AC3: After deploy to `main`, the founder shall be able to confirm the cron appears in the Vercel dashboard (or `vercel crons ls`) — **manual verification step**, recorded in the story’s implementation notes when done.
- AC4: A manual authenticated invoke of `/api/cron/warmth` on production shall return a JSON body with numeric `processed`, `hot`, `warm`, `cold`, `unscored`.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Add `crons` to `vercel.json` · T2 (AC2) Confirm env/`CRON_SECRET` on Vercel project · T3 (AC3–AC4) Post-deploy manual verification checklist · T4 (AC5) Lint + build

**Out of scope:** Changing cron path, schedule timezone beyond UTC, real-time recalculation, Supabase pg_cron, GitHub Actions schedule.

**Dev Notes:**

- **T1:** Current `vercel.json` is only `git.deploymentEnabled.dev = false`. Add `crons` sibling key; valid JSON.
- **T2:** MEMORY lists `CRON_SECRET` in `.env.local`. Vercel production env may **not** have it — founder must confirm Project → Settings → Environment Variables. Without it, endpoint always 500s.
- **T3:** Verification script for founder:  
  `curl -s -H "Authorization: Bearer $CRON_SECRET" https://www.prewaitlist.com/api/cron/warmth`  
  Expect counts JSON, not 401/500. Compare a known subscriber’s `warmth_score` before/after (SQL or dashboard).
- **T4:** Vercel cron only runs on **production** deploys from `main` — `dev` branch pushes do not schedule runs (`deploymentEnabled.dev: false` aligns with this).
- Endpoint implementation: `src/app/api/cron/warmth/route.ts` (29 lines) — no code change required unless adding structured logs.
- Schedule default locked to `0 5 * * *` UTC (Standing Decision 6).

---

### Story 15.2 — Resend Webhook Ingestion Hardening

**Status:** ready
**Design Refs:** — (API)
**Story:** As a platform, I want Resend webhooks to fail closed with correct status codes, attribute events to the right waitlist subscriber, and never double-insert so warmth inputs stay trustworthy.

**Acceptance Criteria (EARS):**

- AC1: Missing `svix-id` / `svix-timestamp` / `svix-signature` headers shall return **401** (not 400).
- AC2: Invalid signature (verification throws) shall return **401** (not 400).
- AC3: Unknown or unsupported event types shall return **200** `{ received: true }` without inserting (do not force Resend retries for noise).
- AC4: Subscriber resolution shall not use `.limit(1).single()` alone when the same email exists on multiple waitlists; events shall be inserted for **every** matching subscriber row, **or** when send-time `metadata.waitlist_id` / `metadata.subscriber_id` is present, only for that target (metadata preferred when send paths provide it).
- AC5: Duplicate delivery of the same Svix message id shall not create a second `email_events` row for the same waitlist — enforced by application pre-check **and** a unique index on `(waitlist_id, (event_data->>'svix_id'))` where svix id is not null (SQL shipped in this story).
- AC6: Bounce/complaint side effects (`bounced_emails` insert, `unsubscribed_at` update) shall remain tied to the resolved subscriber row(s) as today.
- AC7: Email sends that support metadata (`sendEmail`, broadcast batch, updates batch) **should** pass `metadata: { waitlist_id, subscriber_id }` when known — if any send path cannot pass metadata in this story, AC4’s multi-insert fallback is sufficient; document which paths still lack metadata.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC3) Status codes · T2 (AC4, AC7) Multi-waitlist resolution + optional send metadata · T3 (AC5) SQL unique index writeup + insert conflict handling · T4 (AC6) Preserve bounce/complaint behavior · T5 (AC8) Lint + build

**Out of scope:** Webhook tests (15.5), using opens in scores, inbound `email.received` reply parsing, deleting the public warmth API.

**Dev Notes:**

- **T1–T2:** File `src/app/api/webhooks/resend/route.ts` — change `:42` and `:58` from `400` → `401`. Replace `:81-86` `.limit(1).single()` per Standing Decision / AC4.
- **T3:** SQL file: `docs/stories/sql-writeups/epic15-story2-email-events-svix-unique.sql`:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS email_events_svix_uidx
  ON email_events (waitlist_id, (event_data ->> 'svix_id'))
  WHERE event_data ->> 'svix_id' IS NOT NULL;
```

User runs this in Supabase SQL Editor **before** relying on race-safe idempotency. On Postgres unique violation (23505) in the insert path, catch and return `{ received: true }`. Keep existing jsonb pre-filter for cheap fast path (`:93-102`).

- **T4:** `:116-134` bounce/complaint logic — if multi-insert, apply side effects per subscriber row consistently (waitlist_id on `bounced_emails` must match each row’s waitlist).
- **T5:** `src/lib/email.ts` `sendParams` currently has no `metadata` field (`:166-186`) — add optional metadata when Resend SDK supports it on `emails.send` / `batch.send`. Broadcast: `broadcast/route.ts` batch array; updates: `updates/route.ts`. Partial metadata is acceptable if multi-insert covers attribution.
- Idempotency is **per waitlist + svix id** (same email on two waitlists = two legitimate rows if both targeted; same waitlist = one row).
- Do not re-serialize body; keep `req.text()` before verify (already correct).

---

### Story 15.3 — Segment Counts, Pro Gate & Eligibility

**Status:** ready
**Design Refs:** S5 Segment selector — `docs/design/sprint-3-design-specs.md` §S5
**Story:** As a Pro founder, I want broadcast segment counts scoped to the active waitlist, gated to Pro, and aligned with who can actually receive email so that the compose UI matches the send.

**Acceptance Criteria (EARS):**

- AC1: `GET /api/dashboard/broadcast/segments` shall accept the active waitlist id from the query string (client already sends `wid` / shall accept `wid` and/or `waitlist_id`).
- AC2: Waitlist lookup shall scope to `founder_id = current user` using the provided id (or the founder’s waitlist when id omitted) via `.maybeSingle()` — **not** unscoped `.single()` that 404/500s multi-waitlist founders.
- AC3: Free tier requests shall receive **403** with a JSON error via `requirePro` (same pattern as `broadcast/route.ts:29`), not segment counts.
- AC4: Counts for `all`, `hot_warm`, and `cold` shall exclude subscribers with `unsubscribed_at` set; where bounce data is cheap to join, also exclude bounced emails so UI count ≈ send-time eligible count (`broadcast/route.ts:84+` already filters at send).
- AC5: Response shape shall remain `{ all, hot_warm, cold }` (or document any additive fields) so the broadcast client does not break.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC2) Query param + scoped maybeSingle · T2 (AC3) requirePro · T3 (AC4) Eligibility filters · T4 (AC5–AC6) Contract check + lint/build

**Out of scope:** Changing send algorithm, Warmth page Pro gate, free-tier panel visibility, Growth tier.

**Dev Notes:**

- File: `src/app/api/dashboard/broadcast/segments/route.ts` — current `GET()` has **no** searchParams, `.single()` on waitlists (`:15-19`), no tier check, counts include unsubscribed.
- Import `requirePro` from `@/lib/tier-gating`; load `founder_profiles.tier` like broadcast send route.
- Client already passes waitlist id on related dashboard fetches — verify broadcast client query string and align param name (`wid` vs `waitlist_id`); support both if cheap.
- Bounce exclusion: optional second pass via `bounced_emails` or subscriber email anti-join; if expensive, AC4 allows unsubscribed-only in this story and documents bounce deferred — prefer full alignment when under ~3 head-count queries.
- Keep `Cache-Control` absent or 30s consistent with other dashboard GETs if adding headers.

---

### Story 15.4 — Warmth Display, Copy & Read Path Fixes

**Status:** ready
**Design Refs:** S1 bar layout, S2 warning banner — `docs/design/sprint-3-design-specs.md` §S1–S2; badge colors — `dashboard-design-guide.md`
**Story:** As a founder, I want warmth UI colors, last-engagement data, warning data plumbing, settings helper text, and the warmth summary API to match how scoring actually works.

**Acceptance Criteria (EARS):**

- AC1: Warmth panel Hot bar fill shall be **`bg-accent`** (green, consistent with Hot badge `bg-accent/10 text-accent`); Warm stays `bg-status-warm`; Cold stays `bg-status-cold`; Unscored stays `bg-muted` (Standing Decision 8 — S1’s `bg-status-hot` ASCII is superseded).
- AC2: WarningBanner shall **not** fetch `/api/dashboard/warmth` without `waitlist_id`; either require the `warmthData` prop (dashboard already passes it) and remove the broken fallback, or pass `waitlist_id` when fetching. No path shall call the API in a way that returns 400.
- AC3: `/dashboard/warmth` Last Engagement column shall use the most recent **`clicked`** event timestamp only (not any `email_events` including `sent`/`delivered`).
- AC4: Settings warmth helper text shall describe the **cold percentage warning threshold**, not a per-subscriber score cutoff. **COPY GAP** — proposed string for founder approval:  
  `Warn me when this % or more of your list is Cold. Range: 20–80.`  
  (Label remains `Cold threshold (%)`; default 40; min 20; max 80 unchanged.) Do not ship an invented alternate string.
- AC5: `GET /api/dashboard/warmth` shall compute tier counts without loading every `warmth_score` row into JS when feasible — prefer 4× `count: "exact", head: true` queries + total count; keep auth, owner check, required `waitlist_id`, and 30s cache headers.
- AC6: Optional polish: overview warmth hot number may use `text-accent` instead of `text-status-hot` for consistency with AC1 — same PR if trivial.
- AC7: Free-tier panel still shows counts + “Upgrade to target segments”; `/dashboard/warmth` free path still Pro-gated (no behavior change — regression guard).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Panel bar colors · T2 (AC2) WarningBanner fetch fix · T3 (AC3) Last Engagement click-only · T4 (AC4) Settings helper **COPY GAP** · T5 (AC5–AC6) Warmth API counts + optional stat color · T6 (AC7–AC8) Regression + lint/build

**Out of Scope:** Redesigning panel/banner, free warmth page overlay redesign, drill-through from bars to filtered table, public `/api/warmth/[subdomain]` removal, new negative-signal UI.

**Dev Notes:**

- **T1:** `warmth-panel.tsx:113` and `:167` — replace `bg-status-hot` → `bg-accent`. Do not hardcode hex.
- **T2:** `warning-banner.tsx:38-52` — remove effect fetch **or** require `warmthData` in props interface; `dashboard/client.tsx:483-486` already supplies data. Keep visibility rules: total ≥ 10 and cold% ≥ threshold (`:33-36`).
- **T3:** `warmth/page.tsx:74-84` — filter `event_type === "clicked"` when building `lastEngagement` map.
- **T4:** `settings/client.tsx:335` — replace helperText only after founder approves COPY GAP string (or supplies replacement). Wrong current string documented in audit §2 claim 15.
- **T5:** `dashboard/warmth/route.ts:38-47` full select → head counts; preserve JSON `{ hot, warm, cold, unscored, total }`.
- **T7 regression:** Do not remove free upgrade badge or Pro page gate (`warmth/page.tsx:34-42`).
- No inline styles; Tailwind + tokens only.

---

### Story 15.5 — Epic 15 Tests

**Status:** ready
**Design Refs:** —
**Story:** As a developer, I want automated tests for the warmth pipeline so scoring, scheduling auth, webhook, segments, and panel cannot regress silently.

**Acceptance Criteria (EARS):**

- AC1: Unit tests for scoring/decay/tier shall cover: multi-signal totals; clamp 0/100; **sent/delivered do not reset decay**; day 59 no penalty; day 60 −25; 90+ → 0; engaged score 0 → cold; never-engaged 0 → null; zero-click + old `created_at` still decays; referrals ×15; qual +8.
- AC2: Batch tests shall cover: stable `.order("id")` used; referral counts via `.in("referrer_id", pageIds)` (cross-page referrer credited); multi-page loop terminates; return counters.
- AC3: API tests for `POST /api/webhooks/resend` shall cover: missing headers → **401**; invalid signature → **401**; valid click stores event with correct subscriber/waitlist; duplicate svix id → single row; unknown event type → 200 no insert; unknown email → 200 no fail; multi-waitlist metadata or multi-insert behavior.
- AC4: API tests for `GET /api/cron/warmth` shall cover: missing `CRON_SECRET` → 500; bad bearer → 401; valid bearer invokes batch (mocked) → 200 counts JSON.
- AC5: Component tests for WarmthPanel shall cover: Hot bar class includes `bg-accent`; Warm/Cold/Unscored classes; empty state em-dashes; free tier upgrade badge text.
- AC6: API tests for segments shall cover: missing/unauth → 401; Free → 403; Pro + `wid` → scoped counts; unsubscribed excluded from counts.
- AC7: WarningBanner tests shall cover: hidden below threshold; hidden when total < 10; visible when rules met; no request to warmth API without `waitlist_id` (or no request when prop provided).
- AC8: Lint and build shall pass with zero errors; total suite has **no new failures** beyond baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3 + known flaky `billing.test.ts` in full runs).
- AC9: Net test count shall increase (webhook, cron, batch, segments, panel coverage did not exist).

**Tasks:** T1 (AC1) Warmth unit updates · T2 (AC2) Batch tests · T3 (AC3) Webhook tests · T4 (AC4) Cron tests · T5 (AC5, AC7) Panel + banner tests · T6 (AC6) Segments tests · T7 (AC8–AC9) Full lint/test/build

**Out of scope:** Playwright E2E for cron/Vercel, load tests, testing production-only webhook without mocks.

**Dev Notes:**

- Existing: `src/__tests__/lib/warmth.test.ts` (19) — **must update with 15.0** (can land with 15.0 or 15.5; prefer with 15.0 to keep CI green).
- Create:
  - `src/__tests__/lib/warmth-batch.test.ts` (or extend warmth.test.ts)
  - `src/__tests__/api/webhook-resend.test.ts`
  - `src/__tests__/api/cron-warmth.test.ts`
  - `src/__tests__/api/dashboard-segments.test.ts`
  - `src/__tests__/components/warmth-panel.test.tsx`
  - WarningBanner cases in dashboard tests or new file
- Mock Supabase + `resend.webhooks.verify` + `next/server` `after` (`after: vi.fn((fn) => fn())` — see Epic 13 gotchas).
- Do not use `svix` package mock incorrectly — production uses `resend.webhooks.verify`.
- Fake timers + decay: follow existing `warmth.test.ts` `vi.setSystemTime` pattern; avoid mixing Vitest fake timers with RTL `waitFor` hangs.
- Baseline failures: do not “fix” unrelated archive/subscriber-table tests in this epic unless trivial.

---

### Story 15.6 — Story, Vision, MEMORY & Audit Sync

**Status:** ready
**Design Refs:** — (documentation only)
**Story:** As a team, I want Epic 11 stories, product vision, MEMORY, and the five-engine audit to state the researched truth so future agents do not rebuild dead signals or re-open closed decisions.

**Acceptance Criteria (EARS):**

- AC1: Story 11.1 AC2 shall list only click +5, referral +15, qual +8; AC3/AC5/AC6/AC8 shall match 15.0 tier and cron reality; status/Dev Notes shall not claim unimplemented reply/visit signals.
- AC2: Story 11.2 shall be rewritten so ACs target `/dashboard/warmth` badge + filter (Standing Decision 2); remove references to a subscriber table column between Position and Referrals and to `dashboard/client.tsx` lines 577–595; Dev Notes shall note badge lives in `warmth/client.tsx`.
- AC3: Story 11.5 AC1/AC3 shall agree: last engagement = most recent **clicked** event (or signup fallback); remove the “any email_events” contradiction; “NOT STARTED” annotations shall be cleared where code exists.
- AC4: Story 11.6 AC1 shall say 401 for signature/header failures; AC3–AC5 shall name the test files shipped in 15.5; Story 11.3 AC3/AC6 and Story 11.0 status codes shall be annotated consistent with 15.2–15.4.
- AC5: Product vision Module 3 / Sprint 3 lines that claim **email open tracking is required for Hot / MVP warmth accuracy** shall be amended to state opens are **excluded** due to Apple MPP and that Hot rarity is a weighting concern, not a missing open signal (lines ~150, ~211, ~414, ~477 as applicable).
- AC6: `.memory/MEMORY.md` shall record Epic 15 standing decisions (dropped signals, click-only decay, force-cold-on-engaged-zero, vercel cron, badge-on-warmth-page).
- AC7: `docs/scans/engine-audit-5-engines.md` §2 broken/missing table entries fixed by this epic shall be marked resolved or annotated with story ids; residual out-of-scope items (negative signals, decay floor, public API orphan) shall remain listed as known debt.
- AC8: Epic 11 index statuses that are now factually done+fixed shall be updated without claiming features that do not exist (11.2 remains “done on warmth page only”).
- AC9: Lint and build shall pass with zero errors (docs-only changes still run lint for safety).

**Tasks:** T1 (AC1–AC4) Epic 11 story AC/Dev Note patches · T2 (AC5) Vision amendments · T3 (AC6) MEMORY · T4 (AC7–AC8) Audit §2 + epic-11 index · T5 (AC9) Lint + build

**Out of scope:** Rewriting PRD REQ text beyond warmth accuracy claims if redundant with vision; deleting old completed story files; new marketing copy.

**Dev Notes:**

- **T1 paths:** `docs/stories/completed/story-11.1-warmth-calculation.md`, `story-11.2-warmth-column-filter.md`, `story-11.5-warmth-decay.md`, `story-11.6-epic-11-tests.md`, `story-11.0-resend-webhook.md`, `story-11.3-warmth-distribution-panel.md`.
- **T2 paths:** `docs/product-vision-mvp-waitlist-tool.md` — Module 3 row ~150 (opens), Sprint 3 goals ~414/477, feature table ~211.
- **T3:** Append dated Epic 15 decisions block; do not delete Sprint 3 historical decisions (60-day decay, blue=cold, MPP excludes opens) — reinforce.
- **T4:** Audit section header already says verified rescan — flip 🔴/❌ findings addressed by 15.0–15.4 to ✅ with story refs when 15.5 green; leave negatives/90-day floor/public API as 🟡 known debt.
- Doc-only epic: no production runtime change in 15.6.
- Anchor note: Epic 11 file lives under `docs/epics/completed/epic-11-warmth-tracking.md`.
