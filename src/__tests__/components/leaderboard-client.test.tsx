import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeaderboardClient } from "@/app/(public)/[subdomain]/leaderboard/leaderboard-client";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

const mockRows = [
  {
    id: "1",
    name: "j••••n@example.com",
    referral_count: 15,
    qualified_count: 3,
    rank: 1,
  },
  {
    id: "2",
    name: "a••••e@test.com",
    referral_count: 8,
    qualified_count: 1,
    rank: 2,
  },
  {
    id: "3",
    name: "m••••y@demo.com",
    referral_count: 2,
    qualified_count: 0,
    rank: 3,
  },
];

describe("LeaderboardClient", () => {
  it("renders subscribers ranked by referral count", () => {
    render(
      <LeaderboardClient rows={mockRows} totalCount={3} subdomain="test" />
    );
    expect(screen.getByText("j••••n@example.com")).toBeDefined();
    expect(screen.getByText("a••••e@test.com")).toBeDefined();
    expect(screen.getByText("m••••y@demo.com")).toBeDefined();
  });

  it("displays referral counts", () => {
    render(
      <LeaderboardClient rows={mockRows} totalCount={3} subdomain="test" />
    );
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("8")).toBeDefined();
  });

  it("displays qualified count", () => {
    render(
      <LeaderboardClient rows={mockRows} totalCount={3} subdomain="test" />
    );
    expect(screen.getAllByText(/qualified/)).toHaveLength(3);
  });

  it("shows empty state when no subscribers", () => {
    render(<LeaderboardClient rows={[]} totalCount={0} subdomain="test" />);
    expect(screen.getByText(/No subscribers yet/)).toBeDefined();
    expect(screen.getByText("Join the waitlist")).toBeDefined();
  });

  it("paginates at 10 rows with prev/next navigation", async () => {
    const user = userEvent.setup();
    const manyRows = Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      name: `user${i + 1}@test.com`,
      referral_count: 15 - i,
      qualified_count: i,
      rank: i + 1,
    }));

    render(
      <LeaderboardClient rows={manyRows} totalCount={15} subdomain="test" />
    );

    expect(screen.getByText("Showing 1–10 of 15")).toBeDefined();
    expect(screen.getByText("Next →")).toBeDefined();
    expect(screen.queryByText("← Previous")).toBeNull();

    await user.click(screen.getByText("Next →"));

    expect(screen.getByText("Showing 11–15 of 15")).toBeDefined();
    expect(screen.getByText("← Previous")).toBeDefined();
    expect(screen.queryByText("Next →")).toBeNull();

    await user.click(screen.getByText("← Previous"));

    expect(screen.getByText("Showing 1–10 of 15")).toBeDefined();
    expect(screen.queryByText("← Previous")).toBeNull();
    expect(screen.getByText("Next →")).toBeDefined();
  });

  describe("neighborhood view", () => {
    const manyRows = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      name: `user${i + 1}@test.com`,
      referral_count: 20 - i,
      qualified_count: 0,
      rank: i + 1,
    }));

    it("shows neighborhood centered on subscriber when currentSubscriberId provided", () => {
      render(
        <LeaderboardClient
          rows={manyRows}
          totalCount={20}
          subdomain="test"
          currentSubscriberId="10"
        />
      );
      // Rank 10 subscriber, neighborhood = ranks 5-15 (5 above, 5 below)
      expect(screen.getByText("Your position: #10 of 20")).toBeDefined();
      expect(screen.getByText("user5@test.com")).toBeDefined();
      expect(screen.getByText("user10@test.com")).toBeDefined();
      expect(screen.getByText("user15@test.com")).toBeDefined();
      // Should NOT show rank 1 or rank 20 in neighborhood
      expect(screen.queryByText("user1@test.com")).toBeNull();
      expect(screen.queryByText("user20@test.com")).toBeNull();
    });

    it("highlights subscriber row with 'You' badge", () => {
      render(
        <LeaderboardClient
          rows={manyRows}
          totalCount={20}
          subdomain="test"
          currentSubscriberId="10"
        />
      );
      const youBadge = screen.getByText("You");
      expect(youBadge).toBeDefined();
      // The row should have the accent highlight class
      const row = youBadge.closest("div");
      expect(row?.className).toContain("border-l-accent");
    });

    it("clamps neighborhood start at rank 1 for top subscribers", () => {
      render(
        <LeaderboardClient
          rows={manyRows}
          totalCount={20}
          subdomain="test"
          currentSubscriberId="3"
        />
      );
      // Rank 3, neighborhood = ranks 1-8 (clamped from -2 to 8)
      expect(screen.getByText("user1@test.com")).toBeDefined();
      expect(screen.getByText("user3@test.com")).toBeDefined();
      expect(screen.getByText("user8@test.com")).toBeDefined();
      expect(screen.queryByText("user9@test.com")).toBeNull();
    });

    it("clamps neighborhood end at last rank for bottom subscribers", () => {
      render(
        <LeaderboardClient
          rows={manyRows}
          totalCount={20}
          subdomain="test"
          currentSubscriberId="18"
        />
      );
      // Rank 18, neighborhood = ranks 13-20 (clamped from 13 to 23)
      expect(screen.getByText("user13@test.com")).toBeDefined();
      expect(screen.getByText("user18@test.com")).toBeDefined();
      expect(screen.getByText("user20@test.com")).toBeDefined();
      expect(screen.queryByText("user12@test.com")).toBeNull();
    });

    it("toggles to full leaderboard view", async () => {
      const user = userEvent.setup();
      render(
        <LeaderboardClient
          rows={manyRows}
          totalCount={20}
          subdomain="test"
          currentSubscriberId="10"
        />
      );
      // Starts in neighborhood view
      expect(screen.getByText("Your position: #10 of 20")).toBeDefined();
      expect(screen.queryByText("Showing 1–10 of 20")).toBeNull();

      // Click toggle to full view
      await user.click(screen.getByText("View full leaderboard"));

      // Now in full paginated view
      expect(screen.getByText("Showing 1–10 of 20")).toBeDefined();
      expect(screen.getByText("user1@test.com")).toBeDefined();
      expect(screen.getByText("user10@test.com")).toBeDefined();
      expect(screen.getByText("Show my position")).toBeDefined();

      // Click toggle back to neighborhood
      await user.click(screen.getByText("Show my position"));
      expect(screen.getByText("Your position: #10 of 20")).toBeDefined();
    });

    it("does not show neighborhood when currentSubscriberId is not provided", () => {
      render(
        <LeaderboardClient rows={manyRows} totalCount={20} subdomain="test" />
      );
      expect(screen.queryByText("Show my position")).toBeNull();
      expect(screen.queryByText("View full leaderboard")).toBeNull();
      expect(screen.getByText("Showing 1–10 of 20")).toBeDefined();
    });
  });
});
