# Story 15.5 — Epic 15 Tests

**Status:** done
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** 15.0, 15.1, 15.2, 15.3, 15.4 (test the shipped behavior; unit tests for 15.0 may land earlier with that story)
**Design Refs:** —
**Source:** [Audit §2 §2.5 tests inventory](../scans/engine-audit-5-engines.md), [Story 11.6](completed/story-11.6-epic-11-tests.md)

## Story

As a developer, I want automated tests for the warmth pipeline so scoring, scheduling auth, webhook, segments, and panel cannot regress silently.

## Acceptance Criteria (EARS)

- AC1: Unit tests for scoring/decay/tier shall cover: multi-signal totals; clamp 0/100; **sent/delivered do not reset decay**; day 59 no penalty; day 60 −25; 90+ → 0; engaged score 0 → cold; never-engaged 0 → null; zero-click + old `created_at` still decays; referrals ×15; qual +8.
- AC2: Batch tests shall cover: stable `.order("id")` used; referral counts via `.in("referrer_id", pageIds)` (cross-page referrer credited); multi-page loop terminates; return counters.
- AC3: API tests for `POST /api/webhooks/resend` shall cover: missing headers → **401**; invalid signature → **401**; valid click stores event with correct subscriber/waitlist; duplicate svix id → single row; unknown event type → 200 no insert; unknown email → 200 no fail; multi-waitlist metadata or multi-insert behavior.
- AC4: API tests for `GET /api/cron/warmth` shall cover: missing `CRON_SECRET` → 500; bad bearer → 401; valid bearer invokes batch (mocked) → 200 counts JSON.
- AC5: Component tests for WarmthPanel shall cover: Hot bar class includes `bg-accent`; Warm/Cold/Unscored classes; empty state em-dashes; free tier upgrade badge text.
- AC6: API tests for segments shall cover: unauth → 401; Free → 403; Pro + `wid` → scoped counts; unsubscribed excluded from counts.
- AC7: WarningBanner tests shall cover: hidden below threshold; hidden when total < 10; visible when rules met; no request to warmth API without `waitlist_id` (or no request when prop provided).
- AC8: Lint and build shall pass with zero errors; full suite has **no new failures** beyond baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3 + flaky `billing.test.ts` in full runs).
- AC9: Net test count shall increase (webhook, cron, batch, segments, panel coverage did not exist).

## Tasks

- T1 (AC1) Warmth unit test updates (if not done in 15.0)
- T2 (AC2) Batch tests
- T3 (AC3) Webhook tests
- T4 (AC4) Cron tests
- T5 (AC5, AC7) Panel + WarningBanner tests
- T6 (AC6) Segments tests
- T7 (AC8–AC9) Full lint/test/build + count

## Out of Scope

- Playwright E2E against live Vercel cron/webhooks
- Load/stress testing
- Fixing unrelated baseline failures unless trivial

## Dev Notes

### Existing coverage

| File                                                      | Today                                                         | After Epic 15                                     |
| --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| `src/__tests__/lib/warmth.test.ts`                        | 19 tests; old tier-0 → null; no day-59; no sent-ignored decay | Updated per AC1                                   |
| `src/__tests__/components/dashboard-warmth-page.test.tsx` | 13 — WarmthClient                                             | Keep; extend filter/badge if gaps                 |
| `src/__tests__/api/warmth.test.ts`                        | 4 — public orphan API                                         | Leave (out of scope to delete)                    |
| `src/__tests__/components/dashboard-tier-gating.test.tsx` | WarmthPanel free/pro                                          | May overlap AC5 — extend classes or separate file |
| Webhook / cron / batch / segments / dedicated panel       | **Missing**                                                   | Create below                                      |

### T1 — Unit examples (AC1)

