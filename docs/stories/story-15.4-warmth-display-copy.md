# Story 15.4 — Warmth Display, Copy & Read Path Fixes

**Status:** done
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
| `src/app/dashboard/warmth/client.tsx`                | Optional Hot summary color (T6) |

## Implementation Status

**Status: IMPLEMENTED — all ACs green** (executed + verified 2026-09-25)

| AC                         | Status | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 Hot bar accent         | ✅     | `warmth-panel.tsx` — both Hot bars now `color="bg-accent"` (free `:95`, pro `:127`); Warm/Cold/Unscored unchanged; zero `bg-status-hot` in `.tsx`                                                                                                                                                                                                                                                                                   |
| AC2 Banner fetch           | ✅     | `warning-banner.tsx` rewritten — no `useState`/`useEffect`/`fetch` (grep-verified); renders from `warmthData` prop only. **Scope extension (founder-approved):** same no-`wid` fetch removed from `warmth-panel.tsx` internal fallback + dead pro skeleton removed. **Audit hardening (Prompt #3):** `dashboard/client.tsx` warmth fetch now guarded by `if (waitlistId)` — last remaining wid-less 400 path (optional prop) closed |
| AC3 Last engagement clicks | ✅     | `warmth/page.tsx` — select adds `event_type`; `if (e.event_type !== "clicked") return;` before max `created_at`                                                                                                                                                                                                                                                                                                                     |
| AC4 Settings helper        | ✅     | `settings/client.tsx:476` helperText = approved string; label/`min=20`/`max=80` unchanged                                                                                                                                                                                                                                                                                                                                           |
| AC5 API head counts        | ✅     | `api/dashboard/warmth/route.ts` — 4× `select("id", { count: "exact", head: true })` via fresh-chain `countBuilder()`; 401/400/404/shape/cache kept                                                                                                                                                                                                                                                                                  |
| AC6 Optional stat color    | ✅     | `dashboard/client.tsx:453` + `warmth/client.tsx:150` → `text-accent`; marketing `difference-section.tsx` intentionally untouched                                                                                                                                                                                                                                                                                                    |
| AC7 Free/Pro regression    | ✅     | Free panel upgrade CTA + counts intact (tier-gating 3/3 pass); Pro gate `warmth/page.tsx:34-42` untouched                                                                                                                                                                                                                                                                                                                           |
| AC8 Lint + build           | ✅     | lint 0 errors/5 warnings (baseline); tsc 63 = baseline, 0 in touched files; build exit 0; suite **496/7 = exact baseline**                                                                                                                                                                                                                                                                                                          |

**COPY approval:** Founder approved verbatim — `Warn me when this % or more of your list is Cold. Range: 20–80.` (via scan decision, 2026-09-25).

**Prompt #3 audit (2026-09-25):** 1 finding fixed — AC2 "no path returns 400" gap: `dashboard/client.tsx` could fetch warmth without `waitlist_id` when the optional `waitlistId` prop was absent (prod unreachable via page-level redirect, but the AC forbids the path). Guard added (`if (waitlistId)`). Re-gated after fix: lint 0/5, tsc 63 = baseline (0 touched), suite 520/7 of 527 (exact baseline failures), build exit 0. Evidence rows corrected: AC1 pro line `:127`, AC6 line `:453`.
