# Story 11.1 — Warmth Score Calculation Engine

**Epic:** 11 — Warmth Tracking Engine
**Status:** done
**Depends on:** 11.0
**Design Refs:** None (algorithm + backend logic)

## Story

As a founder, I want each subscriber to have an engagement score (0–100) so that I can see who's Hot, Warm, or Cold.

## Acceptance Criteria (EARS)

- AC1: The system shall calculate a warmth score (0–100) for each subscriber based on engagement signals.
- AC2: The score shall be calculated from the following signals with these point values: email click (+5), referral signup (+15), qualification answers completed (+8). Story 15.0 AC1 removed email reply (+10) and leaderboard page visit (+5) — Resend emits no reply event and `page_views` is never populated.
- AC3: The score shall include time-based decay measured from the last engagement — the most recent `clicked` event, falling back to subscriber signup when there are no clicks: days 0–59 = no penalty (penalty applies at `daysSince >= 60`), days 60–89 = −25 points, days 90+ = score forced to 0. (Story 15.0 AC2–AC3.)
- AC4: The score shall be clamped to 0–100 range (never below 0, never above 100).
- AC5: The system shall assign tiers based on score: Hot (≥ 70), Warm (40–69), Cold (score > 0, or score = 0 with lifetime engagement — clicks, referrals, or qualification answers present). (Story 15.0 AC4.)
- AC6: New subscribers with no engagement signals shall have score = 0 and tier = "Unscored". Conversely, subscribers with lifetime engagement whose score decays to 0 shall be tier = "Cold", never "Unscored". (Story 15.0 AC4.)
- AC7: The score shall be stored in the `subscribers.warmth_score` column (text, check: in hot/warm/cold, nullable).
- AC8: A daily cron job shall recalculate scores for all subscribers in all waitlists, scheduled in `vercel.json` as `{ "path": "/api/cron/warmth", "schedule": "0 5 * * *" }` (UTC daily 05:00, Story 15.1). This is a deliberate scope decision for MVP — real-time recalculation on every webhook event is v1.1.
- AC9: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC4) Score calculation function with signal weights + decay · T2 (AC5-AC7) Tier assignment + DB storage · T3 (AC8) Cron job / trigger for batch recalculation · T4 (AC9) Lint + build

## Out of Scope

Real-time score updates on every event (daily batch is sufficient for MVP), warmth trend charts (v1.1), subscriber-facing score display.

## Implementation Details

> **Status (Epic 15):** The ACs above are authoritative. The code below is the original Epic 11 spec — signal weights (T1), decay reference/boundary (T1), tier-at-zero (T2), and cron mechanism (T3) are superseded by Stories 15.0/15.1 as implemented in `src/lib/warmth.ts` and `vercel.json`.

### T1: Score calculation function

- **New file:** `src/lib/warmth.ts`

```typescript
import { SupabaseClient } from "@supabase/supabase-js";

// AC2: Signal weights — SUPERSEDED by Story 15.0 (shipped: email_click 5, referral_signup 15, qualification_completed 8; email_reply and leaderboard_visit removed)
const SIGNAL_WEIGHTS = {
  email_click: 5,
  email_reply: 10,
  referral_signup: 15,
  qualification_completed: 8,
  leaderboard_visit: 5,
} as const;

// AC3: Decay thresholds (days) — SUPERSEDED by Story 15.0 (shipped uses daysSince >= 60 for -25, >= 90 for reset; day 59 not penalized; clicked-only reference)
const DECAY = {
  no_penalty_max: 59, // 0-59 days = no penalty
  penalty_max: 89, // 60-89 days = -25
  penalty_amount: 25,
  reset_at: 90, // 90+ days = score resets to 0
} as const;

export async function calculateWarmthScore(
  subscriberId: string,
  supabase: SupabaseClient
): Promise<number> {
  // AC1: Query engagement signals
  // 1. Count email clicks from email_events
  const { data: events } = await supabase
    .from("email_events")
    .select("event_type, created_at")
    .eq("subscriber_id", subscriberId);

  // 2. Get subscriber: referral_count, qual_answers
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("referral_count, qual_answers")
    .eq("id", subscriberId)
    .single();

  if (!subscriber) return 0;

  // AC1: Sum signal points
  let rawScore = 0;

  // Email clicks
  const clickCount =
    events?.filter((e) => e.event_type === "clicked").length ?? 0;
  rawScore += clickCount * SIGNAL_WEIGHTS.email_click;

  // Email replies (if tracked — may not be available via Resend)
  const replyCount =
    events?.filter((e) => e.event_type === "replied").length ?? 0;
  rawScore += replyCount * SIGNAL_WEIGHTS.email_reply;

  // Referral signups
  rawScore += (subscriber.referral_count ?? 0) * SIGNAL_WEIGHTS.referral_signup;

  // Qualification answers completed (AC: check if qual_answers JSONB is populated)
  if (
    subscriber.qual_answers &&
    Object.keys(subscriber.qual_answers).length > 0
  ) {
    rawScore += SIGNAL_WEIGHTS.qualification_completed;
  }

  // Leaderboard page visit (from page_views table — currently NOT populated)
  // Deferred to v1.1 when tracking middleware is built

  // AC3: Time-based decay
  const decayPenalty = calculateDecay(events);

  // AC4: Clamp to 0-100
  return Math.max(0, Math.min(100, rawScore - decayPenalty));
}

function calculateDecay(events: Array<{ created_at: string }> | null): number {
  if (!events || events.length === 0) {
    // AC6: Zero events — no penalty (score stays at 0)
    return 0;
  }

  // Find most recent event
  const lastEvent = events.reduce((latest, e) =>
    new Date(e.created_at) > new Date(latest.created_at) ? e : latest
  );

  const daysSinceLastEvent = Math.floor(
    (Date.now() - new Date(lastEvent.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // AC3: Decay rules
  if (daysSinceLastEvent >= DECAY.reset_at) {
    return 999; // Reset to 0 (score - 999 = negative → clamped to 0)
  }
  if (daysSinceLastEvent >= DECAY.no_penalty_max) {
    return DECAY.penalty_amount; // -25 points
  }
  return 0; // No penalty
}
```

