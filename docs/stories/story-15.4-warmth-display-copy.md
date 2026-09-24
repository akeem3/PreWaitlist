# Story 15.4 — Warmth Display, Copy & Read Path Fixes

**Status:** ready
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** — (display independent of 15.0; Cold counts more accurate after 15.0+15.1)
**Design Refs:** S1 panel layout, S2 warning banner — `docs/design/sprint-3-design-specs.md` §S1–S2; badge colors — `docs/design/dashboard-design-guide.md`
**Source:** [Audit §2 claims 6, 15, 16, 18](../scans/engine-audit-5-engines.md), [Epic 15 Standing Decisions 8–9](../epics/epic-15-warmth-engine-fix.md)

## Story

As a founder, I want warmth UI colors, last-engagement data, warning data plumbing, settings helper text, and the warmth summary API to match how scoring actually works.

## Acceptance Criteria (EARS)

- AC1: Warmth panel Hot bar fill shall be **`bg-accent`** (green, consistent with Hot badge); Warm = `bg-status-warm`; Cold = `bg-status-cold`; Unscored = `bg-muted`.
- AC2: WarningBanner shall never call `/api/dashboard/warmth` without `waitlist_id` — remove broken fallback or pass `waitlist_id`; no path returns 400 from that mistake.
- AC3: `/dashboard/warmth` Last Engagement shall use the most recent **`clicked`** event only (not `sent`/`delivered`/`opened`).
- AC4: Settings warmth helper text shall describe the **cold percentage warning threshold**, not a score cutoff. **COPY GAP** — proposed for founder approval:  
  `Warn me when this % or more of your list is Cold. Range: 20–80.`  
  Do not ship an unapproved alternate string. Label stays `Cold threshold (%)`; min 20, max 80, default 40 unchanged.
- AC5: `GET /api/dashboard/warmth` shall compute counts without loading all `warmth_score` rows into JS when feasible (4× `count: "exact", head: true` + total); keep auth, owner check, required `waitlist_id`, 30s cache.
- AC6: Optional: overview Hot number may use `text-accent` instead of `text-status-hot`.
- AC7: Free panel still shows counts + upgrade badge; `/dashboard/warmth` remains Pro-gated (regression guard).
- AC8: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) Panel bar colors
- T2 (AC2) WarningBanner fetch fix
- T3 (AC3) Last Engagement click-only
- T4 (AC4) Settings helper **COPY GAP**
- T5 (AC5–AC6) Warmth API head counts + optional stat color
- T6 (AC7–AC8) Regression check + lint/build

## Out of Scope

- New panel/banner visual design
- Free warmth page overlay redesign
- Bar click-through to filtered table
- Deleting public `/api/warmth/[subdomain]`
- Inventing helper copy without approval

## Dev Notes

### T1 — Panel bars (`components/dashboard/warmth-panel.tsx`)

| Tier     | Current                          | Target          |
| -------- | -------------------------------- | --------------- |
| Hot      | `bg-status-hot` (`:113`, `:167`) | **`bg-accent`** |
| Warm     | `bg-status-warm`                 | unchanged       |
| Cold     | `bg-status-cold`                 | unchanged       |
| Unscored | `bg-muted`                       | unchanged       |

Badge already: hot `bg-accent/10 text-accent`, warm/cold `bg-status-*` (`warmth/client.tsx:48-52`).

**Design conflict:** S1 ASCII table lists Hot fill `#D0492F` / `bg-status-hot`. Standing Decision 8: Story 11.3 AC3 (bars = badge green/amber/blue) **supersedes** that row. Do not hardcode hex.

### T2 — WarningBanner (`components/dashboard/warning-banner.tsx`)

**Broken fallback `:38-52`:**

```ts
fetch("/api/dashboard/warmth"); // no waitlist_id → API 400
```

Dashboard always passes `warmthData` (`client.tsx:483-486`).

**Preferred fix:** remove `fetchedData` state + effect; require `warmthData?: WarmthData | null` (keep optional for tests that pass data). If prop missing, render null (same as today when data absent).

**Visibility (unchanged):**

```
coldPercent = round(cold / total * 100)
visible = coldPercent !== null && total >= 10 && coldPercent >= coldThreshold
```

