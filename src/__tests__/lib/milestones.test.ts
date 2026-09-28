import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAndFulfillMilestones } from "@/lib/milestones";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
  buildEmailFooter: vi.fn(() => "<footer>"),
}));

const SKIP_LABEL = "Skip the line!";
const EARLY_ACCESS_LABEL = "Early access";

const baseWaitlist = {
  product_name: "Acme",
  headline: "Join Acme",
  sender_name: null,
  sending_domain: null,
  business_address: null,
};

function subscriberRow(overrides: Record<string, unknown> = {}) {
  return {
    email: "ref@example.com",
    milestones_earned: [],
    milestones_notified: [],
    position: 5,
    ...overrides,
  };
}

describe("checkAndFulfillMilestones", () => {
  let mock: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabaseClient();
    vi.mocked(createAdminClient).mockReturnValue(mock as never);
  });

  function updatePayloads(): Record<string, unknown>[] {
    return mock.__calls
      .filter((c) => c.method === "update")
      .map((c) => c.args[0] as Record<string, unknown>);
  }

  it("sets position_boost on a skip-the-line award, without writing position", async () => {
    mock.__queue.push(
      { data: [{ tier_referrals: 3, reward_label: SKIP_LABEL }], error: null },
      { data: subscriberRow(), error: null },
      { data: baseWaitlist, error: null },
      { data: null, error: null }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    const payloads = updatePayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({ position_boost: true });
    expect(payloads[0]).not.toHaveProperty("position");
    expect(payloads[0].milestones_earned).toEqual([
      expect.objectContaining({ threshold: 3, label: SKIP_LABEL }),
    ]);
    expect(payloads[0].milestones_notified).toEqual([3]);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
  });

  it("does not set position_boost for a non-skip label", async () => {
    mock.__queue.push(
      {
        data: [{ tier_referrals: 3, reward_label: EARLY_ACCESS_LABEL }],
        error: null,
      },
      { data: subscriberRow(), error: null },
      { data: baseWaitlist, error: null },
      { data: null, error: null }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    const payloads = updatePayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).not.toHaveProperty("position_boost");
    expect(payloads[0]).not.toHaveProperty("position");
    expect(payloads[0].milestones_earned).toEqual([
      expect.objectContaining({ threshold: 3, label: EARLY_ACCESS_LABEL }),
    ]);
  });

  it("early-returns when the threshold is already in milestones_earned", async () => {
    mock.__queue.push(
      { data: [{ tier_referrals: 3, reward_label: SKIP_LABEL }], error: null },
      {
        data: subscriberRow({
          milestones_earned: [
            { threshold: 3, label: SKIP_LABEL, earned_at: "2026-09-01" },
          ],
          milestones_notified: [3],
        }),
        error: null,
      }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    expect(updatePayloads()).toHaveLength(0);
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("does not send email again when the threshold is already in milestones_notified", async () => {
    mock.__queue.push(
      { data: [{ tier_referrals: 3, reward_label: SKIP_LABEL }], error: null },
      {
        data: subscriberRow({ milestones_notified: [3] }),
        error: null,
      },
      { data: null, error: null }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
    const payloads = updatePayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0].milestones_earned).toEqual([
      expect.objectContaining({ threshold: 3 }),
    ]);
    expect(payloads[0].milestones_notified).toEqual([3]);
  });

  it("sends one email per new threshold on first notify", async () => {
    mock.__queue.push(
      {
        data: [
          { tier_referrals: 3, reward_label: SKIP_LABEL },
          { tier_referrals: 10, reward_label: EARLY_ACCESS_LABEL },
        ],
        error: null,
      },
      { data: subscriberRow(), error: null },
      { data: baseWaitlist, error: null },
      { data: baseWaitlist, error: null },
      { data: null, error: null }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 10);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(2);
    const subjects = vi.mocked(sendEmail).mock.calls.map((c) => c[0]?.subject);
    expect(subjects).toEqual([
      `Congratulations! You earned: ${SKIP_LABEL}`,
      `Congratulations! You earned: ${EARLY_ACCESS_LABEL}`,
    ]);
    const payloads = updatePayloads();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({ position_boost: true });
    expect(payloads[0].milestones_earned).toHaveLength(2);
    expect(payloads[0].milestones_notified).toEqual([3, 10]);
  });
});
