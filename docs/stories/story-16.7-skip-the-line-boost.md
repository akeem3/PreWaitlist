# Story 16.7 — Skip-the-Line Durable Position Boost

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** 16.6
**Design Refs:** PRD REQ-6.8.3 (milestone label containing "skip the line" → boost to front of queue)
**Source:** [Audit §3 claim 4 / issue 5 / claim 13](../scans/engine-audit-5-engines.md), [src/lib/milestones.ts](../../../src/lib/milestones.ts), [src/app/api/subscribers/route.ts](../../../src/app/api/subscribers/route.ts), [Epic 16 Standing Decision L4](../epics/epic-16-leaderboard-updates-engine-fix.md)

## Story

As a subscriber who earned a "skip the line" reward, I want my front-of-queue position to persist after future signups — so the perk is real, not momentarily true.

## Acceptance Criteria (EARS)

- AC1: When `checkAndFulfillMilestones` awards a tier whose `reward_label` contains `"skip the line"` (case-insensitive — preserve existing match), it shall set **`position_boost: true`** on the subscriber update payload instead of relying on `position: 1` as the durable mechanism (`milestones_earned` / `milestones_notified` accumulation unchanged).
- AC2: After Story 16.6 SQL is applied in the target environment, `recalculate_positions` shall place boosted subscribers ahead of non-boosted subscribers regardless of subsequent referral-count growth by others (no boost-clear API in this epic).
- AC3: A later `POST /api/subscribers` that triggers `recalculatePositions()` shall **not** remove an existing subscriber's `position_boost` (regression for audit order-of-ops clobber: `route.ts:588` milestones → `:597` RPC).
- AC4: `getPositionUpdate` / moved-up email behavior for the new signup shall remain correct when boosted rows shift others (RPC return shape unchanged — 16.6 AC3).
- AC5: Unit tests for `milestones.ts` (currently **zero** — audit §3.5) shall cover: skip-the-line label sets `position_boost`; non-skip label does not set boost; `milestones_earned` appends once (accumulator); notify-once via `milestones_notified`.
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) milestones.ts flag write
- T2 (AC2–AC4) verify RPC honors boost + no clobber
- T3 (AC5) milestones unit tests
- T4 (AC6) Lint + build

## Out of Scope

- Boost clear/unassign UI or founder tooling
- Fraud / fingerprinting (Sprint 4 per audit research)
- Public milestone badges (Standing Decision L5)
- Changing label match rules (keep `toLowerCase().includes("skip the line")`)
- RLS, referral_count math, RPC argument names

## Dev Notes

### T1 — set flag (`src/lib/milestones.ts`)

Current (L133-148):

```ts
if (tier.reward_label.toLowerCase().includes("skip the line")) {
  positionUpdate = { position: 1 };
}
// ...
await supabase
  .from("subscribers")
  .update({
    milestones_earned: newEarned,
    milestones_notified: newNotified,
    ...positionUpdate,
  })
  .eq("id", subscriberId);
```

Target:

```ts
if (tier.reward_label.toLowerCase().includes("skip the line")) {
  positionUpdate = { position_boost: true };
}
```

- Select list (L81) currently `email, milestones_earned, milestones_notified, position` — add `position_boost` only if tests/read need it; write path does not require selecting it first.
- **Do not** remove `position: 1` write **until** 16.6 RPC is live in that environment — if both are desired during transition, writing `position: 1` **and** `position_boost: true` is harmless once RPC orders by boost (RPC overwrites `position` on next signup anyway). Prefer writing **only** `position_boost` once SQL gate (AC2) is confirmed for the deploy target; local: run 16.6 SQL first.

### T2 — no clobber (AC2–AC4)

`src/app/api/subscribers/route.ts` order remains:

1. `checkAndFulfillMilestones` (may set boost on **referrer**)
2. `recalculatePositions(waitlist_id, supabase)` (L597)

After 16.6, step 2 **reads** `position_boost` and assigns new `position` values — boost persists as column; `position` becomes derived rank including boost. Nothing in the signup path should `update({ position_boost: false })`.

Manual verification:

1. Run 16.6 SQL
2. Seed subscriber A with `position_boost = true`, few referrals; subscriber B many referrals, no boost
3. Insert new subscriber C (triggers RPC)
4. Assert A rank ahead of B; A still `position_boost = true`

### T3 — tests (`src/__tests__/lib/milestones.test.ts` — new)

Mock `@/lib/supabase/server` `createClient`, mock `@/lib/email` `sendEmail`.

Cases:

| Test                                       | Assert                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| Label `Skip the line!` earns threshold     | update payload includes `position_boost: true`       |
| Label `Early access` only                  | update payload does **not** include `position_boost` |
| Already in `milestones_earned`             | no duplicate entry; early return path                |
| Threshold already in `milestones_notified` | `sendEmail` not called again                         |
| First notify                               | `sendEmail` called once per new threshold            |

Avoid fake timers + RTL `waitFor` (not used in pure lib tests — fine with `vi.setSystemTime` only if asserting timestamps).

### T4 — lint/build/test

```bash
pnpm lint
pnpm test -- src/__tests__/lib
pnpm build
```

## Files to Create/Modify

| File                                   | Change                                                  |
| -------------------------------------- | ------------------------------------------------------- |
| `src/lib/milestones.ts`                | `position_boost: true` instead of durable `position: 1` |
| `src/__tests__/lib/milestones.test.ts` | **New** — AC5                                           |

## Risk

- **SQL not run (16.6):** update with unknown column → PostgREST error → caught by existing try/catch in milestones (logs only) — perk silently fails. Hard-gate deploy on founder SQL.
- Over-broad label match: `"skip the line"` substring remains product rule (REQ-6.8.3) — do not "improve" matching without founder request.
