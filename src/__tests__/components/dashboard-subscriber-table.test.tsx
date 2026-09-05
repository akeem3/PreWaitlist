import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("../../../components/dashboard/signup-chart", () => ({
  default: () => <div data-testid="signup-chart" />,
}));

vi.mock("../../../components/dashboard/qualification-panel", () => ({
  default: () => <div data-testid="qualification-panel" />,
}));

vi.mock("../../../components/dashboard/top-referrers", () => ({
  default: () => <div data-testid="top-referrers" />,
}));

vi.mock("../../../components/dashboard/warmth-panel", () => ({
  default: () => <div data-testid="warmth-panel" />,
}));

import DashboardClient from "../../app/dashboard/client";

const baseProps = {
  liveUrl: "acme.prewaitlist.com",
  waitlistName: "Acme",
  logoUrl: null,
  tier: "free",
  subdomain: "acme",
};

const mockSubscribers = [
  {
    id: "1",
    email: "alice@example.com",
    position: 1,
    referral_code: "abc123",
    referral_count: 5,
    created_at: "2026-08-20T10:00:00Z",
    warmth_score: null,
    quality_score: 71,
    qual_answers: null,
  },
  {
    id: "2",
    email: "bob@example.com",
    position: 2,
    referral_code: "def456",
    referral_count: 0,
    created_at: "2026-08-21T10:00:00Z",
    warmth_score: null,
    quality_score: null,
    qual_answers: null,
  },
  {
    id: "3",
    email: "charlie@test.com",
    position: 3,
    referral_code: "ghi789",
    referral_count: 2,
    created_at: "2026-08-22T10:00:00Z",
    warmth_score: null,
    quality_score: 29,
    qual_answers: null,
  },
];

describe("Subscriber Table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 6 column headers", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("#")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Date")).toBeDefined();
    expect(screen.getByText("Referrals")).toBeDefined();
    expect(screen.getByText("Quality")).toBeDefined();
    expect(screen.getAllByText("Warmth").length).toBeGreaterThanOrEqual(1);
  });

  it("renders subscriber emails", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("alice@example.com")).toBeDefined();
    expect(screen.getByText("bob@example.com")).toBeDefined();
    expect(screen.getByText("charlie@test.com")).toBeDefined();
  });

  it("renders subscriber positions", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3")).toBeDefined();
  });

  it("formats signup dates as YYYY-MM-DD", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("2026-08-20")).toBeDefined();
    expect(screen.getByText("2026-08-21")).toBeDefined();
    expect(screen.getByText("2026-08-22")).toBeDefined();
  });

  it("renders referral counts", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("shows subscriber count", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("3 subscribers")).toBeDefined();
  });

  it("filters subscribers by email search", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    const searchInput = screen.getByPlaceholderText("Search by email");
    await user.type(searchInput, "alice");

    expect(screen.getByText("alice@example.com")).toBeDefined();
    expect(screen.queryByText("bob@example.com")).toBeNull();
    expect(screen.queryByText("charlie@test.com")).toBeNull();
    expect(screen.getByText("1 subscriber")).toBeDefined();
  });

  it("shows no match message when search has no results", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    const searchInput = screen.getByPlaceholderText("Search by email");
    await user.type(searchInput, "zzz");

    expect(screen.getByText("No subscribers match your search.")).toBeDefined();
  });

  it("shows empty state when no subscribers", () => {
    render(<DashboardClient {...baseProps} subscribers={[]} />);
    expect(
      screen.getByText("No subscribers yet. Share your link to get started.")
    ).toBeDefined();
  });

  it("expands row on click to show details", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    await user.click(screen.getByText("alice@example.com"));
    expect(screen.getByText("View full profile →")).toBeDefined();
    expect(screen.getByText("#1")).toBeDefined();
  });

  it("sorts by referrals when Referrals header is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    const referralsButton = screen
      .getAllByText("Referrals")
      .find((el) => el.tagName === "BUTTON");
    await user.click(referralsButton!);

    const emails = screen.getAllByText(/@(example|test)\.com/);
    expect(emails[0].textContent).toBe("alice@example.com");
    expect(emails[1].textContent).toBe("charlie@test.com");
    expect(emails[2].textContent).toBe("bob@example.com");
  });

  it("shows sort indicator when column is active", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    expect(screen.getByText("↑")).toBeDefined();

    const referralsButton = screen
      .getAllByText("Referrals")
      .find((el) => el.tagName === "BUTTON");
    await user.click(referralsButton!);
    expect(screen.getByText("↓")).toBeDefined();
  });

  it("renders quality scores", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("71%")).toBeDefined();
    expect(screen.getByText("29%")).toBeDefined();
  });
});
