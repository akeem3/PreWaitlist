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

**Research-validated approach:** Use a single atomic PostgreSQL CTE+UPDATE with `ROW_NUMBER()`. This avoids:

- **Race conditions:** Single-statement UPDATE acquires row-level locks atomically — no concurrent signup can read stale positions during recalculation.
- **N+1 queries:** One SQL statement updates all positions, not N individual updates.
- **JS-side sorting:** All computation happens in the database, which is optimized for ORDER BY + window functions.

```typescript
import { SupabaseClient } from "@supabase/supabase-js";

interface PositionUpdate {
  subscriber_id: string;
  old_position: number;
  new_position: number;
  spots_moved: number;
}

/**
 * AC2: Recalculate all positions in a waitlist using atomic CTE+UPDATE.
 *
 * Sort order: referral_count DESC (more referrals = higher position),
 *             created_at ASC (earlier signup = higher position for ties).
 *
 * The CTE computes referral_count inline (it's not a DB column — it's derived
 * from counting referrer_id matches). The UPDATE uses ROW_NUMBER() to assign
 * new positions in a single atomic statement.
 *
 * Returns: Array of { subscriber_id, old_position, new_position, spots_moved }
 */
export async function recalculatePositions(
  waitlistId: string,
  supabase: SupabaseClient
): Promise<PositionUpdate[]> {
  // 1. Fetch current positions BEFORE recalculation (for spots-moved calculation)
  const { data: currentSubs, error: fetchError } = await supabase
    .from("subscribers")
    .select("id, position")
    .eq("waitlist_id", waitlistId);

  if (fetchError || !currentSubs) {
    throw new Error(
      `Failed to fetch current positions: ${fetchError?.message}`
    );
  }

  // Build a map of old positions for spots-moved calculation
  const oldPositionMap = new Map<string, number>();
  for (const sub of currentSubs) {
    oldPositionMap.set(sub.id, sub.position ?? 0);
  }

  // 2. Atomic CTE+UPDATE: compute referral counts inline, rank by ROW_NUMBER(),
  //    and update all positions in a single statement.
  //
  // referral_count is NOT a DB column — it's derived from counting referrer_id
  // matches. The CTE pre-aggregates counts, then ROW_NUMBER() ranks subscribers.
  const { error: updateError } = await supabase.rpc("recalculate_positions", {
    p_waitlist_id: waitlistId,
  });

  // Fallback: if the RPC function doesn't exist yet, use raw SQL via the
  // Supabase REST API. The RPC approach is preferred (see SQL below).
  if (updateError) {
    // Direct SQL approach — works with Supabase's postgREST
    const sql = `
      WITH referral_counts AS (
        SELECT referrer_id, COUNT(*) AS count
        FROM subscribers
        WHERE waitlist_id = '${waitlistId}' AND referrer_id IS NOT NULL
        GROUP BY referrer_id
      ),
      ranked AS (
        SELECT
          s.id,
          ROW_NUMBER() OVER (
            ORDER BY
              COALESCE(rc.count, 0) DESC,
              s.created_at ASC
          )::int AS new_position
        FROM subscribers s
        LEFT JOIN referral_counts rc ON rc.referrer_id = s.id
        WHERE s.waitlist_id = '${waitlistId}'
      )
      UPDATE subscribers
      SET position = ranked.new_position
      FROM ranked
      WHERE subscribers.id = ranked.id
    `;

    const { error: sqlError } = await supabase.rpc("exec_sql", { sql: sql });
    if (sqlError) {
      throw new Error(`Failed to recalculate positions: ${sqlError.message}`);
    }
  }

  // 3. Fetch updated positions to calculate spots moved
  const { data: updatedSubs, error: refetchError } = await supabase
    .from("subscribers")
    .select("id, position")
    .eq("waitlist_id", waitlistId);

  if (refetchError || !updatedSubs) {
    throw new Error(
      `Failed to fetch updated positions: ${refetchError?.message}`
    );
  }

  // 4. Build results with spots-moved calculation
  const updates: PositionUpdate[] = updatedSubs.map((sub) => {
    const oldPosition = oldPositionMap.get(sub.id) ?? sub.position ?? 0;
    const newPosition = sub.position ?? 0;
    return {
      subscriber_id: sub.id,
      old_position: oldPosition,
      new_position: newPosition,
      spots_moved: oldPosition - newPosition, // AC6: positive = moved up
    };
  });

  return updates;
}

/**
 * Helper: Get the position update for a specific subscriber.
 */
export function getPositionUpdate(
  updates: PositionUpdate[],
  subscriberId: string
): PositionUpdate | null {
  return updates.find((u) => u.subscriber_id === subscriberId) ?? null;
}
```

