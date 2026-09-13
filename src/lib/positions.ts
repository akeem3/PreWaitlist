import type { SupabaseClient } from "@supabase/supabase-js";

interface PositionUpdate {
  subscriber_id: string;
  old_position: number;
  new_position: number;
  spots_moved: number;
}

/**
 * AC2: Recalculate all positions in a waitlist using atomic CTE+UPDATE via RPC.
 *
 * Sort order: referral_count DESC (more referrals = higher position),
 *             created_at ASC (earlier signup = higher position for ties).
 *
 * The RPC function (recalculate_positions) is SECURITY DEFINER — it bypasses
 * RLS so the SSR client can update all subscriber rows in the waitlist.
 *
 * Returns: Array of { subscriber_id, old_position, new_position, spots_moved }
 */
export async function recalculatePositions(
  waitlistId: string,
  supabase: SupabaseClient
): Promise<PositionUpdate[]> {
  const { data, error } = await supabase.rpc("recalculate_positions", {
    p_waitlist_id: waitlistId,
  });

  if (error) {
    throw new Error(`Failed to recalculate positions: ${error.message}`);
  }

  // RPC returns { subscriber_id, old_position, new_position, spots_moved }
  return (data as PositionUpdate[]) ?? [];
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