Copy line stays: `{coldPercent}% of your list has gone cold. Consider sending a re-engagement email.` (S2 — not a COPY GAP; already approved in Sprint 3).

### T3 — Last Engagement (`src/app/dashboard/warmth/page.tsx`)

**Current `:74-84`:** max `created_at` over **all** email_events.

```ts
const { data: events } = await supabase
  .from("email_events")
  .select("subscriber_id, event_type, created_at")
  .in("subscriber_id", subscriberIds);

events?.forEach((e) => {
  if (e.event_type !== "clicked") return; // ADD
  // ... max created_at
});
```

Display “Never” when no clicks (client already handles null).

### T4 — Settings helper (**COPY GAP**)

File: `src/app/dashboard/[waitlistId]/settings/client.tsx:335`

**Current (wrong):**

```
Subscribers below this score are marked cold. Range: 20–80.
```

**Proposed (needs founder yes/no/edit):**

```
Warn me when this % or more of your list is Cold. Range: 20–80.
```

**Hard gate:** AGENTS.md — never write user-facing copy. Story cannot complete AC4 until founder approves this string or supplies replacement. Record approval under Implementation Status.

Field semantics: `waitlists.cold_threshold` integer default 40, input min 20 max 80 — **percent of list Cold**, used only by WarningBanner, not `assignTier` cutoffs (70/40 hardcoded in 15.0).

### T5 — Dashboard warmth API (`src/app/api/dashboard/warmth/route.ts`)

**Current `:38-47`:** select all `warmth_score`, four JS `.filter().length`.

**Target:**

```ts
const base = supabase
  .from("subscribers")
  .select("id", { count: "exact", head: true })
  .eq("waitlist_id", waitlist.id);

const [total, hot, warm, cold] = await Promise.all([
  base, // careful: clone query builders per request
  baseClone.in("warmth_score", ["hot"]),
  baseClone.in("warmth_score", ["warm"]),
  baseClone.eq("warmth_score", "cold"),
]);
// unscored = total - hot - warm - cold
```

Supabase builders are thenable and single-use — build **four separate** query chains from a helper function, same as segments route pattern.

Keep:

- 401 unauth, 400 missing `waitlist_id`, 404 not owner
- JSON `{ hot, warm, cold, unscored, total }`
- `Cache-Control: s-maxage=30, stale-while-revalidate=60`

### T6 — Regression + optional color

- Free panel: `warmth-panel.tsx:81-135` upgrade button + counts intact (2026-09-22).
- Pro page gate: `warmth/page.tsx:34-42` fake zeros intact (12.3.3 AC6).
- Optional AC6: `dashboard/client.tsx:424` `text-status-hot` → `text-accent`; `warmth/client.tsx:150` summary Hot color same.

```bash
pnpm lint
pnpm build
pnpm test
```

## Files to Create/Modify

| File                                                 | Change                          |
| ---------------------------------------------------- | ------------------------------- |
| `components/dashboard/warmth-panel.tsx`              | Hot bar → `bg-accent`           |
| `components/dashboard/warning-banner.tsx`            | Remove broken fetch             |
| `src/app/dashboard/warmth/page.tsx`                  | Last engagement = clicks        |
| `src/app/dashboard/[waitlistId]/settings/client.tsx` | Helper text after COPY approval |
| `src/app/api/dashboard/warmth/route.ts`              | Head-count aggregation          |
| `src/app/dashboard/client.tsx`                       | Optional Hot color              |

## Implementation Status

**Status: NOT IMPLEMENTED**

| AC                         | Status          | Evidence                     |
| -------------------------- | --------------- | ---------------------------- |
| AC1 Hot bar accent         | ❌              | Still `bg-status-hot`        |
| AC2 Banner fetch           | ❌              | Fallback without waitlist_id |
| AC3 Last engagement clicks | ❌              | All event types              |
| AC4 Settings helper        | ⛔ **COPY GAP** | Awaiting founder string      |
| AC5 API head counts        | ❌              | Full row load                |
| AC6 Optional stat color    | ❌              | `text-status-hot`            |
| AC7 Free/Pro regression    | ✅ baseline     | Guard only                   |
| AC8 Lint + build           | ⏳              | —                            |

**COPY approval:** _pending_
