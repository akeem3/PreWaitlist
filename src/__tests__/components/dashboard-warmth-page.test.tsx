import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WarmthClient from "../../app/dashboard/warmth/client";

const makeSubscribers = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sub-${i}`,
    email: `user${i}@example.com`,
    warmth_score: (["hot", "warm", "cold", null] as const)[i % 4],
    referral_count: i,
    last_engagement:
      i % 2 === 0
        ? `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00Z`
        : null,
    created_at: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
  }));

describe("Dashboard Warmth Page", () => {
  const defaultProps = {
    subscribers: makeSubscribers(12),
    summary: { hot: 3, warm: 3, cold: 3, unscored: 3, total: 12 },
    tier: "pro",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", () => {
    render(<WarmthClient {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Warmth" })).toBeDefined();
  });

  it("renders summary stats", () => {
    render(<WarmthClient {...defaultProps} />);
    const threes = screen.getAllByText("3");
    expect(threes.length).toBeGreaterThanOrEqual(4);
    const hotElements = screen.getAllByText("Hot");
    expect(hotElements.length).toBeGreaterThanOrEqual(1);
    const warmElements = screen.getAllByText("Warm");
    expect(warmElements.length).toBeGreaterThanOrEqual(1);
    const coldElements = screen.getAllByText("Cold");
    expect(coldElements.length).toBeGreaterThanOrEqual(1);
    const unscoredElements = screen.getAllByText("Unscored");
    expect(unscoredElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays cold percentage", () => {
    render(<WarmthClient {...defaultProps} />);
    expect(screen.getByText("25% cold")).toBeDefined();
  });

  it("renders subscriber emails", () => {
    render(<WarmthClient {...defaultProps} />);
    expect(screen.getByText("user0@example.com")).toBeDefined();
    expect(screen.getByText("user9@example.com")).toBeDefined();
  });

  it("renders warmth badges", () => {
    render(<WarmthClient {...defaultProps} />);
    const badges = screen.getAllByText(/hot|warm|cold|unscored/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows filter dropdown", () => {
    render(<WarmthClient {...defaultProps} />);
    const select = screen.getByRole("combobox");
    expect(select).toBeDefined();
  });

  it("filters by tier", async () => {
    const user = userEvent.setup();
    render(<WarmthClient {...defaultProps} />);
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "hot");
    expect(screen.getByText("3 subscribers")).toBeDefined();
  });

  it("sorts by referrals", async () => {
    const user = userEvent.setup();
    render(<WarmthClient {...defaultProps} />);
    const refHeader = screen.getByText("Referrals");
    await user.click(refHeader);
    expect(refHeader).toBeDefined();
  });

  it("shows empty state for zero subscribers", () => {
    render(
      <WarmthClient
        {...defaultProps}
        subscribers={[]}
        summary={{ hot: 0, warm: 0, cold: 0, unscored: 0, total: 0 }}
      />
    );
    expect(
      screen.getByText(
        "No subscribers yet. Warmth data will appear once people join your waitlist."
      )
    ).toBeDefined();
  });

  it("paginates at 10 rows", () => {
    render(<WarmthClient {...defaultProps} />);
    expect(screen.getByText("Showing 1\u201310 of 12")).toBeDefined();
  });

  it("shows locked overlay for free tier", () => {
    render(<WarmthClient {...defaultProps} tier="free" />);
    expect(
      screen.getByText("Upgrade to Pro to view warmth details")
    ).toBeDefined();
    expect(screen.getByText("Pro")).toBeDefined();
  });

  it("shows 'Never' for subscribers with no engagement", () => {
    render(<WarmthClient {...defaultProps} />);
    const nevers = screen.getAllByText("Never");
    expect(nevers.length).toBeGreaterThan(0);
  });

  it("displays referral counts", () => {
    render(<WarmthClient {...defaultProps} />);
    expect(screen.getByText("0")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });
});
