import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock(
  "../../app/(public)/[subdomain]/leaderboard/leaderboard-client",
  () => ({
    LeaderboardClient: () => <div data-testid="leaderboard-client" />,
  })
);

vi.mock("../../../components/share/powered-by-footer", () => ({
  PoweredByFooter: () => <div data-testid="powered-by-footer" />,
}));

import LeaderboardPage from "../../app/(public)/[subdomain]/leaderboard/page";

function pageProps(subdomain = "acme") {
  return {
    params: Promise.resolve({ subdomain }),
    searchParams: Promise.resolve({}),
  };
}

describe("Public leaderboard archived guard (4.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
  });

  it("redirects archived waitlists to /gone", async () => {
    mockSupabase.__queue.push({
      data: {
        id: "wl-1",
        headline: "Acme",
        template: "minimal",
        is_archived: true,
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
      error: null,
    });

    await expect(LeaderboardPage(pageProps())).rejects.toThrow(
      "NEXT_REDIRECT:/acme/gone"
    );
  });

  it("renders the leaderboard for active waitlists", async () => {
    mockSupabase.__queue.push({
      data: {
        id: "wl-1",
        headline: "Acme",
        template: "minimal",
        is_archived: false,
        milestone_rewards_enabled: false,
        founder_profiles: [{ tier: "free" }],
      },
      error: null,
    });
    mockAdminSupabase.__queue.push({ data: [], error: null });

    const element = await LeaderboardPage(pageProps());
    render(element);

    expect(screen.getByTestId("leaderboard-client")).toBeTruthy();
  });
});
