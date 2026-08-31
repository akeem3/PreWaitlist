import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
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
  const resolved = { data, error };
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
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

describe("Referred Variant Display", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("shows Referred by a friend when referrer_id present", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "newuser@example.com",
      position: 10,
      referral_code: "xyz999",
      referrer_id: "referrer-1",
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        founder_profiles: [{ tier: "free" }],
      },
    };

    const mockReferrer = { email: "friend@example.com" };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(mockReferrer));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "xyz999",
      }),
    });

    render(element);

    expect(screen.getByText(/Referred by/)).toBeDefined();
  });

  it("shows referrer first name from email", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "newuser@example.com",
      position: 10,
      referral_code: "xyz999",
      referrer_id: "referrer-1",
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
        founder_profiles: [{ tier: "free" }],
      },
    };

    const mockReferrer = { email: "friend@example.com" };

    mockSupabase.from
      .mockReturnValueOnce(buildChain(mockSubscriber))
      .mockReturnValueOnce(buildChain(mockReferrer));

    const mod = await import("../../app/(public)/[subdomain]/thank-you/page");
    const ThankYouPage = mod.default;

    const element = await ThankYouPage({
      params: Promise.resolve({ subdomain: "test" }),
      searchParams: Promise.resolve({
        subscriber_id: "sub-1",
        referral_code: "xyz999",
      }),
    });

    render(element);

    expect(screen.getByText("Friend")).toBeDefined();
  });

  it("does not show referred section when referrer_id is null", async () => {
    const mockSubscriber = {
      id: "sub-1",
      email: "newuser@example.com",
      position: 10,
      referral_code: "xyz999",
      referrer_id: null,
      waitlists: {
        id: "wl-1",
        subdomain: "test",
        headline: "Test",
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
        referral_code: "xyz999",
      }),
    });

    render(element);

    expect(screen.queryByText(/Referred by/)).toBeNull();
  });
});
