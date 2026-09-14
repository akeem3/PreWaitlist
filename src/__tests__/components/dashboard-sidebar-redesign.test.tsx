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

describe("Sidebar Redesign (12.1.0)", () => {
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

  it("renders grouped section headers", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("COMMAND CENTER")).toBeDefined();
    expect(screen.getByText("INSIGHTS")).toBeDefined();
    expect(screen.getByText("ENGAGEMENT")).toBeDefined();
    expect(screen.getByText("CONFIG")).toBeDefined();
  });

  it("shows 'Coming soon' on disabled items", () => {
    render(<Sidebar {...defaultProps} />);
    const comingSoonLabels = screen.getAllByText("Coming soon");
    expect(comingSoonLabels.length).toBeGreaterThanOrEqual(2);
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

  it("does not render dropdown chevron on product name", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const svgIcons = container.querySelectorAll("svg");
    const chevron = Array.from(svgIcons).find((svg) =>
      svg.innerHTML.includes("M6 9L12 3")
    );
    expect(chevron).toBeUndefined();
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
    expect(broadcast?.getAttribute("href")).toBe("/dashboard/broadcast");
  });
});
