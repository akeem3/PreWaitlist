# Story 11.2 — Warmth Column + Filter in Subscriber List

**Epic:** 11 — Warmth Tracking Engine
**Status:** done (warmth page only — see Dev Notes)
**Depends on:** 11.1
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S2

## Story

As a founder, I want to see a warmth badge (Hot/Warm/Cold/Unscored) next to each subscriber and filter by warmth tier so that I can identify engaged vs. disengaged subscribers.

## Acceptance Criteria (EARS)

- AC1: The `/dashboard/warmth` page (Story 12.3.3 surface) shall display a warmth badge for each subscriber: Hot, Warm, Cold, or Unscored.
- AC2: Badge colors as rendered by `WarmthBadge` (`src/app/dashboard/warmth/client.tsx:49-55`): Hot = `bg-status-hot text-white` (`--color-status-hot` #d0492f — founder override 2026-09-25, tokens are source of truth), Warm = `bg-status-warm text-white`, Cold = `bg-status-cold text-white`, Unscored = `bg-muted text-muted-foreground`.
- AC3: The `/dashboard/warmth` page shall include a warmth filter dropdown: All, Hot, Warm, Cold, Unscored (`client.tsx:188-199`).
- AC4: Filtering by warmth tier on `/dashboard/warmth` shall instantly filter the displayed rows client-side without a server call (`useMemo`, `client.tsx:70-87`).
- AC5: The warmth badge shall use caption-sized typography (`text-xs`, 12px, `font-medium`).
- AC6: Lint and build shall pass with zero errors.

> **Dev Notes (2026-09-25 — warmth restructure):** AC1, AC2, and AC3 are superseded — the Unscored tier was removed. Badges render only Hot/Warm/Cold (a null value defensively maps to Hot in `client.tsx`), the Unscored badge color row is gone, and the filter dropdown is now All/Hot/Warm/Cold. Original AC text retained above for history. **[AMENDED 2026-09-25]**

## Tasks

T1 (AC1-AC2) Add warmth badge column with tier-specific colors · T2 (AC3-AC4) Add filter dropdown + client-side filtering · T3 (AC5) Typography compliance · T4 (AC6) Lint + build

## Out of Scope

(none — fully contained)

## Implementation Details

### Status: Implemented (surface = `/dashboard/warmth`)

This story's surface moved from the main subscriber table to `/dashboard/warmth` (Story 12.3.3). Everything shipped in `src/app/dashboard/warmth/client.tsx`:

### T1: Warmth badge (AC1, AC2)

`WarmthBadge` at `client.tsx:49-55` — exact tier classes per AC2, rounded-full pill.

### T2: Warmth filter (AC3, AC4)

`filter` state + `useMemo` client-side filtering, `<select>` with All/Hot/Warm/Cold in the table header (~~All/Hot/Warm/Cold/Unscored~~ — Unscored option removed 2026-09-25).

### T3: Typography (AC5)

Badge uses `text-xs font-medium` (12px) — matches AC5.

**Removed dead references:** the original plan pointed at `src/app/dashboard/client.tsx` lines 577–595 (badge) and 483–493 (filter). That warmth column/filter on the main dashboard subscriber table was never delivered, is out of scope for this story, and those line references no longer exist (the file is now 514 lines).

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Open `/dashboard/warmth` → verify badge colors: Hot = coral red (`bg-status-hot`), Warm = amber (white text), Cold = blue (white text) — ~~Unscored = grey~~ (no Unscored badge since 2026-09-25)
2. Test filter dropdown: select "Hot" → only hot subscribers shown; "All" → all subscribers shown (client-side, no network request)
3. Verify badge type is 12px (`text-xs`)
4. Run `pnpm lint` and `pnpm build` — verify zero errors
