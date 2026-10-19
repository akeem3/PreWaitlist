import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation redirect — throw to capture redirect target
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

// Mock next/headers cookies — default to no progress cookie; individual
// tests override via mockCookiesGet.
const mockCookiesGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => mockCookiesGet(name),
    }),
}));

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockSupabaseFrom = vi.fn();
vi.mock("../../lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockSupabaseFrom,
    }),
}));

import { OnboardingGuard } from "../../components/auth/onboarding-guard";

function mockFreeFounder(waitlistCount: number) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { tier: "free" },
      error: null,
    }),
  };
  const countChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: { count: number }) => void) =>
      resolve({ count: waitlistCount })
    ),
  };

  mockSupabaseFrom
    .mockReturnValueOnce(chain) // founder_profiles query
    .mockReturnValueOnce(countChain); // waitlists count query
}

describe("OnboardingGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
  });

  it("allows free user with 0 waitlists", async () => {
    mockFreeFounder(0);

    render(
      await OnboardingGuard({
        children: <div data-testid="child">Content</div>,
      })
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects free user with 1 waitlist and no draft cookie to /dashboard", async () => {
    mockFreeFounder(1);

    await expect(
      OnboardingGuard({ children: <div>Content</div> })
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  // QA Batch 2 TC-ONB-14a: mid-flow resume — free founder with an existing
  // waitlist AND an in-progress draft cookie must not be bounced.
  it("allows free user with 1 waitlist when the progress cookie marks a mid-flow draft", async () => {
    mockFreeFounder(1);
    mockCookiesGet.mockImplementation((name: string) =>
      name === "onboarding_in_progress" ? { value: "1" } : undefined
    );

    render(
      await OnboardingGuard({
        children: <div data-testid="child">Content</div>,
      })
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects free user with a progress cookie whose value is not 1", async () => {
    mockFreeFounder(1);
    mockCookiesGet.mockImplementation((name: string) =>
      name === "onboarding_in_progress" ? { value: "0" } : undefined
    );

    await expect(
      OnboardingGuard({ children: <div>Content</div> })
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("allows pro user with any waitlist count", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { tier: "pro" },
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValueOnce(chain);

    render(
      await OnboardingGuard({
        children: <div data-testid="child">Content</div>,
      })
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("passes through unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(
      await OnboardingGuard({
        children: <div data-testid="child">Content</div>,
      })
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });
});
