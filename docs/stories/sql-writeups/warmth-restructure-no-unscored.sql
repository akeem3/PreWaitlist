-- Warmth restructure (2026-09-25): everyone starts Hot; Unscored removed permanently.
--
-- Model: score = clamp(70 + clicks*5 + referrals*15 + qual*8 − decay, 0, 100)
-- Tiers: ≥70 hot, ≥40 warm, else cold — never null.
--
-- Safe to run at ANY time relative to code deploy:
--   1) SET DEFAULT protects old running code that inserts without specifying
--      the column (it gets 'hot' immediately).
--   2) Backfill classifies every existing null row.
--   3) SET NOT NULL locks the invariant forever.

ALTER TABLE subscribers ALTER COLUMN warmth_score SET DEFAULT 'hot';

UPDATE subscribers
SET warmth_score = 'hot'
WHERE warmth_score IS NULL;

ALTER TABLE subscribers ALTER COLUMN warmth_score SET NOT NULL;

-- Verify: zero nulls, distribution sanity check.
SELECT warmth_score, count(*)
FROM subscribers
GROUP BY warmth_score
ORDER BY warmth_score;
