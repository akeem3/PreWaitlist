# Story 11.3 — Warmth Distribution Panel (Real Data)

**Epic:** 11 — Warmth Tracking Engine
**Status:** done
**Depends on:** 11.1
**Design Refs:** `docs/design/sprint-3-design-specs.md` — S3, `docs/design/dashboard-design-guide.md`

## Story

As a founder, I want the warmth distribution panel to show real data so that I can see the health of my list at a glance.

## Acceptance Criteria (EARS)

- AC1: The warmth distribution panel shall display four horizontal bars: Hot, Warm, Cold, Unscored.
- AC2: Each bar shall show the count of subscribers in that tier and the percentage of total.
- AC3: The bars shall use design-token colors: Hot = `bg-accent` (brand green — aligned with the Hot badge by Story 15.4 AC1), Warm = `bg-status-warm`, Cold = `bg-status-cold`, Unscored = `bg-muted`.
- AC4: The panel shall receive `{ hot, warm, cold, unscored, total }` from the dashboard's single authenticated `GET /api/dashboard/warmth?waitlist_id=…` fetch (Story 12.1.8; the panel does not fetch independently since Story 15.4).
- AC5: When the waitlist has zero subscribers, the panel shall show em-dashes (not zeros).
- AC6: The panel shall render unblurred and unlocked for all tiers (free tier sees visible counts plus an upgrade-CTA card — 2026-09-22 decision, Story 15.4); the `/dashboard/warmth` page itself remains Pro-gated per Story 12.3.3.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC3) Fix bar colors to use design tokens · T2 (AC4) Swap API endpoint from public to authenticated · T3 (AC5-AC6) Remove blur/lock, fix empty state · T4 (AC7) Lint + build

## Out of Scope

Warmth trend charts (v1.1), real-time score updates (daily batch in Story 11.1).

## Implementation Details

### Status: Implemented (hardened through Story 15.4)

All 3 blocking issues resolved. Shipped behavior differs from the original plan in three places — noted under each task.

### T1: Bar colors (AC1–AC3)

Shipped in `components/dashboard/warmth-panel.tsx`: Hot = `bg-accent` (Story 15.4 AC1 aligned the Hot bar with the Hot badge — superseding the `bg-status-hot` plan), Warm = `bg-status-warm`, Cold = `bg-status-cold`, Unscored = `bg-muted`.

### T2: Data flow (AC4)

The panel no longer fetches. Story 12.1.8 moved data fetching to `src/app/dashboard/client.tsx` — one authenticated `GET /api/dashboard/warmth?waitlist_id=…` (guarded by `if (waitlist_id)` since the 15.4 audit) → `warmthData` passed as a prop. The endpoint (`src/app/api/dashboard/warmth/route.ts`) returns `{ hot, warm, cold, unscored, total }` as head counts (Story 15.4 AC5). The public `/api/warmth/[subdomain]` route referenced in the original plan is orphaned (audit §2.5).

### T3: Remove blur/lock + empty state (AC5–AC6)

`LockedOverlay`, blur, and the `tier` prop are removed — free tier sees visible counts + an "Upgrade to target segments" nudge (2026-09-22 decision). The `/dashboard/warmth` page stays Pro-gated (Story 12.3.3). Warning threshold lives in `components/dashboard/warning-banner.tsx` (value copied from settings; the free-page 400 fetch was removed by Story 15.4 AC2). Empty state: `{total > 0 ? count : "—"}` unchanged (AC5).

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Bar colors: Hot = accent green, Warm = amber, Cold = blue, Unscored = grey
2. Dashboard network tab → single `/api/dashboard/warmth?waitlist_id=…` request; the panel itself makes no fetch
3. Free tier: no blur, no `LockedOverlay` — counts visible + upgrade nudge
4. `/dashboard/warmth` reachable on Pro, gated on Free (Story 12.3.3)
5. Test with 0 subscribers → em-dashes (not zeros)
6. Run `pnpm lint` and `pnpm build` — verify zero errors
