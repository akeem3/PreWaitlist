import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

vi.mock("../../../components/dashboard/warning-banner", () => ({
  default: () => <div data-testid="warning-banner" />,
}));

import DashboardClient from "../../app/dashboard/client";

const baseProps = {
  liveUrl: "acme.prewaitlist.com",
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
  },
];

describe("Dashboard Overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stat cards with correct labels", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("Total signups")).toBeDefined();
    expect(screen.getByText("Referral %")).toBeDefined();
    expect(screen.getByText("Today")).toBeDefined();
    expect(screen.getByText("Warmth")).toBeDefined();
  });

  it("stat cards link to leaderboard", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    const links = screen.getAllByRole("link");
    const leaderboardLinks = links.filter(
      (l) => l.getAttribute("href") === "/dashboard/leaderboard"
    );
    expect(leaderboardLinks.length).toBe(3);
  });

  it("shows empty state when no subscribers", () => {
    render(<DashboardClient {...baseProps} subscribers={[]} />);
    expect(
      screen.getByText("Your waitlist is live at acme.prewaitlist.com")
    ).toBeDefined();
    expect(screen.getByText("Copy Link")).toBeDefined();
    expect(screen.getByText("View Public Page")).toBeDefined();
  });

  it("shows dashboard panels when subscribers exist", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByTestId("signup-chart")).toBeDefined();
    expect(screen.getByTestId("top-referrers")).toBeDefined();
    expect(screen.getByTestId("qualification-panel")).toBeDefined();
    expect(screen.getByTestId("warmth-panel")).toBeDefined();
  });

  it("does not show dashboard panels when empty", () => {
    render(<DashboardClient {...baseProps} subscribers={[]} />);
    expect(screen.queryByTestId("signup-chart")).toBeNull();
    expect(screen.queryByTestId("top-referrers")).toBeNull();
    expect(screen.queryByTestId("qualification-panel")).toBeNull();
    expect(screen.queryByTestId("warmth-panel")).toBeNull();
  });

  it("renders live URL", () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.getByText("acme.prewaitlist.com")).toBeDefined();
  });

  it("renders lock icon on Warmth card for free tier", () => {
    render(<DashboardClient {...baseProps} tier="free" />);
    const warmthLabel = screen.getByText("Warmth");
    expect(warmthLabel).toBeDefined();
    const warmthCard = warmthLabel.closest("div")?.parentElement;
    expect(warmthCard?.querySelector("svg")).toBeDefined();
  });
});