**SQL breakdown (the actual atomic statement):**

```sql
-- CTE 1: Pre-aggregate referral counts (avoids correlated subquery)
WITH referral_counts AS (
  SELECT referrer_id, COUNT(*) AS count
  FROM subscribers
  WHERE waitlist_id = $1 AND referrer_id IS NOT NULL
  GROUP BY referrer_id
),
-- CTE 2: Rank subscribers using ROW_NUMBER()
ranked AS (
  SELECT
    s.id,
    ROW_NUMBER() OVER (
      ORDER BY
        COALESCE(rc.count, 0) DESC,  -- more referrals = higher rank
        s.created_at ASC              -- earlier signup = higher rank for ties
    )::int AS new_position
  FROM subscribers s
  LEFT JOIN referral_counts rc ON rc.referrer_id = s.id
  WHERE s.waitlist_id = $1
)
-- Single atomic UPDATE — acquires row locks on all affected rows
UPDATE subscribers
SET position = ranked.new_position
FROM ranked
WHERE subscribers.id = ranked.id;
```

**Why this is safe:**

- PostgreSQL executes the entire CTE+UPDATE as a single statement. Row-level locks are acquired before any reads happen, preventing concurrent signups from seeing stale positions.
- `referral_count` is computed inline from `referrer_id` matches — no need for a denormalized column.
- For waitlists under 10K subscribers (MVP target), this query executes in <50ms.

**Key design decisions:**

- **Atomic SQL, not JS-side sorting:** Eliminates race conditions between concurrent signups. The old approach (fetch → sort → N updates) had a window where another signup could interleave and corrupt positions.
- **CTE pre-aggregation:** Converts a correlated scalar subquery (slow — forces nested loop) into a JOIN (fast — PostgreSQL chooses hash/merge join).
- **Fallback chain:** Tries `recalculate_positions` RPC first (cleanest), falls back to raw SQL via `exec_sql` RPC. The RPC functions should be created as a SQL migration (see Story 11.7's SQL writeup for the pattern).
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
const { data: maxPos } = await supabase
  .from("subscribers")
  .select("position")
  .eq("waitlist_id", waitlist_id)
  .order("position", { ascending: false })
  .limit(1)
  .maybeSingle();

const position = (maxPos?.position ?? 0) + 1;
const referral_code = generateReferralCode();
```

New code:

```typescript
import { recalculatePositions, getPositionUpdate } from "@/lib/positions";

// ... (inside POST handler, after subscriber creation)

// The subscriber is created with a temporary position (will be recalculated)
const referral_code = generateReferralCode();

const { data, error } = await supabase
  .from("subscribers")
  .insert({ ... })
  .select("id, email, referral_code, position")
  .single();

// AC5: Synchronous recalculation — must complete before response returns
const updates = await recalculatePositions(waitlist_id, supabase);

// AC6-AC7: Get the position update for this specific subscriber
const subscriberUpdate = getPositionUpdate(updates, data.id);

// Use subscriberUpdate.new_position for the subscriber's position in the response
// Use subscriberUpdate.old_position and subscriberUpdate.spots_moved for Story 12.2
```

**Key variable names in route.ts (matching actual codebase):**

| Variable             | Source                                    | Notes                                               |
| -------------------- | ----------------------------------------- | --------------------------------------------------- |
| `supabase`           | `createClient()` at line 10               | NOT `supabaseAdmin` — the route uses the SSR client |
| `waitlist_id`        | `body.waitlist_id` at line 14             | From request body                                   |
| `data`               | `.select().single()` result at line 78-92 | The newly created subscriber                        |
| `resolvedReferrerId` | Resolved at lines 38-65                   | The referrer's UUID (or null)                       |

**Integration order in POST /api/subscribers (after changes):**

1. Validate input, resolve referral code (lines 9-65 — unchanged)
2. Create subscriber with temporary position (lines 78-92 — modified)
3. Handle duplicate email (lines 94-109 — unchanged)
4. **NEW: Recalculate positions** (replaces append-only logic at lines 67-75)
5. Self-referral check + milestone check (lines 111-133 — unchanged)
6. **NEW: Send confirmation email** (Story 12.0 — after milestone check)
7. **NEW: Send "moved up" email** (Story 12.2 — after confirmation email)
8. Return subscriber with corrected position

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
