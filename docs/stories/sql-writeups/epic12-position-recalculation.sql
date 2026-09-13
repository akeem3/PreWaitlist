-- Story 12.1: Position Recalculation RPC Function
-- SECURITY DEFINER: bypasses RLS so the SSR client can update all subscriber rows.
-- Run in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.recalculate_positions(p_waitlist_id uuid)
RETURNS TABLE(subscriber_id uuid, old_position integer, new_position integer, spots_moved integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH current_positions AS (
    SELECT s.id, s.position AS old_pos
    FROM public.subscribers s
    WHERE s.waitlist_id = p_waitlist_id
  ),
  referral_counts AS (
    SELECT s.referrer_id AS referrer_id, COUNT(*) AS count
    FROM public.subscribers s
    WHERE s.waitlist_id = p_waitlist_id AND s.referrer_id IS NOT NULL
    GROUP BY s.referrer_id
  ),
  ranked AS (
    SELECT
      s.id,
      cp.old_pos,
      ROW_NUMBER() OVER (
        ORDER BY
          COALESCE(rc.count, 0) DESC,
          s.created_at ASC
      )::integer AS new_pos
    FROM public.subscribers s
    LEFT JOIN referral_counts rc ON rc.referrer_id = s.id
    LEFT JOIN current_positions cp ON cp.id = s.id
    WHERE s.waitlist_id = p_waitlist_id
  )
  UPDATE public.subscribers sub
  SET position = ranked.new_pos
  FROM ranked
  WHERE sub.id = ranked.id
  RETURNING
    sub.id,
    COALESCE(ranked.old_pos, 0),
    ranked.new_pos,
    COALESCE(ranked.old_pos, 0) - ranked.new_pos;
END;
$$;
