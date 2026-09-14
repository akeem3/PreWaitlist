import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard/qualification"),
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

vi.mock("../../../components/dashboard/qualification-panel", () => ({
  default: ({ subdomain }: { subdomain: string }) => (
    <div data-testid="qualification-panel" data-subdomain={subdomain}>
      QualificationPanel
    </div>
  ),
}));

import QualificationClient from "../../app/dashboard/qualification/client";

describe("Dashboard Qualification Page", () => {
  const defaultProps = {
    subdomain: "acme",
    waitlistName: "Test",
    logoUrl: null,
    tier: "pro",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", () => {
    render(<QualificationClient {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "Qualification" })
    ).toBeDefined();
  });

  it("renders qualification panel with subdomain", () => {
    render(<QualificationClient {...defaultProps} />);
    const panel = screen.getByTestId("qualification-panel");
    expect(panel).toBeDefined();
    expect(panel.getAttribute("data-subdomain")).toBe("acme");
  });

  it("renders sidebar", () => {
    render(<QualificationClient {...defaultProps} />);
    expect(screen.getByText("Overview")).toBeDefined();
    expect(screen.getByText("Subscribers")).toBeDefined();
  });

  it("displays waitlist name in sidebar", () => {
    render(<QualificationClient {...defaultProps} waitlistName="Acme" />);
    expect(screen.getByText("Acme")).toBeDefined();
  });

  it("shows hamburger menu on mobile", () => {
    render(<QualificationClient {...defaultProps} />);
    const hamburger = screen.getByRole("button", { name: "" });
    expect(hamburger).toBeDefined();
  });
});
