import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateWarmthScore,
  assignTier,
  scoreSubscriber,
} from "@/lib/warmth";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("calculateWarmthScore", () => {
  it("returns baseline 70 for subscriber with no signals", () => {
    const score = calculateWarmthScore([], 0, false, daysAgo(0));
    expect(score).toBe(70); // warmth restructure: everyone starts Hot
  });

  it("adds email clicks on top of baseline", () => {
    const events = [
      { event_type: "clicked", created_at: daysAgo(1) },
      { event_type: "clicked", created_at: daysAgo(2) },
    ];
    const score = calculateWarmthScore(events, 0, false, daysAgo(0));
    expect(score).toBe(80); // 70 + 2 clicks * 5
  });

  it("adds referrals on top of baseline", () => {
    const score = calculateWarmthScore([], 1, false, daysAgo(0));
    expect(score).toBe(85); // 70 + 1 referral * 15
  });

  it("adds qualification answers on top of baseline", () => {
    const score = calculateWarmthScore([], 0, true, daysAgo(0));
    expect(score).toBe(78); // 70 + 8
  });

  it("combines multiple signals", () => {
    const events = [{ event_type: "clicked", created_at: daysAgo(1) }];
    const score = calculateWarmthScore(events, 1, true, daysAgo(0));
    expect(score).toBe(98); // 70 + 5 + 15 + 8
  });

  it("clamps score to 100 maximum", () => {
    const events = Array.from({ length: 20 }, () => ({
      event_type: "clicked" as string,
      created_at: daysAgo(1),
    }));
    const score = calculateWarmthScore(events, 10, true, daysAgo(0));
    expect(score).toBe(100); // 70 + 100 + 150 + 8 = 328 → clamped to 100
  });

  it("clamps score to 0 minimum after full decay", () => {
    const events = [{ event_type: "clicked", created_at: daysAgo(100) }];
    const score = calculateWarmthScore(events, 0, false, daysAgo(100));
    expect(score).toBe(0); // 70 + 5 - 999 = -924 → clamped to 0
  });

  it("counts only clicked events for click signal", () => {
    const events = [
      { event_type: "delivered", created_at: daysAgo(1) },
      { event_type: "opened", created_at: daysAgo(1) },
      { event_type: "bounced", created_at: daysAgo(1) },
    ];
    const score = calculateWarmthScore(events, 0, false, daysAgo(0));
    expect(score).toBe(70); // non-click events don't contribute
  });

  describe("time decay", () => {
    it("applies no penalty for events within 59 days", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(30) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(75); // 70 + 5, no decay penalty
    });

    it("applies no penalty at exactly 59 days", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(59) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(59));
      expect(score).toBe(75); // day 59 is still in the grace window
    });

    it("applies -25 penalty at exactly 60 days", () => {
      const events = Array.from({ length: 6 }, () => ({
        event_type: "clicked" as string,
        created_at: daysAgo(60),
      }));
      const score = calculateWarmthScore(events, 0, false, daysAgo(60));
      expect(score).toBe(75); // 70 + 30 - 25 = 75 (not the 999 reset)
    });

    it("applies -25 penalty for events 60-89 days old", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(70) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(70));
      expect(score).toBe(50); // 70 + 5 - 25 = 50
    });

    it("resets signals to 0 for events 90+ days old", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(95) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(95));
      expect(score).toBe(0); // 70 + 5 - 999 → clamped to 0
    });

    it("resets to 0 at exactly 90 days", () => {
      const events = Array.from({ length: 6 }, () => ({
        event_type: "clicked" as string,
        created_at: daysAgo(90),
      }));
      const score = calculateWarmthScore(events, 0, false, daysAgo(90));
      expect(score).toBe(0); // 70 + 30 - 999 → clamped to 0 (999 reset, not -25)
    });

    it("uses the most recent click for decay calculation", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(100) }, // old event
        { event_type: "clicked", created_at: daysAgo(10) }, // recent event
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(80); // 70 + 2 clicks * 5, no decay (recent activity)
    });

    it("applies decay based on most recent click, not oldest", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(5) }, // recent
        { event_type: "clicked", created_at: daysAgo(100) }, // old
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(80); // most recent is 5 days ago → no decay
    });

    it("handles multiple events all within grace period", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(10) },
        { event_type: "clicked", created_at: daysAgo(20) },
        { event_type: "clicked", created_at: daysAgo(30) },
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(85); // 70 + 3 clicks * 5, no decay
    });

    it("penalizes even with recent signals if the clock is 60+ days", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(65) }];
      const score = calculateWarmthScore(events, 1, false, daysAgo(65));
      expect(score).toBe(65); // 70 + 5 + 15 - 25 = 65
    });

    it("ignores sent/delivered events when computing the decay clock", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(70) },
        { event_type: "sent", created_at: daysAgo(0) },
        { event_type: "delivered", created_at: daysAgo(0) },
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(70));
      expect(score).toBe(50); // 70 + 5 - 25 = 50; sent/delivered did NOT reset the clock
    });

    it("shows no decay when the latest click is recent even if sent is today", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(10) },
        { event_type: "sent", created_at: daysAgo(0) },
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(10));
      expect(score).toBe(75); // decay reads the latest click (10d); sent is ignored
    });

    it("decays from subscribers.created_at when there are zero clicks", () => {
      const events = [{ event_type: "sent", created_at: daysAgo(1) }];
      const score = calculateWarmthScore(events, 1, false, daysAgo(100));
      expect(score).toBe(0); // no clicks → clock reads createdAt 100d → 999 reset
    });
  });

  describe("recency clock — any meaningful action (R4)", () => {
    it("referral activity resets the decay clock", () => {
      const score = calculateWarmthScore([], 1, false, daysAgo(70), daysAgo(5));
      expect(score).toBe(85); // clock reads the referral (5d), not the signup (70d)
    });

    it("a recent click beats older referral activity", () => {
      const score = calculateWarmthScore(
        [{ event_type: "clicked", created_at: daysAgo(2) }],
        1,
        false,
        daysAgo(70),
        daysAgo(10)
      );
      expect(score).toBe(90); // 70 + 5 + 15, clock reads the click (2d)
    });

    it("old referral activity does not stop decay", () => {
      const score = calculateWarmthScore(
        [],
        1,
        false,
        daysAgo(70),
        daysAgo(70)
      );
      expect(score).toBe(60); // 70 + 15 - 25 = 60 (clock is 70d)
    });
  });
});

