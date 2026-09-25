# Story 17.1 — Segments API: wid, Pro gate, eligible counts

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** —
**Design Refs:** — (API only; no SVG)
**Source:** [Audit §5 Broadcasting](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B2/B3](../epics/epic-17-broadcast-engine-fix.md), [PRD L123 Broadcast defaults](../PRD.md), Klaviyo expected-recipient count UX

## Story

As a Pro founder with one or more waitlists, I want segment counts for the waitlist I’m editing to match who will actually receive email — so the confirm dialog and pills are truthful.

## Acceptance Criteria (EARS)

- AC1: `GET /api/dashboard/broadcast/segments` shall accept optional query param **`wid`** (waitlist id). When present, the waitlist shall be loaded with `.eq("id", wid).eq("founder_id", user.id)` and **`.maybeSingle()`**; when absent, resolve founder’s waitlist(s) without `.single()` throwing on 2+ rows — if 2+ and no `wid`, return **400** (explicit multi-waitlist, matching Updates Story 16.0 pattern). Missing/foreign waitlist → **404**.
- AC2: The endpoint shall enforce **`requirePro`** (or equivalent tier check) and return **403** for Free tier (Standing Decision B2 / audit §5 claim 7). Auth without session → **401**.
- AC3: Each of `all`, `hot_warm`, `cold` counts shall equal the number of subscribers in that warmth partition **who are eligible to receive email**: `unsubscribed_at IS NULL` **and** email not in `bounced_emails` for that waitlist (Standing Decision B3). Warmth partition rules unchanged: `hot_warm` = warmth_score in (hot, warm); `cold` = warmth_score = cold; `all` = all subscribers (including unscored) then eligibility-filtered.
- AC4: Response shape shall remain `{ all: number, hot_warm: number, cold: number }` (client dependency Story 17.2).
- AC5: Lint and build shall pass with zero errors.

> **Dev Notes (2026-09-25 — warmth restructure):** AC3's "`all` = all subscribers (including unscored)" clause is superseded — there is no unscored partition; `all` = all subscribers then eligibility-filtered. Original AC text retained above for history. **[AMENDED 2026-09-25]**

## Tasks

- T1 (AC1) wid + maybeSingle / multi-waitlist 400
- T2 (AC2) requirePro
- T3 (AC3–AC4) eligible counts + response shape
- T4 (AC5) Lint + build

## Out of Scope

- Send path (Story 17.0)
- Client UI (Story 17.2)
- Warmth score calculation correctness (Epic 15)
- Broadcast history

## Dev Notes

### Primary file — `src/app/api/dashboard/broadcast/segments/route.ts`

Current defects (audit §5 claim 2, 7):

| Line(s) | Defect                                                                                        |
| ------- | --------------------------------------------------------------------------------------------- |
| 15–19   | `.single()` on waitlists → 400/throw when founder has 2+ waitlists; ignores `?wid=`           |
| 4–47    | auth only — **no `requirePro`** — Free tier can read counts                                   |
| 25–40   | raw `count` including unsubscribed/bounced → UI count ≠ send-time eligible (Klaviyo mismatch) |

### T1 — wid + resolution (AC1)

Page already reads `?wid=` (`page.tsx:32-42`); sidebar attaches it. Endpoint must honor it:

```ts
const { searchParams } = new URL(req.url);
const wid = searchParams.get("wid");

let q = supabase.from("waitlists").select("id").eq("founder_id", user.id);

if (wid) q = q.eq("id", wid);

const { data: rows } = await q;
if (!rows || rows.length === 0) {
  return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
}
if (!wid && rows.length > 1) {
  return NextResponse.json(
    { error: "wid is required when multiple waitlists exist" },
    { status: 400 }
  );
}
const waitlistId = rows[0].id;
```

Or `.maybeSingle()` when `wid` present. Ownership always `.eq("founder_id", user.id)`.

### T2 — requirePro (AC2)

Import from `src/lib/tier-gating.ts` same as POST route (`broadcast/route.ts:29-32`):

```ts
const pro = await requirePro(user.id); // or equivalent
if (!pro) {
  return NextResponse.json({ error: "Pro required" }, { status: 403 });
}
```

Auth 401 stays first.

### T3 — eligible counts (AC3–AC4)

Current: count per warmth partition on full subscriber set. Required: filter eligibility first (or filter after fetch).

```ts
const { data: subscribers } = await supabase
  .from("subscribers")
  .select("email, warmth_score, unsubscribed_at")
  .eq("waitlist_id", waitlistId);

const { data: bounced } = await adminSupabase
  .from("bounced_emails")
  .select("email")
  .eq("waitlist_id", waitlistId);
const bouncedSet = new Set((bounced ?? []).map((b) => b.email));

const eligible = (subscribers ?? []).filter(
  (s) => !s.unsubscribed_at && !bouncedSet.has(s.email)
);

const all = eligible.length;
const hot_warm = eligible.filter(
  (s) => s.warmth_score === "hot" || s.warmth_score === "warm"
).length;
const cold = eligible.filter((s) => s.warmth_score === "cold").length;

return NextResponse.json({ all, hot_warm, cold });
```

Partitions unchanged; `all` includes unscored then eligibility-filtered. Matches send path in 17.0 (Standing Decision B3). Klaviyo benchmark: show **deliverable** estimate before send.

**Shared helper:** if 17.0 and 17.1 land same PR and drift is a risk, extract `src/lib/broadcast-eligibility.ts` with `getEligibleEmails(supabase, waitlistId)` used by both; otherwise two-line filter + cross-comment (avoid over-abstracting mid-epic).

**Epic 15 coordinate:** Story 15.3 may already touch this route (wid/requirePro). Check before implementing — if 15.3 lands first, focus this story on **eligible-count math** only.

### T4 — shape + lint (AC4–AC5)

Keep exact keys `all` / `hot_warm` / `cold` — client (17.2) depends on them. No new keys required.

### Implementation order inside story

1. T1 wid resolution
2. T2 requirePro
3. T3 eligible counts
4. Confirm Epic 15.3 overlap
5. `pnpm lint && pnpm build`

## Files to Create/Modify

| File                                                | Change                      |
| --------------------------------------------------- | --------------------------- |
| `src/app/api/dashboard/broadcast/segments/route.ts` | Primary fix (all ACs)       |
| `src/lib/broadcast-eligibility.ts`                  | Optional shared helper (T3) |

## Risk

- Counts must match 17.0 send eligibility — tests (17.6 AC2) should use shared fixtures.
- Admin client for `bounced_emails` if RLS blocks founder-scoped select.
- Free 403 may break any non-tier-gated UI that called segments for display — sidebar already locks Broadcast for Free; verify no marketing page calls this route.