```ts
// decay ignores sent/delivered
const events = [
  { event_type: "clicked", created_at: daysAgo(70) },
  { event_type: "sent", created_at: daysAgo(0) },
];
// expect -25 applied → sent does not refresh clock

// day 59 free, day 60 penalty
calculateWarmthScore([clicked 59d], 0, false, daysAgo(59)) // no -25
calculateWarmthScore([clicked 60d], 0, false, daysAgo(60)) // -25

// tier
assignTier(0, true)  // "cold"
assignTier(0, false) // null
assignTier(0)        // null if optional arg omitted — document
```

Use existing `vi.useFakeTimers` + `setSystemTime` pattern (`warmth.test.ts:11-18`). Do not combine fake timers with RTL `waitFor` (project gotcha).

### T2 — Batch tests (AC2)

Mock `createAdminClient` chain:

- `.from().select().order().range()` → two pages then short page
- Assert `order` called with `"id", { ascending: true }`
- Assert `.in("referrer_id", [pageIds])` receives **page member ids**
- Referrer on page 1 with referral on page 2 → refCount 1
- Return `{ processed, hot, warm, cold, unscored }` sums match rows

### T3 — Webhook tests (AC3)

**New:** `src/__tests__/api/webhook-resend.test.ts`

Mock:

- `resend.webhooks.verify` — throw vs return `{ type, data, created_at }`
- `createAdminClient` — select/insert filters
- `after` from `next/server`: `after: vi.fn((fn) => fn())` (Epic 13 gotcha — must run sync)

Cases:

1. Missing headers → 401
2. verify throws → 401
3. `email.clicked` + known email → insert with `event_type: "clicked"`, `svix_id` in `event_data`
4. Duplicate svix_id → one insert (pre-filter returns existing)
5. `email.spam` / unknown → 200 `{ received: true }`, no insert
6. Unknown email → 200, no throw
7. Multi-waitlist: two subscriber rows same email → two inserts (or metadata single-target)

Build `NextRequest` with headers `svix-id`, `svix-timestamp`, `svix-signature`.

### T4 — Cron tests (AC4)

**New:** `src/__tests__/api/cron-warmth.test.ts`

```ts
// no secret
process.env.CRON_SECRET = undefined → GET → 500

// bad auth
process.env.CRON_SECRET = "s3cret";
GET with Authorization: Bearer wrong → 401

// success
vi.mock("@/lib/warmth", () => ({
  batchRecalculateWarmth: vi.fn(async () => ({
    processed: 1, hot: 0, warm: 1, cold: 0, unscored: 0,
  })),
}));
GET with Bearer s3cret → 200 + body
```

### T5 — Panel + Banner (AC5, AC7)

**New:** `src/__tests__/components/warmth-panel.test.tsx`

- Render with `warmthData={{ hot:1, warm:2, cold:3, unscored:4, total:10 }}`
- Hot bar `className` contains `bg-accent` (not `bg-status-hot`)
- Warm/Cold/Unscored classes
- total 0 → em-dash values
- `tier="free"` → text `Upgrade to target segments`
- Free still shows counts (AC7 / Standing Decision 9)

**WarningBanner** (extend dashboard tests or `warning-banner.test.tsx`):

- total 5 → hidden even if 100% cold
- total 10, cold 3, threshold 40 → hidden (30% < 40)
- total 10, cold 4, threshold 40 → visible
- When `warmthData` provided, `fetch` not called (spy)

### T6 — Segments (AC6)

**New:** `src/__tests__/api/dashboard-segments.test.ts`

Mock auth user + profile tier + waitlists + counts.

- No session → 401
- Free tier → 403
- Pro + `?wid=` → `.eq("id", wid)` + founder scope; response keys `all|hot_warm|cold`
- Subscriber with `unsubscribed_at` not included in counts

### T7 — Full verification

```bash
pnpm lint
pnpm test
pnpm build
```

Record final test total in Implementation Status. Baseline known failures only — any **new** failure is a release blocker for the epic.

## Files to Create/Modify

