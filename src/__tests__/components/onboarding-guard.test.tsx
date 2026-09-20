import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation redirect — throw to capture redirect target
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
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

describe("OnboardingGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows free user with 0 waitlists", async () => {
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
        resolve({ count: 0 })
      ),
    };

    mockSupabaseFrom
      .mockReturnValueOnce(chain) // founder_profiles query
      .mockReturnValueOnce(countChain); // waitlists count query

    render(
      await OnboardingGuard({
        children: <div data-testid="child">Content</div>,
      })
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects free user with 1 waitlist to /dashboard", async () => {
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
        resolve({ count: 1 })
      ),
    };

    mockSupabaseFrom.mockReturnValueOnce(chain).mockReturnValueOnce(countChain);

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
