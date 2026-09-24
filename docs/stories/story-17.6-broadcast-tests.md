# Story 17.6 — Broadcast Tests

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** 17.0, 17.1, 17.2, 17.3, 17.5
**Design Refs:** — (tests)
**Source:** [Audit §5 zero send-path tests](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B1/B4/B9](../epics/epic-17-broadcast-engine-fix.md), Testing infrastructure (Vitest + happy-dom + RTL)

## Story

As a platform, I want automated coverage of the broadcast send path so the `waitlist_id` class of bug cannot ship again.

## Acceptance Criteria (EARS)

- AC1: API tests for `POST /api/dashboard/broadcast` shall cover: **401** unauthenticated; **403** free tier; **400** missing `waitlist_id`; **400** subject/body empty or over length caps; **404** waitlist not found/not owner; happy path with mocked Resend success asserting **`waitlist_id` accepted**, chunking call count for >100 eligible, idempotency key present on batch calls; **total failure** (all batches error) asserting non-`ok:true` / non-2xx per B4; unsubscribed/bounced excluded from `to` recipients.
- AC2: API tests for `GET .../segments` shall cover: 401; 403 free; `?wid=` scoped success; missing wid + multi-waitlist → 400 (or documented fallback); counts exclude unsubscribed (and bounced if fixture present); response shape `{ all, hot_warm, cold }`.
- AC3: Client tests for `BroadcastClient` shall cover: POST body **includes `waitlist_id`**; segments fetched with `?wid=`; confirm/send labels use eligible count; success vs failure rendering (ok true vs false/non-2xx); default segment `"all"`; subject/body length disable.
- AC4: Unit tests for `sanitizeEmailHtml` (AC set in Story 17.5) and, if extracted, eligibility/count helpers.
- AC5: Fake `unsubscribe-page.test.tsx` (literal markup, no component import) shall be **replaced or deleted** in favor of a test that imports the real page/component behavior — or explicitly skipped with a comment linking to a follow-up; no false-confidence suite remains attributed to broadcast compliance.
- AC6: `pnpm test` shall pass with **no new failures** beyond baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3; flaky `billing.test.ts` ignored in full-suite noise). Lint and build zero errors.

## Tasks

- T1 (AC1) POST route tests
- T2 (AC2) segments tests
- T3 (AC3) client tests
- T4 (AC4–AC5) sanitize + unsubscribe page test hygiene
- T5 (AC6) full test/lint/build gate

## Out of Scope

- E2E Playwright (optional later)
- Real Resend API calls
- Epic 15 warmth math tests
- Fixing pre-existing `dashboard-archive` / `dashboard-subscriber-table` failures (baseline — do not fix here)

## Dev Notes

### Test file targets

| File                                                          | Covers       |
| ------------------------------------------------------------- | ------------ |
| `src/__tests__/api/broadcast.test.ts`                         | AC1 POST     |
| `src/__tests__/api/broadcast-segments.test.ts`                | AC2 segments |
| `src/__tests__/components/broadcast-client.test.tsx`          | AC3 client   |
| `src/__tests__/lib/sanitize-email.test.ts`                    | AC4 sanitize |
| Existing `src/__tests__/components/unsubscribe-page.test.tsx` | AC5 hygiene  |

### T1 — POST route tests (AC1)

Follow existing `src/__tests__/api/*` patterns; mock `next/server` `NextRequest`; mock `@/lib/resend` `batch.send`; mock supabase like other API tests. Epic 13 gotcha: `after: vi.fn((fn) => fn())` if `after` used.

| Case                                  | Assert                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| no session                            | 401                                                                                                |
| free tier                             | 403                                                                                                |
| missing `waitlist_id`                 | 400                                                                                                |
| subject > 200 / body > 10_000 / empty | 400                                                                                                |
| not owner / missing waitlist          | 404                                                                                                |
| happy path                            | mocked batch called; payload used waitlist; chunk count for >100 eligible; idempotency key present |
| all batches fail                      | **not** `ok: true` — non-2xx or `{ ok: false, recipient_count: 0 }` (B4)                           |
| unsub + bounced                       | excluded from `to` list                                                                            |

### T2 — segments tests (AC2)

| Case                            | Assert                            |
| ------------------------------- | --------------------------------- |
| no session                      | 401                               |
| free                            | 403                               |
| `?wid=` owned                   | 200 scoped counts                 |
| 2+ waitlists, no wid            | 400                               |
| foreign / missing wid           | 404                               |
| fixture with unsub (and bounce) | counts exclude them               |
| shape                           | `{ all, hot_warm, cold }` numbers |

### T3 — client tests (AC3)

**Critical regression lock:** test fails if `waitlist_id` removed from POST body (audit §5 claim 1).

- POST body includes `waitlist_id`
- fetch called with `segments?wid=`
- pill / confirm / send label = eligible count
- success on `{ ok: true, recipient_count }`; error UI on `ok: false` / non-2xx
- default segment `"all"`
- over-cap subject/body disables Send

### T4 — sanitize + unsubscribe hygiene (AC4–AC5)

- `sanitize-email.test.ts`: strip script/onclick; preserve strong/a/p (17.5 AC2).
- **AC5:** `unsubscribe-page.test.tsx` currently literal markup without importing component — replace with real import test, delete, or skip with follow-up comment. No false-confidence suite attributed to broadcast compliance.

### T5 — gate (AC6)

```
pnpm test        # no NEW failures beyond baseline (4+3; billing flaky ok in full)
pnpm lint        # 0 errors, 5 pre-existing warnings
pnpm build       # 0 errors
```

Targeted: `pnpm test broadcast` / sanitize / client files.

### Implementation order inside story

1. T1 POST tests (locks B1/B4)
2. T2 segments tests
3. T3 client tests
4. T4 sanitize + unsubscribe hygiene
5. T5 full suite + lint + build

## Files to Create/Modify

| File                                                 | Change                    |
| ---------------------------------------------------- | ------------------------- |
| `src/__tests__/api/broadcast.test.ts`                | New — AC1                 |
| `src/__tests__/api/broadcast-segments.test.ts`       | New — AC2                 |
| `src/__tests__/components/broadcast-client.test.tsx` | New — AC3                 |
| `src/__tests__/lib/sanitize-email.test.ts`           | New — AC4                 |
| `src/__tests__/components/unsubscribe-page.test.tsx` | Replace/delete/skip — AC5 |

## Risk

- Mock fidelity: segments POST may need admin client mock for `bounced_emails`.
- Idempotency key assertion depends on 17.0 SDK option name — align with implementation.
- Baseline failures must not increase — document count before/after.
- AC5 touches unsubscribe test outside broadcast core — keep change minimal (hygiene only).
