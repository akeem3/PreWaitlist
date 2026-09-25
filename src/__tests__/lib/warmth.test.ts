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
  it("returns 0 for subscriber with no events and no referrals", () => {
    const score = calculateWarmthScore([], 0, false, daysAgo(0));
    expect(score).toBe(0);
  });

  it("calculates score from email clicks", () => {
    const events = [
      { event_type: "clicked", created_at: daysAgo(1) },
      { event_type: "clicked", created_at: daysAgo(2) },
    ];
    const score = calculateWarmthScore(events, 0, false, daysAgo(0));
    expect(score).toBe(10); // 2 clicks * 5
  });

  it("calculates score from referrals", () => {
    const score = calculateWarmthScore([], 3, false, daysAgo(0));
    expect(score).toBe(45); // 3 referrals * 15
  });

  it("calculates score from qualification answers", () => {
    const score = calculateWarmthScore([], 0, true, daysAgo(0));
    expect(score).toBe(8);
  });

  it("combines multiple signals", () => {
    const events = [
      { event_type: "clicked", created_at: daysAgo(1) },
      { event_type: "clicked", created_at: daysAgo(3) },
    ];
    const score = calculateWarmthScore(events, 2, true, daysAgo(0));
    expect(score).toBe(48); // 2 clicks * 5 + 2 referrals * 15 + qual 8
  });

  it("clamps score to 100 maximum", () => {
    const events = Array.from({ length: 20 }, () => ({
      event_type: "clicked" as string,
      created_at: daysAgo(1),
    }));
    const score = calculateWarmthScore(events, 10, true, daysAgo(0));
    expect(score).toBe(100); // 20*5 + 10*15 + 8 = 258 → clamped to 100
  });

  it("clamps score to 0 minimum after decay", () => {
    const events = [{ event_type: "clicked", created_at: daysAgo(100) }];
    const score = calculateWarmthScore(events, 0, false, daysAgo(0));
    expect(score).toBe(0); // 5 - 999 = -994 → clamped to 0
  });

  it("counts only clicked events for click signal", () => {
    const events = [
      { event_type: "delivered", created_at: daysAgo(1) },
      { event_type: "opened", created_at: daysAgo(1) },
      { event_type: "bounced", created_at: daysAgo(1) },
    ];
    const score = calculateWarmthScore(events, 0, false, daysAgo(0));
    expect(score).toBe(0); // non-click events don't contribute
  });

  describe("time decay", () => {
    it("applies no penalty for events within 59 days", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(30) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(5); // no decay penalty
    });

    it("applies no penalty at exactly 59 days", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(59) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(5); // day 59 is still in the grace window
    });

    it("applies -25 penalty at exactly 60 days", () => {
      const events = Array.from({ length: 6 }, () => ({
        event_type: "clicked" as string,
        created_at: daysAgo(60),
      }));
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(5); // 6*5 = 30 - 25 = 5 (not the 999 reset)
    });

    it("applies -25 penalty for events 60-89 days old", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(70) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(0); // 5 - 25 = -20 → clamped to 0
    });

    it("resets to 0 for events 90+ days old", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(95) }];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(0); // 5 - 999 = -994 → clamped to 0
    });

    it("resets to 0 at exactly 90 days", () => {
      const events = Array.from({ length: 6 }, () => ({
        event_type: "clicked" as string,
        created_at: daysAgo(90),
      }));
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(0); // 30 - 999 → clamped to 0 (999 reset, not -25)
    });

    it("uses the most recent click for decay calculation", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(100) }, // old event
        { event_type: "clicked", created_at: daysAgo(10) }, // recent event
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(10); // 2 clicks * 5, no decay (most recent is 10 days ago)
    });

    it("applies decay based on most recent click, not oldest", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(5) }, // recent
        { event_type: "clicked", created_at: daysAgo(100) }, // old
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(10); // most recent is 5 days ago → no decay
    });

    it("handles multiple events all within grace period", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(10) },
        { event_type: "clicked", created_at: daysAgo(20) },
        { event_type: "clicked", created_at: daysAgo(30) },
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(15); // 3 clicks * 5, no decay
    });

    it("penalizes even with recent events if most recent click is 60+ days", () => {
      const events = [{ event_type: "clicked", created_at: daysAgo(65) }];
      const score = calculateWarmthScore(events, 1, false, daysAgo(0));
      expect(score).toBe(0); // 5 + 15 - 25 = -5 → clamped to 0
    });

    it("ignores sent/delivered events when computing the decay clock", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(70) },
        { event_type: "sent", created_at: daysAgo(0) },
        { event_type: "delivered", created_at: daysAgo(0) },
      ];
      const score = calculateWarmthScore(events, 2, false, daysAgo(0));
      expect(score).toBe(10); // 5 + 30 - 25 = 10; sent/delivered did not reset the clock
    });

    it("shows no decay when the latest click is 10d ago even if sent is 0d ago", () => {
      const events = [
        { event_type: "clicked", created_at: daysAgo(10) },
        { event_type: "sent", created_at: daysAgo(0) },
      ];
      const score = calculateWarmthScore(events, 0, false, daysAgo(0));
      expect(score).toBe(5); // decay reads the latest click (10d); sent is ignored
    });

    it("decays from subscribers.created_at when there are zero clicks", () => {
      const events = [{ event_type: "sent", created_at: daysAgo(1) }];
      const score = calculateWarmthScore(events, 1, false, daysAgo(100));
      expect(score).toBe(0); // no clicks → reference createdAt 100d old → 999 reset
    });
  });
});

describe("assignTier", () => {
  it("returns null for score 0 with no engagement", () => {
    expect(assignTier(0)).toBeNull();
    expect(assignTier(0, false)).toBeNull();
  });

  it("returns cold for score 0 with lifetime engagement", () => {
    expect(assignTier(0, true)).toBe("cold");
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
  it("returns cold for zero score with lifetime engagement", () => {
    const result = scoreSubscriber({
      events: [{ event_type: "clicked", created_at: daysAgo(95) }],
      referralCount: 0,
      hasQualAnswers: false,
      createdAt: daysAgo(95),
    });
    expect(result.score).toBe(0); // 5 - 999 → clamped to 0
    expect(result.hadEngagement).toBe(true);
    expect(result.tier).toBe("cold");
  });

  it("returns null for never-engaged subscriber at any age", () => {
    const result = scoreSubscriber({
      events: [{ event_type: "sent", created_at: daysAgo(1) }],
      referralCount: 0,
      hasQualAnswers: false,
      createdAt: daysAgo(120),
    });
    expect(result.score).toBe(0);
    expect(result.hadEngagement).toBe(false);
    expect(result.tier).toBeNull();
  });

  it("returns cold for engaged subscriber above zero but below 40", () => {
    const result = scoreSubscriber({
      events: [],
      referralCount: 0,
      hasQualAnswers: true,
      createdAt: daysAgo(0),
    });
    expect(result.score).toBe(8);
    expect(result.hadEngagement).toBe(true);
    expect(result.tier).toBe("cold");
  });
});
