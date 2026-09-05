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
  },
  {
    id: "2",
    email: "bob@example.com",
    position: 2,
    referral_code: "def456",
    referral_count: 0,
    created_at: "2026-08-21T10:00:00Z",
  },
  {
    id: "3",
    email: "charlie@test.com",
    position: 3,
    referral_code: "ghi789",
    referral_count: 2,
    created_at: "2026-08-22T10:00:00Z",
  },
];

describe("Subscriber Table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 4 column headers", () => {
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);
    expect(screen.getByText("#")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Date")).toBeDefined();
    expect(screen.getByText("Referrals")).toBeDefined();
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

  it("navigates to subscriber detail on row click", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    await user.click(screen.getByText("alice@example.com"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/subscribers/1");
  });

  it("sorts by referrals when Referrals header is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    await user.click(screen.getByText("Referrals"));

    const emails = screen.getAllByText(/@(example|test)\.com/);
    expect(emails[0].textContent).toBe("alice@example.com");
    expect(emails[1].textContent).toBe("charlie@test.com");
    expect(emails[2].textContent).toBe("bob@example.com");
  });

  it("shows sort indicator when column is active", async () => {
    const user = userEvent.setup();
    render(<DashboardClient {...baseProps} subscribers={mockSubscribers} />);

    expect(screen.getByText("↑")).toBeDefined();

    await user.click(screen.getByText("Referrals"));
    expect(screen.getByText("↓")).toBeDefined();
  });
});
