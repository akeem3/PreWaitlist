# Story 16.3 — Founder Updates Tests

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** 16.0, 16.1, 16.2
**Design Refs:** —
**Source:** [Audit §4.5](../scans/engine-audit-5-engines.md), [Story 12.1.10 AC5](../stories/completed/story-12.1.10-epic-tests.md), Resend Batch API max 100

## Story

As a developer, I want API and compose-flow tests for founder updates so batch-cap, suppression, validation, multi-waitlist, and honest-status behavior cannot regress silently.

## Acceptance Criteria (EARS)

- AC1: API tests for `POST /api/updates` shall cover: unauthenticated → **401**; Free tier → **403**; body `< 10` chars → **400**; empty body → **400**; body `> 2000` → **400**; missing `waitlist_id` + multi-waitlist founder → **400**; missing `waitlist_id` + single waitlist → success path.
- AC2: API tests shall assert chunking: given 250 eligible subscribers, `resend.batch.send` is called **3 times** with payload lengths ≤100 each (not once with 250) — Standing Decision U3 regression lock.
- AC3: API tests shall assert suppression: subscriber with `unsubscribed_at` set and subscriber email in `bounced_emails` are excluded from the send payload; unsubscribed/bounced addresses do not appear in any `batch.send` argument.
- AC4: API tests shall assert HTML escaping: body containing `<script>` or `&` is escaped in generated HTML (raw payload does not contain unescaped attacker tags).
- AC5: API tests shall assert success response includes `emailSent: true` and `sent_at` update attempted; total send failure path returns `emailSent: false` (mock `batch.send` throw/error) and `sent_at` not set.
- AC6: Compose component tests (Story 12.1.10 AC5 — currently missing) shall cover: publish click calls `fetch` with `waitlist_id`; success shows success treatment and clears textarea when `emailSent: true`; failure shows non-success outcome when `emailSent: false`; API error path shows `data.error`.
- AC7: Component tests shall cover `LatestUpdateCard` dark vs light template class assertions (Story 16.2).
- AC8: Stale test fixtures (`waitlistName`, `logoUrl` in `dashboard-updates-compose.test.tsx` `baseProps`) shall be removed or aligned to the real component interface.
- AC9: Lint and build shall pass with zero errors; full suite has **no new failures** beyond baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3 + flaky `billing.test.ts` in full runs).
- AC10: Net test count shall increase vs pre-epic baseline (zero API update tests exist today).

## Tasks

- T1 (AC1) API validation/auth/tier tests
- T2 (AC2–AC5) chunk/suppress/escape/sent_at tests
- T3 (AC6) compose flow tests
- T4 (AC7–AC8) card tests + fixture cleanup
- T5 (AC9–AC10) full suite + count

## Out of Scope

- Playwright E2E against live Resend
- Load/stress testing
- Fixing unrelated baseline failures (`dashboard-archive`, `dashboard-subscriber-table`, flaky `billing`)

## Dev Notes

### Existing coverage → target

| File                                                          | Today                                                                   | After 16.3                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/__tests__/components/dashboard-updates-compose.test.tsx` | 6 render-only; stale `waitlistName`/`logoUrl` props; no userEvent/fetch | + fetch mock, success/failure/error AC6; fixtures fixed (AC8) |
| `src/__tests__/components/latest-update-card.test.tsx`        | 3; no dark                                                              | + dark/light class tests (AC7)                                |
| `src/__tests__/api/updates.test.ts` (new)                     | **does not exist**                                                      | AC1–AC5                                                       |

### T1–T2 — API test skeleton

```ts
// src/__tests__/api/updates.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      ({ body, status: init?.status ?? 200 }) as Response,
  },
  // if route imports NextRequest only as type, fine
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdmin),
}));

vi.mock("@/lib/resend", () => ({
  resend: {
    batch: { send: vi.fn(async () => ({ error: null })) },
  },
}));

vi.mock("@/lib/tier-gating", () => ({
  requirePro: vi.fn((tier: string) =>
    tier === "pro"
      ? { allowed: true }
      : { allowed: false, reason: "Pro required" }
  ),
}));

// mock bounces, unsubscribe as needed
```

**Mock Supabase chains** used by route after 16.0:

- `auth.getUser` → user or error
- `founder_profiles` select tier → `maybeSingle`
- `waitlists` select … `eq founder_id` [optional `eq id`] → array (length 0/1/2 fixtures)
- `founder_updates` insert → `{ id, created_at }`
- `subscribers` select with unsub filter → list
- `bounced_emails` select → list (via `isEmailBounced` mock or real helper with mocked admin)
- `founder_updates` update `sent_at`

**Chunk test (AC2):** mock 250 emails eligible; expect `batch.send` `toHaveBeenCalledTimes(3)` and each call's array length `≤ 100` (100+100+50).

**Escape test (AC4):** body `<img src=x onerror=alert(1)>` → serialized HTML argument to `batch.send` contains `&lt;img` and not raw `<img`.

**emailSent (AC5):** `batch.send` mock resolves `{ error: { message: "fail" } }` for all chunks → `emailSent: false`; assert `founder_updates.update` **not** called with `sent_at` (or called zero times).

### T3 — compose flow (AC6)

```ts
import userEvent from "@testing-library/user-event";

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    ok: true,
    json: async () => ({ id: "u1", emailSent: true }),
  }))
);

// type 10+ chars, click Publish, expect fetch called with waitlist_id in body
// emailSent: false fixture → expect failure copy constant / not "Published!"
// ok: false, json { error: "..." } → expect error text
```

Use `@testing-library/user-event` (project standard). Avoid mixing Vitest fake timers with RTL `waitFor` (MEMORY gotcha) — prefer `await screen.findByText` with real timers.

### T4 — card + fixtures (AC7–AC8)

- Dark: assert `bg-dark-template-bg` on card root; light: assert `bg-card` and **not** dark class.
- `baseProps` → `{ updates: [] }` only (drop `waitlistName`, `logoUrl`).

### T5 — verification

```bash
pnpm lint
pnpm test
pnpm build
```

Record net test delta (AC10). Do not weaken assertions to green-light baseline failures.

## Files to Create/Modify

| File                                                          | Change                       |
| ------------------------------------------------------------- | ---------------------------- |
| `src/__tests__/api/updates.test.ts`                           | **New** — AC1–AC5            |
| `src/__tests__/components/dashboard-updates-compose.test.tsx` | Flow tests + fixture cleanup |
| `src/__tests__/components/latest-update-card.test.tsx`        | Dark/light                   |

## Risk

- Over-mocking Supabase query builder chains — keep a small helper `chainable()` used by other API tests if present; mirror `supabase-mock` patterns from Epic 8/13.
- `NextResponse.json` mock must preserve `status` for `res.ok` checks if tests call the route function directly; if tests go through `fetch` of client only, API tests import `POST` from route module.
