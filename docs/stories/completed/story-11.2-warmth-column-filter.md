# Story 11.2 — Warmth Column + Filter in Subscriber List

**Epic:** 11 — Warmth Tracking Engine
**Status:** done (color bugs — see Dev Notes)
**Depends on:** 11.1
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S2

## Story

As a founder, I want to see a warmth badge (Hot/Warm/Cold/Unscored) next to each subscriber and filter by warmth tier so that I can identify engaged vs. disengaged subscribers.

## Acceptance Criteria (EARS)

- AC1: The subscriber table shall display a warmth badge column between Position and Referrals.
- AC2: Hot subscribers shall show a green badge (`bg-accent/10 text-accent`), Warm = amber (`bg-yellow-100 text-yellow-800`), Cold = blue (`bg-blue-100 text-blue-800`), Unscored = grey (`bg-muted text-muted-foreground`).
- AC3: The table header shall include a warmth filter dropdown: All, Hot, Warm, Cold, Unscored.
- AC4: Filtering by warmth tier shall instantly filter the displayed rows without a server call.
- AC5: The warmth badge shall use the design system's caption typography (12px, regular).
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Add warmth badge column with tier-specific colors · T2 (AC3-AC4) Add filter dropdown + client-side filtering · T3 (AC5) Typography compliance · T4 (AC6) Lint + build

## Out of Scope

(none — fully contained)

## Implementation Details

### Status: Partially Implemented — Color Bugs

The warmth column, badge, filter dropdown, client-side filtering, and sorting all exist in `src/app/dashboard/client.tsx`. However, there are color bugs that need fixing.

### T1: Fix warmth badge colors

- File: `src/app/dashboard/client.tsx` (lines 577-595)

**Current (wrong):**

```typescript
// Hot uses red — AC specifies green
<span className={`... ${score === "hot" ? "bg-red-100 text-red-700" : ""}`}>
```

**Required (correct):**

```typescript
// Hot = green (accent)
<span className={`... ${score === "hot" ? "bg-accent/10 text-accent" : ""}`}>
// Warm = amber
<span className={`... ${score === "warm" ? "bg-yellow-100 text-yellow-800" : ""}`}>
// Cold = blue
<span className={`... ${score === "cold" ? "bg-blue-100 text-blue-800" : ""}`}>
// Unscored = grey
<span className={`... ${!score ? "bg-muted text-muted-foreground" : ""}`}>
```

Design tokens exist in `globals.css` lines 33-35:

```css
--color-status-hot: #d0492f;
--color-status-warm: #c7841a;
--color-status-cold: #3b6fa6;
```

The AC uses Tailwind utility classes (`bg-accent/10 text-accent`), not the `status-*` tokens. Follow the AC.

### T2: Verify filter dropdown

- File: `src/app/dashboard/client.tsx` (lines 483-493)
- Already implemented: `<select>` with All, Hot, Warm, Cold, Unscored options
- Client-side filtering via `useMemo` (lines 140-146)
- **No changes needed for AC3-AC4**

### T3: Verify typography

- File: `src/app/dashboard/client.tsx` (lines 580/591)
- Already uses `text-xs` class (12px) — matches AC5 caption typography
- **No changes needed for AC5**

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors from color changes

## Verification

1. Fix the Hot badge color from `bg-red-100 text-red-700` to `bg-accent/10 text-accent`
2. Open dashboard → subscriber table → verify warmth column shows correct colors:
   - Hot: green badge
   - Warm: amber badge
   - Cold: blue badge
   - Unscored: grey badge
3. Test filter dropdown: select "Hot" → verify only hot subscribers shown
4. Test filter dropdown: select "All" → verify all subscribers shown
5. Run `pnpm lint` and `pnpm build` — verify zero errors
