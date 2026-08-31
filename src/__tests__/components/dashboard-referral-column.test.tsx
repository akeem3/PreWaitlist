import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
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

vi.mock("../../../components/share/share-copy-link", () => ({
  default: () => <div data-testid="share-copy-link" />,
}));

import DashboardClient from "../../app/dashboard/client";

describe("Dashboard Referral Column", () => {
  const baseProps = {
    liveUrl: "test.prewaitlist.com",
    waitlistName: "Test Waitlist",
    logoUrl: null,
    tier: "free",
    subdomain: "test",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders referral count for each subscriber", () => {
    const subscribers = [
      {
        id: "sub-1",
        email: "alice@test.com",
        position: 1,
        referral_count: 5,
        created_at: "2026-01-01",
      },
      {
        id: "sub-2",
        email: "bob@test.com",
        position: 2,
        referral_count: 12,
        created_at: "2026-01-02",
      },
    ];

    render(<DashboardClient {...baseProps} subscribers={subscribers} />);

    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
  });

  it("displays 0 for subscribers with no referrals", () => {
    const subscribers = [
      {
        id: "sub-1",
        email: "alice@test.com",
        position: 1,
        referral_count: 0,
        created_at: "2026-01-01",
      },
    ];

    render(<DashboardClient {...baseProps} subscribers={subscribers} />);

    const zeroCell = screen.getByText("0");
    expect(zeroCell).toBeDefined();
    expect(zeroCell.className).toContain("text-muted-foreground");
  });

  it("renders Referrals column header", () => {
    render(<DashboardClient {...baseProps} subscribers={[]} />);

    expect(screen.getByText("Referrals")).toBeDefined();
  });

  it("shows empty state when no subscribers", () => {
    render(<DashboardClient {...baseProps} subscribers={[]} />);

    expect(screen.getByText(/No subscribers yet/)).toBeDefined();
  });
});
