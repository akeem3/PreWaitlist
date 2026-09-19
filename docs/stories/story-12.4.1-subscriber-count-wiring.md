# Story 12.4.1 — Wire subscriber_count Increment/Decrement

**Status:** ready
**Epic:** 12.4 — Pre-Epic 13 Gaps

## Story

As a system, I need the cached `subscriber_count` on the `waitlists` table to stay accurate so that the 500-signup cap check (Epic 13) works correctly.

## Acceptance Criteria (EARS)

- AC1: After a successful subscriber insert in `POST /api/subscribers`, the system shall increment `waitlists.subscriber_count` by 1.
- AC2: After a subscriber is deleted, the system shall decrement `waitlists.subscriber_count` by 1.
- AC3: The increment shall use an atomic SQL operation (not read-modify-write).
- AC4: The increment shall happen AFTER the subscriber insert succeeds, in the same request lifecycle.
- AC5: If the increment fails, the subscriber shall still be created. The error shall be logged.
- AC6: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1, AC3-AC5) Add atomic increment after subscriber insert
T2 (AC2) Add decrement on delete (if applicable)
T3 (AC6) Lint + build

## Dev Notes

- **Column exists:** `waitlists.subscriber_count integer DEFAULT 0` from Story 11.7. No new migration needed.
- **Increment location:** `src/app/api/subscribers/route.ts` — after successful subscriber insert (around line 489-520).
- **Atomic approach:** Use RPC function: `CREATE OR REPLACE FUNCTION increment_subscriber_count(p_waitlist_id uuid) RETURNS void AS $$ UPDATE waitlists SET subscriber_count = subscriber_count + 1 WHERE id = p_waitlist_id; $$ LANGUAGE sql;`
- **Or direct update:** `await supabase.from('waitlists').update({ subscriber_count: (count ?? 0) + 1 }).eq('id', waitlist_id)` — acceptable at MVP scale.
- **Decrement:** `DELETE /api/waitlist` cascades to subscribers. For MVP, decrement is nice-to-have. Count self-corrects on next recalculation if needed.
- **Error handling:** try/catch around increment, log error, don't throw.