describe("assignTier", () => {
  it("never returns null — score 0 is cold", () => {
    expect(assignTier(0)).toBe("cold");
    expect(assignTier(0)).not.toBeNull();
  });

  it("returns cold for score 1-39", () => {
    expect(assignTier(1)).toBe("cold");
    expect(assignTier(20)).toBe("cold");
    expect(assignTier(39)).toBe("cold");
  });

  it("returns warm for score 40-69", () => {
    expect(assignTier(40)).toBe("warm");
    expect(assignTier(55)).toBe("warm");
    expect(assignTier(69)).toBe("warm");
  });

  it("returns hot for score 70+", () => {
    expect(assignTier(70)).toBe("hot");
    expect(assignTier(85)).toBe("hot");
    expect(assignTier(100)).toBe("hot");
  });
});

describe("scoreSubscriber", () => {
  it("fresh signup with no signals is Hot at baseline 70", () => {
    const result = scoreSubscriber({
      events: [],
      referralCount: 0,
      hasQualAnswers: false,
      createdAt: daysAgo(0),
    });
    expect(result.score).toBe(70);
    expect(result.tier).toBe("hot");
  });

  it("returns cold for decayed-zero subscriber with lifetime engagement", () => {
    const result = scoreSubscriber({
      events: [{ event_type: "clicked", created_at: daysAgo(95) }],
      referralCount: 0,
      hasQualAnswers: false,
      createdAt: daysAgo(95),
    });
    expect(result.score).toBe(0); // 70 + 5 - 999 → clamped to 0
    expect(result.tier).toBe("cold");
  });

  it("returns cold (never null) for never-engaged old subscriber", () => {
    const result = scoreSubscriber({
      events: [{ event_type: "sent", created_at: daysAgo(1) }],
      referralCount: 0,
      hasQualAnswers: false,
      createdAt: daysAgo(120),
    });
    expect(result.score).toBe(0);
    expect(result.tier).toBe("cold");
  });

  it("qualification answer alone lands Hot (baseline + 8)", () => {
    const result = scoreSubscriber({
      events: [],
      referralCount: 0,
      hasQualAnswers: true,
      createdAt: daysAgo(0),
    });
    expect(result.score).toBe(78);
    expect(result.tier).toBe("hot");
  });

  it("qualification with a 70-day-old signup lands Warm after decay", () => {
    const result = scoreSubscriber({
      events: [],
      referralCount: 0,
      hasQualAnswers: true,
      createdAt: daysAgo(70),
    });
    expect(result.score).toBe(53); // 70 + 8 - 25
    expect(result.tier).toBe("warm");
  });

  it("honors referralActivityAt for the decay clock", () => {
    const result = scoreSubscriber({
      events: [],
      referralCount: 1,
      hasQualAnswers: false,
      createdAt: daysAgo(70),
      referralActivityAt: daysAgo(5),
    });
    expect(result.score).toBe(85); // 70 + 15, clock reads the referral
    expect(result.tier).toBe("hot");
  });

  it("does not return hadEngagement", () => {
    const result = scoreSubscriber({
      events: [],
      referralCount: 0,
      hasQualAnswers: false,
      createdAt: daysAgo(0),
    });
    expect(result).not.toHaveProperty("hadEngagement");
    expect(result).toEqual({ score: 70, tier: "hot" });
  });
});
