# Story 12.1 — Position Recalculation on Referral

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** None
**Design Refs:** None (algorithmic, no UI surface)

## Story

As a subscriber, I want my position to move up when someone I referred signs up so that the referral system feels fair and rewarding.

## Acceptance Criteria (EARS)

- AC1: When a new subscriber signs up with a valid `referral_code`, the referrer's position shall be recalculated.
- AC2: Position recalculation shall sort all subscribers in the waitlist by `referral_count DESC, created_at ASC` and reassign position numbers (1, 2, 3...).
- AC3: The referrer's new position shall be lower (closer to 1) than their previous position.
- AC4: Non-referred subscribers shall maintain their relative order based on signup time.
- AC5: Position recalculation shall happen synchronously during subscriber creation (not deferred).
- AC6: The number of spots moved up shall be calculated: `old_position - new_position`.
- AC7: The system shall store `old_position` before recalculation to enable the "moved up" email trigger (Story 12.2).
- AC8: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC2) Implement position recalculation function · T2 (AC3-AC4) Verify referrer moves up, others maintain order · T3 (AC5-AC6) Sync execution in POST /api/subscribers + spots-moved calculation · T4 (AC7) Store old_position for trigger email · T5 (AC8) Lint + build

## Out of Scope

"You moved up" email trigger (Story 12.2), milestone position boost (already in `src/lib/milestones.ts`), batch recalculation for existing subscribers (backfill)

## Implementation Details

### T1: Implement position recalculation function

- **New file:** `src/lib/positions.ts`

**Critical context:** The current `POST /api/subscribers` route (lines 67-75) uses append-only position logic: `position = maxPos + 1`. This means referred subscribers get a position at the END of the list, never moving the referrer up. Story 12.1 REPLACES this logic.

```typescript
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * AC2: Recalculate all positions in a waitlist.
 *
 * Sort order: referral_count DESC (more referrals = higher position),
 *             created_at ASC (earlier signup = higher position for ties).
 *
 * Returns: Array of { subscriber_id, old_position, new_position, spots_moved }
 */
export async function recalculatePositions(
  waitlistId: string,
  supabase: SupabaseClient
): Promise<
  Array<{
    subscriber_id: string;
    old_position: number;
    new_position: number;
    spots_moved: number;
  }>
> {
  // 1. Fetch all subscribers with their current positions
  const { data: subscribers, error: fetchError } = await supabase
    .from("subscribers")
    .select("id, position, referral_count, created_at")
    .eq("waitlist_id", waitlistId);

  if (fetchError || !subscribers) {
    throw new Error(
      `Failed to fetch subscribers for recalculation: ${fetchError?.message}`
    );
  }

  // 2. AC2: Sort by referral_count DESC, created_at ASC
  const sorted = [...subscribers].sort((a, b) => {
    if ((b.referral_count ?? 0) !== (a.referral_count ?? 0)) {
      return (b.referral_count ?? 0) - (a.referral_count ?? 0);
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // 3. Assign new positions and calculate spots moved
  const updates: Array<{
    subscriber_id: string;
    old_position: number;
    new_position: number;
    spots_moved: number;
  }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const sub = sorted[i];
    const newPosition = i + 1; // 1-indexed
    const oldPosition = sub.position ?? newPosition;
    const spotsMoved = oldPosition - newPosition; // AC6: positive = moved up

    updates.push({
      subscriber_id: sub.id,
      old_position: oldPosition,
      new_position: newPosition,
      spots_moved: spotsMoved,
    });
  }

  // 4. Batch update positions in DB
  // Use a single query to update all positions (not N individual updates)
  const updatePromises = updates.map((u) =>
    supabase
      .from("subscribers")
      .update({ position: u.new_position })
      .eq("id", u.subscriber_id)
  );

  await Promise.all(updatePromises);

  return updates;
}

/**
 * Helper: Get the position update for a specific subscriber.
 */
export function getPositionUpdate(
  updates: Array<{
    subscriber_id: string;
    old_position: number;
    new_position: number;
    spots_moved: number;
  }>,
  subscriberId: string
): {
  old_position: number;
  new_position: number;
  spots_moved: number;
} | null {
  return updates.find((u) => u.subscriber_id === subscriberId) ?? null;
}
```

**Key design decisions:**