| File                                               | Action       |
| -------------------------------------------------- | ------------ |
| `src/__tests__/lib/warmth.test.ts`                 | Update (AC1) |
| `src/__tests__/lib/warmth-batch.test.ts`           | Create (AC2) |
| `src/__tests__/api/webhook-resend.test.ts`         | Create (AC3) |
| `src/__tests__/api/cron-warmth.test.ts`            | Create (AC4) |
| `src/__tests__/components/warmth-panel.test.tsx`   | Create (AC5) |
| `src/__tests__/components/warning-banner.test.tsx` | Create (AC7) |
| `src/__tests__/api/dashboard-segments.test.ts`     | Create (AC6) |

## Implementation Status

**Status: IMPLEMENTED — all ACs green** (executed + verified 2026-09-25)

| AC                      | Status | Evidence                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 Unit decay/tier     | ✅     | `warmth.test.ts` — 29 tests verified against all 11 AC1 items (multi-signal, clamps, sent/delivered-ignored, day 59/60, 90+, engaged-0→cold, never-engaged→null, zero-click decay, ×15, +8); complete since 15.0 — no additions needed                                                                                  |
| AC2 Batch               | ✅     | `warmth-batch.test.ts` — 5 tests verified against AC2 (order("id") before range, `.in("referrer_id", pageIds)` direction, multi-page termination 501 processed, return counters); complete since 15.0                                                                                                                   |
| AC3 Webhook             | ✅     | **New** `src/__tests__/api/webhook-resend.test.ts` — 7/7: missing headers 401, bad sig 401, valid click insert (`svix_id`, subscriber/waitlist, created_at), dup svix → 0 inserts, unknown type 200/no calls, unknown email 200/no insert, multi-waitlist → 2 inserts. `after()` runs sync; mock queue drains via flush |
| AC4 Cron                | ✅     | **New** `src/__tests__/api/cron-warmth.test.ts` — 3/3: unset `CRON_SECRET` → 500 (+ batch not called), bad bearer → 401, valid bearer → 200 counts + batch called once                                                                                                                                                  |
| AC5 Panel               | ✅     | **New** `src/__tests__/components/warmth-panel.test.tsx` — 5/5: Hot fill `bg-accent` + not `bg-status-hot`, Warm/Cold/Unscored classes, 0-total → 4 em-dashes, free badge text, free counts (AC7 guard)                                                                                                                 |
| AC6 Segments            | ✅     | **New** `src/__tests__/api/dashboard-segments.test.ts` — 4/4: 401 no session, Free → 403 **before waitlist lookup** (locks audit fix), Pro+wid → founder/wid scoped counts + exact keys, `.is(unsubscribed_at,null)` ×3 on all counts                                                                                   |
| AC7 Banner              | ✅     | **New** `src/__tests__/components/warning-banner.test.tsx` — 5/5: hidden total<10 at 100% cold, hidden 30%<40, visible 40%≥40 (S2 copy), fetch stub never called with data, render-null + no fetch without prop                                                                                                         |
| AC8 Lint/build/baseline | ✅     | lint 0 errors / 5 warnings (baseline); tsc 63 = baseline, **0 in touched/new files**; build exit 0; full suite **520 passed / 7 failed of 527** — failures = exact baseline (dashboard-archive 4 + dashboard-subscriber-table 3), zero new                                                                              |
| AC9 Count increase      | ✅     | 503 → **527** tests (+24: webhook 7, cron 3, panel 5, banner 5, segments 4). Also: shared mock helper extended with `.is`/`.filter` (needed by webhook + segments chains)                                                                                                                                               |

**Notes:**

- AC1/AC2 shipped with 15.0 (`warmth.test.ts` 29, `warmth-batch.test.ts` 5) — verified line-by-line against AC checklists this story; no gaps found.
- Files table rows `warmth.test.ts` (Update) and `warmth-batch.test.ts` (Create) were **already satisfied by 15.0** — annotated here instead of re-doing them.
