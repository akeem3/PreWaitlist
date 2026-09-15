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
    product_name: "My Waitlist",
    logo_url: null,
    is_archived: false,
    subscriberCount: 10,
  },
];

describe("Sidebar Redesign (12.1.0)", () => {
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

  it("renders grouped section headers", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("COMMAND CENTER")).toBeDefined();
    expect(screen.getByText("INSIGHTS")).toBeDefined();
    expect(screen.getByText("ENGAGEMENT")).toBeDefined();
    expect(screen.getByText("CONFIG")).toBeDefined();
  });

  it("shows no 'Coming soon' labels after nav unlock", () => {
    render(<Sidebar {...defaultProps} />);
    const comingSoonLabels = screen.queryAllByText("Coming soon");
    expect(comingSoonLabels.length).toBe(0);
  });

  it("shows lock icon with tooltip on locked items", () => {
    render(<Sidebar {...defaultProps} tier="free" />);
    const warmth = screen.getByText("Warmth").closest("span");
    expect(warmth?.getAttribute("title")).toBe(
      "Pro feature — upgrade to unlock"
    );

    const broadcast = screen.getByText("Broadcast").closest("span");
    expect(broadcast?.getAttribute("title")).toBe(
      "Pro feature — upgrade to unlock"
    );
  });

  it("renders upgrade button for free tier", () => {
    render(<Sidebar {...defaultProps} tier="free" />);
    expect(screen.getByText("Upgrade to Pro")).toBeDefined();
  });

  it("does not render upgrade button for pro tier", () => {
    render(<Sidebar {...defaultProps} tier="pro" />);
    expect(screen.queryByText("Upgrade to Pro")).toBeNull();
  });

  it("highlights active nav item with green pill", () => {
    render(<Sidebar {...defaultProps} />);
    const overview = screen.getByText("Overview").closest("a");
    expect(overview?.className).toContain("bg-accent");
    expect(overview?.className).toContain("font-medium");
  });

  it("broadcast is locked for free tier", () => {
    render(<Sidebar {...defaultProps} tier="free" />);
    const broadcast = screen.getByText("Broadcast").closest("span");
    expect(broadcast?.className).toContain("cursor-not-allowed");
  });

  it("broadcast is unlocked for pro tier", () => {
    render(<Sidebar {...defaultProps} tier="pro" />);
    const broadcast = screen.getByText("Broadcast").closest("a");
    expect(broadcast).toBeDefined();
    expect(broadcast?.getAttribute("href")).toBe(
      "/dashboard/broadcast?wid=wl-1"
    );
  });

  it("updates has correct href", () => {
    render(<Sidebar {...defaultProps} />);
    const updates = screen.getByText("Updates").closest("a");
    expect(updates).toBeDefined();
    expect(updates?.getAttribute("href")).toBe("/dashboard/updates?wid=wl-1");
  });

  it("qualification has correct href", () => {
    render(<Sidebar {...defaultProps} />);
    const qualification = screen.getByText("Qualification").closest("a");
    expect(qualification).toBeDefined();
    expect(qualification?.getAttribute("href")).toBe(
      "/dashboard/qualification?wid=wl-1"
    );
  });

  it("leaderboard has correct href", () => {
    render(<Sidebar {...defaultProps} />);
    const leaderboard = screen.getByText("Leaderboard").closest("a");
    expect(leaderboard).toBeDefined();
    expect(leaderboard?.getAttribute("href")).toBe(
      "/dashboard/leaderboard?wid=wl-1"
    );
  });

  it("warmth is locked for free tier", () => {
    render(<Sidebar {...defaultProps} tier="free" />);
    const warmth = screen.getByText("Warmth").closest("span");
    expect(warmth?.className).toContain("cursor-not-allowed");
    expect(warmth?.getAttribute("href")).toBeNull();
  });

  it("warmth is unlocked for pro tier", () => {
    render(<Sidebar {...defaultProps} tier="pro" />);
    const warmth = screen.getByText("Warmth").closest("a");
    expect(warmth).toBeDefined();
    expect(warmth?.getAttribute("href")).toBe("/dashboard/warmth?wid=wl-1");
  });
});
