import { createAdminClient } from "@/lib/supabase/admin";

// 15.0 AC1: only real, implementable engagement signals
const SIGNAL_WEIGHTS = {
  email_click: 5,
  referral_signup: 15,
  qualification_completed: 8,
} as const;

// Warmth restructure (2026-09-25): everyone starts Hot — baseline score applied
// before signals, so a fresh signup scores 70 and classifies without any clicks.
const BASELINE = 70;

// 15.0 AC3: 0–59 days free, 60–89 days −25, 90+ days forces 0 (clamped)
const DECAY = {
  no_penalty_days: 60,
  penalty_amount: 25,
  reset_days: 90,
} as const;

type EmailEvent = { event_type: string; created_at: string };

// Warmth restructure (2026-09-25): Unscored removed — every subscriber is
// classified from signup (PRD vision "three states").
type Tier = "hot" | "warm" | "cold";

/**
 * Warmth restructure (2026-09-25): score = clamp(70 + signals − decay, 0, 100).
 * `referralActivityAt` seeds the recency clock when a subscriber has referred
 * others but has zero clicks; `createdAt` remains the floor.
 */
export function calculateWarmthScore(
  events: EmailEvent[],
  referralCount: number,
  hasQualAnswers: boolean,
  createdAt: string,
  referralActivityAt?: string | null
): number {
  return scoreSubscriber({
    events,
    referralCount,
    hasQualAnswers,
    createdAt,
    referralActivityAt,
  }).score;
}

/**
 * Warmth restructure (2026-09-25): ≥70 hot, ≥40 warm, else cold. Never null —
 * a decayed-zero subscriber with lifetime engagement is Cold, and a fresh
 * signup at baseline 70 is Hot.
 */
export function assignTier(score: number): Tier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

/**
 * Warmth restructure (2026-09-25): single helper so the batch computes score
 * and tier in one pass.
 */
export function scoreSubscriber(input: {
  events: EmailEvent[];
  referralCount: number;
  hasQualAnswers: boolean;
  createdAt: string;
  referralActivityAt?: string | null;
}): { score: number; tier: Tier } {
  const {
    events,
    referralCount,
    hasQualAnswers,
    createdAt,
    referralActivityAt = null,
  } = input;

  let rawScore = BASELINE;

  const clickCount = events.filter((e) => e.event_type === "clicked").length;
  rawScore += clickCount * SIGNAL_WEIGHTS.email_click;

  rawScore += referralCount * SIGNAL_WEIGHTS.referral_signup;

  if (hasQualAnswers) {
    rawScore += SIGNAL_WEIGHTS.qualification_completed;
  }

  const decayPenalty = calculateDecay(events, referralActivityAt, createdAt);
  const score = Math.max(0, Math.min(100, rawScore - decayPenalty));

  return { score, tier: assignTier(score) };
}

/**
 * Decay clock reads the last meaningful action of ANY type: latest email
 * click, latest referred-subscriber signup, or the subscriber's own signup —
 * whichever is most recent (research: recency = last engagement, Tarvent /
 * Madkudu / Outsolvi). `sent`/`delivered`/`opened` never reset the clock.
 */
function calculateDecay(
  events: EmailEvent[],
  referralActivityAt: string | null,
  fallbackDate: string
): number {
  const clicks = events.filter((e) => e.event_type === "clicked");

  let reference = fallbackDate;
  if (
    referralActivityAt &&
    new Date(referralActivityAt) > new Date(reference)
  ) {
    reference = referralActivityAt;
  }
  if (clicks.length > 0) {
    const latestClick = clicks.reduce((latest, e) =>
      new Date(e.created_at) > new Date(latest.created_at) ? e : latest
    ).created_at;
    if (new Date(latestClick) > new Date(reference)) {
      reference = latestClick;
    }
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince >= DECAY.reset_days) return 999;
  if (daysSince >= DECAY.no_penalty_days) return DECAY.penalty_amount;
  return 0;
}

/**
 * Batch recalculate warmth scores for all subscribers across all waitlists.
 * Uses admin client to bypass RLS.
 */
export async function batchRecalculateWarmth(): Promise<{
  processed: number;
  hot: number;
  warm: number;
  cold: number;
}> {
  const supabase = createAdminClient();

  const PAGE_SIZE = 500;
  let offset = 0;
  let processed = 0;
  let hot = 0;
  let warm = 0;
  let cold = 0;

  for (;;) {
    // 15.0 AC5: stable ordering so pages never duplicate or skip rows
    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("id, waitlist_id, qual_answers, referrer_id, created_at")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!subscribers || subscribers.length === 0) break;

    const pageIds = subscribers.map((s) => s.id);

    const { data: events } = await supabase
      .from("email_events")
      .select("subscriber_id, event_type, created_at")
      .in("subscriber_id", pageIds);

    const eventsBySubscriber = new Map<string, EmailEvent[]>();
    for (const event of events || []) {
      const list = eventsBySubscriber.get(event.subscriber_id) || [];
      list.push(event);
      eventsBySubscriber.set(event.subscriber_id, list);
    }

    // 15.0 AC6: count referrals MADE BY page members (referrer_id in page
    // ids), so a referrer on this page is credited even when the referred
    // subscriber lives on another page. Also tracks the latest referred
    // signup per referrer — that timestamp feeds the decay clock.
    const referralCounts = new Map<string, number>();
    const referralActivity = new Map<string, string>();
    if (pageIds.length > 0) {
      const { data: referralRows } = await supabase
        .from("subscribers")
        .select("referrer_id, created_at")
        .in("referrer_id", pageIds);

      for (const row of referralRows || []) {
        if (row.referrer_id) {
          referralCounts.set(
            row.referrer_id,
            (referralCounts.get(row.referrer_id) || 0) + 1
          );
          const latest = referralActivity.get(row.referrer_id);
          if (!latest || new Date(row.created_at) > new Date(latest)) {
            referralActivity.set(row.referrer_id, row.created_at);
          }
        }
      }
    }

    const updates: { id: string; warmth_score: string }[] = [];

    for (const sub of subscribers) {
      const subEvents = eventsBySubscriber.get(sub.id) || [];
      const refCount = referralCounts.get(sub.id) || 0;
      const hasQual =
        sub.qual_answers !== null &&
        typeof sub.qual_answers === "object" &&
        Object.keys(sub.qual_answers).length > 0;

      const { tier } = scoreSubscriber({
        events: subEvents,
        referralCount: refCount,
        hasQualAnswers: hasQual,
        createdAt: sub.created_at,
        referralActivityAt: referralActivity.get(sub.id) || null,
      });

      updates.push({ id: sub.id, warmth_score: tier });

      if (tier === "hot") hot++;
      else if (tier === "warm") warm++;
      else cold++;
    }

    // 15.0 AC7: write only the tier string
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

  return { processed, hot, warm, cold };
}
