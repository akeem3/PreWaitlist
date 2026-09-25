# Story 15.3 — Segment Counts, Pro Gate & Eligibility

**Status:** done
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** — (uses `warmth_score` as stored; benefits from 15.0 for correct tiers)
**Design Refs:** S5 Segment selector — `docs/design/sprint-3-design-specs.md` §S5
**Source:** [Audit §2 claim 19](../scans/engine-audit-5-engines.md), broadcast send path `broadcast/route.ts`

## Story

As a Pro founder, I want broadcast segment counts scoped to the active waitlist, gated to Pro, and aligned with who can actually receive email so that the compose UI matches the send.

## Acceptance Criteria (EARS)

- AC1: `GET /api/dashboard/broadcast/segments` shall accept the active waitlist id from the query string (support `wid` and/or `waitlist_id`).
- AC2: Waitlist lookup shall scope to `founder_id = current user` using the provided id (or the founder’s waitlist when id omitted) via `.maybeSingle()` — not unscoped `.single()` that fails multi-waitlist founders.
- AC3: Free tier requests shall receive **403** JSON via `requirePro`, not segment counts.
- AC4: Counts for `all`, `hot_warm`, and `cold` shall exclude `unsubscribed_at` set; where bounce data is cheap, also exclude bounced emails so UI ≈ send-time eligible count.
- AC5: Response shape shall remain `{ all, hot_warm, cold }` (additive fields only if documented) so the broadcast client does not break.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC2) Query param + scoped `.maybeSingle()`
- T2 (AC3) `requirePro` Free → 403
- T3 (AC4) Eligibility filters (unsub + bounce)
- T4 (AC5–AC6) Contract check + lint/build

## Out of Scope

- Changing send algorithm or confirmation copy
- Warmth page Pro gate / free panel visibility (15.4 guards regression only)
- Growth tier
- Caching headers unless trivial consistency

## Dev Notes

### Current code (`src/app/api/dashboard/broadcast/segments/route.ts`)

```ts
export async function GET() {
  // no searchParams
  // ...
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single(); // BUG multi-waitlist; ignores active wid

  // three head counts — include unsubscribed; no requirePro
}
```

Send path for comparison: `broadcast/route.ts` — `requirePro` at `:29`, warmth filter `:69-72`, unsub/bounced skip `:84-89`.

### T1 — Request shape

```ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wid = searchParams.get("wid") ?? searchParams.get("waitlist_id");
  // ...
  let query = supabase
    .from("waitlists")
    .select("id, founder_id")
    .eq("founder_id", user.id);
  if (wid) query = query.eq("id", wid);
  const { data: waitlist } = await query.maybeSingle();
  if (!waitlist) return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
```

Match client: verify broadcast compose fetch URL param name; support both `wid` and `waitlist_id`.

### T2 — Pro gate

```ts
import { requirePro } from "@/lib/tier-gating";

const { data: profile } = await supabase
  .from("founder_profiles")
  .select("tier")
  .eq("id", user.id)
  .maybeSingle();

const tierCheck = requirePro(profile?.tier ?? "free", "Broadcast");
if (tierCheck) {
  return NextResponse.json({ error: tierCheck.error }, { status: 403 });
}
```

Mirror `broadcast/route.ts:29` error body shape if the client expects `{ error }`.

### T3 — Eligibility (AC4)

Per tier count, add:

```ts
.is("unsubscribed_at", null)
```

**Bounce exclusion options:**

1. **Preferred if cheap:** left-join or second query on `bounced_emails` for waitlist emails, `.not("email", "in", (...bounced))` — only if bounce list small; else:
2. Count from `subscribers` then subtract bounced unique emails for that waitlist (two queries).

Document chosen approach in Implementation Status. Minimum AC4: unsubscribed excluded; bounce “where cheap” is the stretch — implement bounce if under ~100 lines.

Do **not** change response keys (AC5): `{ all, hot_warm, cold }`.

### T4 — Commands

```bash
pnpm lint
pnpm build
```

Tests: Story 15.5 `dashboard-segments.test.ts`.

## Files to Create/Modify

| File                                                | Change                  |
| --------------------------------------------------- | ----------------------- |
| `src/app/api/dashboard/broadcast/segments/route.ts` | Main change             |
| Broadcast client (if param name mismatch)           | Align query string only |

## Implementation Status

**Status: DONE (2026-09-25)**

| AC                      | Status | Evidence                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 query param         | ✅     | `segments/route.ts` reads `wid` ?? `waitlist_id`; client now fetches `?wid=${waitlistId}` (`broadcast/client.tsx` — prop existed at `:16`, was never destructured/fetched)                                                                                                                                                                                                              |
| AC2 maybeSingle + wid   | ✅     | founder-scoped `.eq("founder_id", user.id)` + conditional `.eq("id", wid)` → `.maybeSingle()` → 404 on null (no more unscoped `.single()`)                                                                                                                                                                                                                                              |
| AC3 Free 403            | ✅     | `requirePro(profile?.tier ?? "free", "Broadcast")` → `if (!tierCheck.allowed)` → 403 `{ error: tierCheck.reason }` — mirrors the real guard at `broadcast/route.ts:29-31` (story snippet's `if (tierCheck)` was always-true; `.error` doesn't exist). **Audit fix:** tier gate ordered _before_ the waitlist lookup so Free always gets 403 (never 404), matching broadcast route order |
| AC4 unsub/bounce filter | ✅     | `.is("unsubscribed_at", null)` on all 3 counts; active bounce list mirrors `isEmailBounced()` (hard = always, soft = 24h) applied via `.not("email","in",…)` when ≤ `BOUNCE_FILTER_MAX` (200 — encoded-list URL safety); above threshold → unsub-only (fallback documented)                                                                                                             |
| AC5 response shape      | ✅     | `{ all, hot_warm, cold }` unchanged (keys verified against client `counts` usage)                                                                                                                                                                                                                                                                                                       |
| AC6 Lint + build        | ✅     | `pnpm lint` 0 errors / 5 warnings (baseline), `pnpm build` exit 0, full suite 496 passed / 7 failed (= baseline)                                                                                                                                                                                                                                                                        |
