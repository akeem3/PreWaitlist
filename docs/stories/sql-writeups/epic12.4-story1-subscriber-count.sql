-- Story 12.4.1: RPC function to atomically increment subscriber_count
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_subscriber_count(p_waitlist_id uuid)
RETURNS void AS $$
  UPDATE waitlists
  SET subscriber_count = subscriber_count + 1
  WHERE id = p_waitlist_id;
$$ LANGUAGE sql;
