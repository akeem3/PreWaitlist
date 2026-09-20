import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

const mockWaitlists = [
  {
    id: "wl-1",
    subdomain: "acme",
    product_name: "Acme Waitlist",
    logo_url: null,
    is_archived: false,
    subscriberCount: 10,
  },
];

describe("Sidebar", () => {
  const defaultProps = {
    waitlists: mockWaitlists,
    activeWaitlistId: "wl-1",
    onSelectWaitlist: vi.fn(),
    isOpen: false,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/dashboard");
  });

  it("renders all navigation items", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Overview")).toBeDefined();
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
    const qualification = screen.getByText("Qualification").closest("a");
    expect(qualification).toBeDefined();
    expect(qualification).not.toHaveClass("bg-accent");
  });

  it("renders clickable nav items as links with href", () => {
    render(<Sidebar {...defaultProps} />);
    const overview = screen.getByText("Overview").closest("a");
    const settings = screen.getByText("Settings").closest("a");

    expect(overview).toHaveAttribute("href", "/dashboard?wid=wl-1");
    expect(settings).toHaveAttribute("href", "/dashboard/settings");
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
    const { default: userEvent } = await import("@testing-library/user-event");
    const onClose = vi.fn();

    render(<Sidebar {...defaultProps} isOpen={true} onClose={onClose} />);
    const backdrop = screen.getByRole("complementary")
      .previousElementSibling as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays waitlist name in sidebar header via switcher", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Acme Waitlist")).toBeDefined();
  });

  it("renders upgrade to pro link", () => {
    render(<Sidebar {...defaultProps} tier="free" />);
    expect(screen.getByText("Upgrade to add")).toBeDefined();
  });
});
