import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAndFulfillMilestones } from "@/lib/milestones";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, isUnsubscribed } from "@/lib/email";
import { isEmailBounced } from "@/lib/bounces";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
  buildEmailFooter: vi.fn(() => "<footer>"),
  isUnsubscribed: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/bounces", () => ({
  isEmailBounced: vi.fn().mockResolvedValue(false),
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

  it("does not send any email when the persist step fails", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mock.__queue.push(
      {
        data: [{ tier_referrals: 3, reward_label: EARLY_ACCESS_LABEL }],
        error: null,
      },
      { data: subscriberRow(), error: null },
      { data: baseWaitlist, error: null },
      { data: null, error: { message: "column position_boost does not exist" } }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed to persist milestones"),
      "column position_boost does not exist"
    );
    errSpy.mockRestore();
  });

  it("logs (not throws) when sendEmail reports failure", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendEmail).mockResolvedValueOnce({
      ok: false,
      error: "rate limited",
    });
    mock.__queue.push(
      {
        data: [{ tier_referrals: 3, reward_label: EARLY_ACCESS_LABEL }],
        error: null,
      },
      { data: subscriberRow(), error: null },
      { data: baseWaitlist, error: null },
      { data: null, error: null }
    );

    await expect(
      checkAndFulfillMilestones("sub-1", "wl-1", 3)
    ).resolves.not.toThrow();

    expect(updatePayloads()).toHaveLength(1);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("Milestone email failed"),
      "rate limited"
    );
    errSpy.mockRestore();
  });

  it("persists milestones but skips the email for unsubscribed subscribers", async () => {
    vi.mocked(isUnsubscribed).mockResolvedValueOnce(true);
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
    expect(payloads[0].milestones_notified).toEqual([3]);
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("persists milestones but skips the email for bounced addresses", async () => {
    vi.mocked(isEmailBounced).mockResolvedValueOnce(true);
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

    expect(updatePayloads()).toHaveLength(1);
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("passes an idempotency key and a share link to sendEmail", async () => {
    mock.__queue.push(
      {
        data: [{ tier_referrals: 3, reward_label: EARLY_ACCESS_LABEL }],
        error: null,
      },
      {
        data: subscriberRow({ referral_code: "ref12345" }),
        error: null,
      },
      { data: { ...baseWaitlist, subdomain: "acme" }, error: null },
      { data: null, error: null }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "milestone/sub-1/3",
        html: expect.stringContaining(
          "https://acme.prewaitlist.com?ref=ref12345"
        ),
      })
    );
  });

  it("omits the share button when no referral code exists", async () => {
    mock.__queue.push(
      {
        data: [{ tier_referrals: 3, reward_label: EARLY_ACCESS_LABEL }],
        error: null,
      },
      { data: subscriberRow(), error: null },
      { data: { ...baseWaitlist, subdomain: "acme" }, error: null },
      { data: null, error: null }
    );

    await checkAndFulfillMilestones("sub-1", "wl-1", 3);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
    const html = vi.mocked(sendEmail).mock.calls[0][0]?.html;
    expect(html).not.toContain("Share &amp; Move Up");
  });
});
