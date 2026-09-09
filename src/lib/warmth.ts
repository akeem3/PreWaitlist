import { createAdminClient } from "@/lib/supabase/admin";

// AC2: Signal weights
const SIGNAL_WEIGHTS = {
  email_click: 5,
  email_reply: 10,
  referral_signup: 15,
  qualification_completed: 8,
  leaderboard_visit: 5,
} as const;

// AC3: Decay thresholds (days)
const DECAY = {
  no_penalty_max: 59,
  penalty_max: 89,
  penalty_amount: 25,
  reset_at: 90,
} as const;

type EmailEvent = { event_type: string; created_at: string };
/**
 * AC1: Calculate warmth score (0–100) from engagement signals.
 * AC4: Clamped to 0–100 range.
 */
export function calculateWarmthScore(
  events: EmailEvent[],
  referralCount: number,
  hasQualAnswers: boolean
): number {
  let rawScore = 0;

  const clickCount = events.filter((e) => e.event_type === "clicked").length;
  rawScore += clickCount * SIGNAL_WEIGHTS.email_click;

  const replyCount = events.filter((e) => e.event_type === "replied").length;
  rawScore += replyCount * SIGNAL_WEIGHTS.email_reply;

  rawScore += referralCount * SIGNAL_WEIGHTS.referral_signup;

  if (hasQualAnswers) {
    rawScore += SIGNAL_WEIGHTS.qualification_completed;
  }

  // AC3: Time-based decay
  const decayPenalty = calculateDecay(events);

  // AC4: Clamp to 0–100
  return Math.max(0, Math.min(100, rawScore - decayPenalty));
}

function calculateDecay(events: EmailEvent[]): number {
  if (events.length === 0) return 0;

  const lastEvent = events.reduce((latest, e) =>
    new Date(e.created_at) > new Date(latest.created_at) ? e : latest
  );

  const daysSinceLastEvent = Math.floor(
    (Date.now() - new Date(lastEvent.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastEvent >= DECAY.reset_at) return 999;
  if (daysSinceLastEvent >= DECAY.no_penalty_max) return DECAY.penalty_amount;
  return 0;
}

/**
 * AC5: Assign tier based on score.
 * AC6: Score 0 → null (Unscored in UI).
 */
export function assignTier(score: number): "hot" | "warm" | "cold" | null {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score > 0) return "cold";
  return null;
}

/**
 * AC8: Batch recalculate warmth scores for all subscribers across all waitlists.
 * Uses admin client to bypass RLS.
 */
export async function batchRecalculateWarmth(): Promise<{
  processed: number;
  hot: number;
  warm: number;
  cold: number;
  unscored: number;
}> {
  const supabase = createAdminClient();

  const PAGE_SIZE = 500;
  let offset = 0;
  let processed = 0;
  let hot = 0;
  let warm = 0;
  let cold = 0;
  let unscored = 0;

  for (;;) {
    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("id, waitlist_id, qual_answers, referrer_id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!subscribers || subscribers.length === 0) break;

    const subscriberIds = subscribers.map((s) => s.id);

    const { data: events } = await supabase
      .from("email_events")
      .select("subscriber_id, event_type, created_at")
      .in("subscriber_id", subscriberIds);

    const eventsBySubscriber = new Map<string, EmailEvent[]>();
    for (const event of events || []) {
      const list = eventsBySubscriber.get(event.subscriber_id) || [];
      list.push(event);
      eventsBySubscriber.set(event.subscriber_id, list);
    }

    const referrerIds = [
      ...new Set(
        subscribers
          .map((s) => s.referrer_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    const referralCounts = new Map<string, number>();
    if (referrerIds.length > 0) {
      const { data: referrerRows } = await supabase
        .from("subscribers")
        .select("referrer_id")
        .in("referrer_id", referrerIds);

      for (const row of referrerRows || []) {
        if (row.referrer_id) {
          referralCounts.set(
            row.referrer_id,
            (referralCounts.get(row.referrer_id) || 0) + 1
          );
        }
      }
    }

    const updates: { id: string; warmth_score: string | null }[] = [];

    for (const sub of subscribers) {
      const subEvents = eventsBySubscriber.get(sub.id) || [];
      const refCount = referralCounts.get(sub.id) || 0;
      const hasQual =
        sub.qual_answers !== null &&
        typeof sub.qual_answers === "object" &&
        Object.keys(sub.qual_answers).length > 0;

      const score = calculateWarmthScore(subEvents, refCount, hasQual);
      const tier = assignTier(score);

      updates.push({ id: sub.id, warmth_score: tier });

      if (tier === "hot") hot++;
      else if (tier === "warm") warm++;
      else if (tier === "cold") cold++;
      else unscored++;
    }

    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from("subscribers")
          .update({ warmth_score: update.warmth_score })
          .eq("id", update.id);
      }
    }

    processed += subscribers.length;
    offset += PAGE_SIZE;

    if (subscribers.length < PAGE_SIZE) break;
  }

  return { processed, hot, warm, cold, unscored };
}
