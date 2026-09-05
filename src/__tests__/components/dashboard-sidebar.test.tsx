import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPathname = vi.hoisted(() => vi.fn(() => "/dashboard"));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
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
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

import { Sidebar } from "../../../components/dashboard/sidebar";

describe("Sidebar", () => {
  const defaultProps = {
    waitlistName: "My Waitlist",
    logoUrl: null as string | null,
    isOpen: false,
    onClose: vi.fn(),
    onSignOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/dashboard");
  });

  it("renders all navigation items", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Overview")).toBeDefined();
    expect(screen.getByText("Subscribers")).toBeDefined();
    expect(screen.getByText("Qualification")).toBeDefined();
    expect(screen.getByText("Leaderboard")).toBeDefined();
    expect(screen.getByText("Warmth")).toBeDefined();
    expect(screen.getByText("Updates")).toBeDefined();
    expect(screen.getByText("Broadcast")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("highlights active navigation item based on pathname", () => {
    render(<Sidebar {...defaultProps} />);
    const overview = screen.getByText("Overview").closest("a");
    expect(overview).toBeDefined();
    expect(overview).toHaveClass("bg-accent");
    expect(overview).toHaveClass("font-medium");
  });

  it("does not highlight inactive navigation items", () => {
    render(<Sidebar {...defaultProps} />);
    const subscribers = screen.getByText("Subscribers").closest("a");
    expect(subscribers).toBeDefined();
    expect(subscribers).not.toHaveClass("bg-accent");
  });

  it("renders disabled items with opacity and no href", () => {
    render(<Sidebar {...defaultProps} />);
    const qualification = screen.getByText("Qualification").closest("span");
    const leaderboard = screen.getByText("Leaderboard").closest("span");
    const updates = screen.getByText("Updates").closest("span");
    const settings = screen.getByText("Settings").closest("span");

    expect(qualification?.className).toContain("opacity-50");
    expect(qualification?.className).toContain("cursor-not-allowed");
    expect(qualification).not.toHaveAttribute("href");

    expect(leaderboard?.className).toContain("opacity-50");
    expect(leaderboard).not.toHaveAttribute("href");

    expect(updates?.className).toContain("opacity-50");
    expect(updates).not.toHaveAttribute("href");

    expect(settings?.className).toContain("opacity-50");
    expect(settings).not.toHaveAttribute("href");
  });

  it("renders locked items with lock icon and no href", () => {
    render(<Sidebar {...defaultProps} />);
    const warmth = screen.getByText("Warmth").closest("span");
    const broadcast = screen.getByText("Broadcast").closest("span");

    expect(warmth?.className).toContain("opacity-50");
    expect(warmth?.className).toContain("cursor-not-allowed");
    expect(warmth).not.toHaveAttribute("href");

    expect(broadcast?.className).toContain("opacity-50");
    expect(broadcast).not.toHaveAttribute("href");
  });

  it("renders clickable nav items as links with href", () => {
    render(<Sidebar {...defaultProps} />);
    const overview = screen.getByText("Overview").closest("a");
    const subscribers = screen.getByText("Subscribers").closest("a");

    expect(overview).toHaveAttribute("href", "/dashboard");
    expect(subscribers).toHaveAttribute("href", "/dashboard");
  });

  it("toggles mobile sidebar visibility", () => {
    const { rerender } = render(<Sidebar {...defaultProps} isOpen={false} />);
    const aside = screen.getByRole("complementary");
    expect(aside.className).toContain("-translate-x-full");

    rerender(<Sidebar {...defaultProps} isOpen={true} />);
    expect(aside.className).toContain("translate-x-0");
  });

  it("shows backdrop overlay when sidebar is open on mobile", () => {
    const { rerender } = render(<Sidebar {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByRole("complementary").previousElementSibling
    ).toBeNull();

    rerender(<Sidebar {...defaultProps} isOpen={true} />);
    const backdrop = screen.getByRole("complementary").previousElementSibling;
    expect(backdrop).toBeDefined();
    expect(backdrop?.className).toContain("bg-black/50");
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Sidebar {...defaultProps} isOpen={true} onClose={onClose} />);
    const backdrop = screen.getByRole("complementary")
      .previousElementSibling as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays waitlist name in sidebar header", () => {
    render(<Sidebar {...defaultProps} waitlistName="Acme Waitlist" />);
    expect(screen.getByText("Acme Waitlist")).toBeDefined();
  });

  it("falls back to PreWaitlist when no waitlist name", () => {
    render(<Sidebar {...defaultProps} waitlistName={null} />);
    expect(screen.getByText("PreWaitlist")).toBeDefined();
  });

  it("renders sign out button", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Sign out")).toBeDefined();
  });

  it("calls onSignOut when sign out is clicked", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    render(<Sidebar {...defaultProps} onSignOut={onSignOut} />);
    await user.click(screen.getByText("Sign out"));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("renders upgrade to pro link", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Upgrade to pro")).toBeDefined();
  });
});