- **Batch update:** Fetch all subscribers once, sort in JS, batch update positions. This is O(N) queries (N = subscriber count) which is fine for MVP (most waitlists < 1000 subscribers). For larger lists (10K+), batch into chunks of 100.
- **Sort by `referral_count DESC, created_at ASC`:** More referrals = higher position (closer to #1). Ties broken by signup time (earlier = higher).
- **Position is 1-indexed:** Position 1 = first in line.

### T2: Verify referrer moves up, others maintain order

**AC3:** After recalculation, the referrer's new position must be lower (closer to 1) than their old position. This is guaranteed by the sort order — the referrer's `referral_count` increased by 1 (the new subscriber counted as a referral), so they sort higher.

**AC4:** Non-referred subscribers maintain relative order because:

1. Their `referral_count` doesn't change
2. Their `created_at` doesn't change
3. The sort is deterministic — same input → same output

**Edge case: tied referral counts**

- Two subscribers both have `referral_count = 3`
- Tiebreaker: `created_at ASC` (earlier signup = higher position)
- This is stable sort behavior — existing positions preserved for ties

**Edge case: first subscriber (no referrals yet)**

- Position recalculation runs but all subscribers have `referral_count = 0`
- Sort falls back to `created_at ASC` — original order preserved

### T3: Sync execution in POST /api/subscribers + spots-moved calculation

- **File to modify:** `src/app/api/subscribers/route.ts`

**Replace the append-only position logic (lines 67-75) with full recalculation:**

Current code (to be replaced):

```typescript
// Current: append-only (NEVER recalculates existing positions)
const { data: maxPosData } = await supabaseAdmin
  .from("subscribers")
  .select("position")
  .eq("waitlist_id", waitlist_id)
  .order("position", { ascending: false })
  .limit(1)
  .single();

const position = (maxPosData?.position ?? 0) + 1;
```

New code:

```typescript
import { recalculatePositions, getPositionUpdate } from "@/lib/positions";

// ... (after subscriber creation, before email send)

// AC5: Synchronous recalculation — must complete before response returns
const updates = await recalculatePositions(waitlist_id, supabaseAdmin);

// AC6-AC7: Get the position update for this specific subscriber
const subscriberUpdate = getPositionUpdate(updates, newSubscriber.id);

// Use subscriberUpdate.new_position for the subscriber's position
// Use subscriberUpdate.old_position for the "moved up" email trigger (Story 12.2)
// Use subscriberUpdate.spots_moved for the email content (Story 12.2)
```

**Integration order in POST /api/subscribers:**

1. Create subscriber (line ~120-135)
2. Generate referral code if not provided (line ~136-138)
3. **NEW: Recalculate positions** (replaces append-only logic)
4. Check milestone threshold (line ~139-143)
5. **NEW: Send confirmation email** (Story 12.0)
6. Return subscriber with new position

**Critical:** The position recalculation is SYNCHRONOUS (AC5). The response must wait for recalculation to complete before returning the subscriber's correct position. This adds ~50-200ms latency for small lists (< 1000 subscribers) — acceptable for MVP.

### T4: Store old_position for trigger email

The `old_position` from the recalculation result is passed to Story 12.2's email trigger logic. It's already returned by `recalculatePositions()` — no additional storage needed in this story. Story 12.2 reads it from the return value.

**Variable to expose from the route handler:**

```typescript
// After recalculatePositions:
const spotsMoved = subscriberUpdate?.spots_moved ?? 0;
const oldPosition = subscriberUpdate?.old_position ?? null;

// Pass to email trigger (Story 12.2) and response
```

### T5: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Create `src/lib/positions.ts`
2. Unit test `recalculatePositions`:
   - Setup: 3 subscribers in waitlist, all at positions 1, 2, 3, all with `referral_count = 0`
   - New subscriber signs up with subscriber #2's referral code
   - After recalculation: subscriber #2 should have position 1 (moved up), others shifted down
3. Unit test `getPositionUpdate`:
   - Returns correct update for a given subscriber_id
   - Returns null for unknown subscriber_id
4. Test edge case: first subscriber ever (no existing subscribers) → position = 1, no recalculation needed
5. Test edge case: subscriber with most referrals already at #1 → stays at #1 after recalculation
6. Modify `src/app/api/subscribers/route.ts` — replace append-only logic with `recalculatePositions`
7. Sign up subscriber A (no referral) → position = 1
8. Sign up subscriber B (no referral) → position = 2
9. Sign up subscriber C (with subscriber A's referral code) → subscriber A moves to position 1, B stays at 2, C gets position 3
10. Verify: subscriber A's position improved from 1 → 1 (no change, already #1) — spots_moved = 0
11. Sign up subscriber D (with subscriber B's referral code) → recalculate: A=1, B=1(moved up), D=3, C=4
12. Verify: all positions are correct and consistent
13. Run `pnpm lint` and `pnpm build` — verify zero errors