**Apple MPP caveat:** Email opens are NOT included. Apple Mail Privacy Protection preloads pixels for ~40-50% of email clients, making open data unreliable. Clicks (+5) and referrals (+15) are the primary intent signals.

**Effective score range:** Theoretical max is ~53 points (referral + qual + click). Most active subscribers will score 15-40. The 0-100 scale provides headroom for future signals.

### T2: Tier assignment + DB storage

- File: `src/lib/warmth.ts` (same file)

```typescript
// AC5: Tier thresholds — SUPERSEDED by Story 15.0 (shipped: assignTier(score, hadEngagement) returns "cold" when hadEngagement && score === 0)
export function assignTier(score: number): "hot" | "warm" | "cold" | null {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score > 0) return "cold";
  return null; // AC6: Unscored (null in DB)
}
```

Update `subscribers.warmth_score`:

```typescript
export async function updateWarmthScore(
  subscriberId: string,
  supabase: SupabaseClient
): Promise<void> {
  const score = await calculateWarmthScore(subscriberId, supabase);
  const tier = assignTier(score);

  await supabase
    .from("subscribers")
    .update({ warmth_score: tier }) // AC7: Store tier string, not numeric score
    .eq("id", subscriberId);
}
```

**Note:** The `warmth_score` column stores the tier string ("hot", "warm", "cold"), NOT the numeric score. The numeric score is transient — recalculated in batch.

### T3: Cron job / batch recalculation

> **Superseded (Story 15.1):** shipped as `GET /api/cron/warmth` (Bearer `CRON_SECRET`), scheduled in `vercel.json` as `{ "path": "/api/cron/warmth", "schedule": "0 5 * * *" }`. Options A/B below were never built.

- **Option A (recommended):** Supabase Edge Function with pg_cron
- **Option B:** API route triggered by external cron (e.g., Vercel Cron, cron-job.org)

Create a batch recalculation endpoint:

- **New file:** `src/app/api/cron/warmth/route.ts`

```typescript
// GET /api/cron/warmth — triggered daily by external cron
export async function GET() {
  // 1. Get all subscribers (paginated)
  // 2. For each subscriber: calculateWarmthScore + updateWarmthScore
  // 3. Return summary: { processed: N, hot: X, warm: Y, cold: Z }
}
```

**Security:** Protect with `CRON_SECRET` env var — only allow calls with valid Bearer token.

**Rate:** Daily recalculation is sufficient for MVP. Real-time recalculation on every webhook event is v1.1.

### T4: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Create `src/lib/warmth.ts`
2. Unit test the calculation: subscriber with 3 clicks + 1 referral = score 30 (15 + 15), tier = "cold"
3. Test decay: subscriber whose last click was 70 days ago → -25 penalty
4. Test clamp: subscriber with many events → score caps at 100
5. Test zero events → score = 0, tier = null
6. Create the cron route
7. Call `GET /api/cron/warmth` with valid Bearer token → verify all subscribers updated
8. Check `subscribers.warmth_score` column has values (hot/warm/cold or null)
9. Run `pnpm lint` and `pnpm build` — verify zero errors
