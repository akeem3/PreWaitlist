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
    expect(input).toHaveValue("https://test.prewaitlist.com?ref=abc12345");
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
        referral_code: "abc12345",
      }),
    });

    render(element);

    expect(screen.getByText("Referred by a friend")).toBeDefined();
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

    expect(screen.queryByText("Referred by a friend")).toBeNull();
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
});
