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

  it("paginates at 10 rows with View More button", async () => {
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

    expect(screen.getByText("1–10 of 15")).toBeDefined();
    expect(screen.getByText("View More")).toBeDefined();

    await user.click(screen.getByText("View More"));

    expect(screen.getByText("1–15 of 15")).toBeDefined();
    expect(screen.queryByText("View More")).toBeNull();
  });
});
