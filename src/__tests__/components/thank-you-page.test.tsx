import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Thank-you page reads subscribers via admin client (14.0 AC8)
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockSupabase,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(
    new Map([
      ["host", "test.lvh.me:3000"],
      ["x-forwarded-proto", "http"],
    ])
  ),
}));

function buildChain(data: unknown, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const resolved = { data, error };

  const methods = ["select", "eq", "order", "limit", "maybeSingle", "single"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (resolve: (v: typeof resolved) => void) => resolve(resolved);
  chain.single = vi.fn(() => Promise.resolve(resolved));
  chain.maybeSingle = vi.fn(() => Promise.resolve(resolved));
  return chain;
}

function resetMocks() {
  vi.clearAllMocks();
  mockSupabase.from.mockReset();
}

describe("Thank-you Page", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("renders position number", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 42,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByText("#42")).toBeDefined();
  });

  it("renders heading and subtitle", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByText("You're in.")).toBeDefined();
    expect(screen.getByText(/on the waitlist/)).toBeDefined();
  });

  it("renders referral link", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    const input = screen.getByRole("textbox", { name: /referral link/i });
    expect(input).toBeDefined();
    expect(input).toHaveValue("http://test.lvh.me:3000?ref=abc12345");
  });

  it("renders referral count when milestone_rewards_enabled is false", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByText("#5")).toBeDefined();
  });

  it("renders share and copy link buttons", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByRole("button", { name: /share/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("renders leaderboard link", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    const link = screen.getByText("See where you rank →");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe(
      "/test/leaderboard?subscriber_id=sub-1"
    );
  });

  it("renders Referred by a friend when referrer_id present", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: "referrer-1",
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    const mockReferrer = { email: "friend@example.com" };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(mockReferrer))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByText(/Referred by/)).toBeDefined();
  });

  it("does not render referred section for direct signup", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.queryByText(/Referred by/)).toBeNull();
  });

  it("renders PoweredByFooter when tier is free", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 5,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByText(/Powered by/i)).toBeDefined();
  });

  it("renders milestone tiers when milestone_rewards_enabled is true", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 3,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: true,
        founder_profiles: [{ tier: "free" }],
      },
    };

    const mockMilestones = [
      { tier_referrals: 1, reward_label: "Early access" },
      { tier_referrals: 5, reward_label: "Free Pro for 1 month" },
      { tier_referrals: 10, reward_label: "Lifetime 20% discount" },
    ];

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(mockMilestones))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(
      screen.getByText(/You've referred 0 of 1 friends toward: Early access/)
    ).toBeDefined();
    expect(screen.getByText("1 → Early access")).toBeDefined();
    expect(screen.getByText("5 → Free Pro for 1 month")).toBeDefined();
    expect(screen.getByText("10 → Lifetime 20% discount")).toBeDefined();
  });

  it("renders fallback text when milestone_rewards_enabled is false", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "test@example.com",
      position: 3,
      referral_code: "abc12345",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
    };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(null));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(
      screen.getByText("Share your link to move up the waitlist:")
    ).toBeDefined();
  });
});
