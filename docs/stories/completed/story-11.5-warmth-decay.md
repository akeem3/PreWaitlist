# Story 11.5 — Warmth Score Decay + Time-Based Rules

**Epic:** 11 — Warmth Tracking Engine
**Status:** done
**Depends on:** 11.1
**Design Refs:** None (algorithmic, no UI surface)

## Story

As a system, I want warmth scores to decay over time so that stale subscribers are correctly identified as Cold.

## Acceptance Criteria (EARS)

- AC1: The score calculation shall apply time decay based on days since the last engagement — the most recent `clicked` event only (Story 15.0 AC2; replies and referrals are not decay events).
- AC2: Decay rules: 0–59 days = no penalty, 60–89 days = -25 points, 90+ days = score resets to 0.
- AC3: "Last engagement" shall be determined by the most recent `clicked` event's `email_events.created_at`, falling back to `subscribers.created_at` when the subscriber has no clicks (Story 15.0 AC2).
- AC4: Subscribers with zero events shall have score = 0 regardless of signup date.
- AC5: The decay shall be applied during the daily batch recalculation (Story 11.1), not on every read.
- AC6: Lint and build shall pass with zero errors.

> **Dev Notes (2026-09-25 — warmth restructure):** AC4 is superseded — with baseline 70, a subscriber with zero events starts at **score 70** (Hot) at signup and decays from there (60–89 days → 45; 90+ days → 0/Cold). "score = 0 regardless of signup date" no longer holds. Original AC text retained above for history. **[AMENDED 2026-09-25]**

## Tasks

T1 (AC1-AC3) Implement decay logic in warmth calculation · T2 (AC4) Handle zero-event subscribers · T3 (AC5) Integrate with daily batch job · T4 (AC6) Lint + build

## Out of Scope

Real-time decay (every read is v1.1), page-visit-based decay (page_views table not populated).

## Implementation Details

### Status: Implemented

Decay lives in `src/lib/warmth.ts` (`calculateDecay`, hardened by Story 15.0): reference = most recent `clicked` event with `subscribers.created_at` fallback; penalty −25 at `daysSince >= 60` (day 59 not penalized); 90+ days forces score to 0. This story is the specification that function satisfies.

### T1: Implement decay logic

- File: `src/lib/warmth.ts` — `calculateDecay()` function (from Story 11.1)

The decay function is already specified in Story 11.1's T1. Key details:

```typescript
function calculateDecay(events: Array<{ created_at: string }> | null): number {
  if (!events || events.length === 0) {
    return 0; // AC4: Zero events — no penalty (score stays at 0)
  }

  // AC3: Last engagement from email_events.created_at
  const lastEvent = events.reduce((latest, e) =>
    new Date(e.created_at) > new Date(latest.created_at) ? e : latest
  );

  const daysSinceLastEvent = Math.floor(
    (Date.now() - new Date(lastEvent.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // AC2: Decay rules
  if (daysSinceLastEvent >= 90) {
    return 999; // Reset to 0 (score - 999 = negative → clamped to 0 by AC4 of Story 11.1)
  }
  if (daysSinceLastEvent >= 60) {
    return 25; // -25 points
  }
  return 0; // No penalty
}
```

> **Superseded by Story 15.0 T2:** the shipped `calculateDecay` filters to `clicked` events only and falls back to `subscribers.created_at` when there are no clicks (the block above decays from any event, including old sends).

**Important:** `page_views` table is NOT populated. No code inserts into it. Decay reads engagement from `email_events` (`clicked` rows only, with signup fallback per Story 15.0) — never page views. Page-visit-based warmth scoring is deferred to v1.1 when the tracking middleware is built.

### T2: Handle zero-event subscribers

Already handled in T1: `if (!events || events.length === 0) return 0;`

Zero events → no decay penalty → score stays at baseline ~~0 → tier = null (Unscored)~~ **70 → tier `hot` (warmth restructure 2026-09-25)**.

This matches AC4: "Subscribers with zero events shall have score = 0 regardless of signup date."

### T3: Integrate with daily batch job

Decay is applied inside `calculateWarmthScore()` in Story 11.1. When the daily cron job (Story 11.1 T3) calls `calculateWarmthScore()` for each subscriber, decay is automatically applied.

No separate integration needed — decay is part of the calculation function.

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Verify `calculateDecay()` exists in `src/lib/warmth.ts`
2. Test: subscriber whose last click was 30 days ago → decay = 0
3. Test: subscriber whose last click was 70 days ago → decay = 25
4. Test: subscriber whose last click was 100 days ago → decay = 999 (reset to 0)
5. Test: subscriber with zero events → decay = 0, score = 0
6. Verify decay is applied inside `calculateWarmthScore()`, not on every read
7. Run `pnpm lint` and `pnpm build` — verify zero errors
