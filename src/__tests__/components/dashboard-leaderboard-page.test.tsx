import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard/leaderboard"),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("../../../src/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn() },
  }),
}));

import LeaderboardClient from "../../app/dashboard/leaderboard/client";

const makeRows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sub-${i}`,
    email: `user${i}@example.com`,
    referral_count: count - i,
    quality_score: i % 3 === 0 ? Math.round((i / count) * 100) : null,
    created_at: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    rank: i + 1,
  }));

describe("Dashboard Leaderboard Page", () => {
  const defaultProps = {
    rows: makeRows(15),
    totalCount: 15,
    waitlistName: "Test",
    logoUrl: null,
    tier: "pro",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ranked subscribers", () => {
    render(<LeaderboardClient {...defaultProps} />);
    expect(screen.getByText("user0@example.com")).toBeDefined();
    expect(screen.getByText("user9@example.com")).toBeDefined();
  });

  it("displays referral counts", () => {
    render(<LeaderboardClient {...defaultProps} />);
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("14")).toBeDefined();
  });

  it("paginates at 10 rows", () => {
    render(<LeaderboardClient {...defaultProps} />);
    expect(
      screen.getByText(
        (content) => content.includes("Showing 1") && content.includes("of 15")
      )
    ).toBeDefined();
    expect(
      screen.getByText((content) => content.includes("Next"))
    ).toBeDefined();
    expect(
      screen.queryByText((content) => content.includes("Previous"))
    ).toBeNull();
  });

  it("navigates to next page", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient {...defaultProps} />);
    const nextBtn = screen.getByText((content) => content.includes("Next"));
    await user.click(nextBtn);
    expect(
      screen.getByText(
        (content) => content.includes("Showing 11") && content.includes("of 15")
      )
    ).toBeDefined();
  });

  it("shows empty state", () => {
    render(<LeaderboardClient {...defaultProps} rows={[]} totalCount={0} />);
    expect(
      screen.getByText(
        "No subscribers yet. Share your waitlist to get started."
      )
    ).toBeDefined();
  });

  it("displays quality scores", () => {
    render(<LeaderboardClient {...defaultProps} />);
    expect(screen.getByText("0")).toBeDefined();
  });

  it("shows em-dash for null quality scores", () => {
    render(<LeaderboardClient {...defaultProps} />);
    const emDashes = screen.getAllByText("—");
    expect(emDashes.length).toBeGreaterThan(0);
  });

  it("displays rank column", () => {
    render(
      <LeaderboardClient {...defaultProps} rows={makeRows(3)} totalCount={3} />
    );
    expect(screen.getByText("Rank")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Referrals")).toBeDefined();
  });
});
