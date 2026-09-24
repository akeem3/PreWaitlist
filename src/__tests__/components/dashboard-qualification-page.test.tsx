import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("../../../components/dashboard/qualification-panel", () => ({
  default: ({
    subdomain,
    waitlistId,
  }: {
    subdomain: string;
    waitlistId?: string;
  }) => (
    <div
      data-testid="qualification-panel"
      data-subdomain={subdomain}
      data-waitlist-id={waitlistId}
    >
      QualificationPanel
    </div>
  ),
}));

import QualificationClient from "../../app/dashboard/qualification/client";

describe("Dashboard Qualification Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    expect(
      screen.getByRole("heading", { name: "Qualification" })
    ).toBeDefined();
  });

  it("renders qualification panel with subdomain", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    const panel = screen.getByTestId("qualification-panel");
    expect(panel).toBeDefined();
    expect(panel.getAttribute("data-subdomain")).toBe("acme");
  });

  it("passes waitlistId to qualification panel", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-123" />);
    const panel = screen.getByTestId("qualification-panel");
    expect(panel.getAttribute("data-waitlist-id")).toBe("wl-123");
  });

  it("renders Edit questions link to settings qualification tab", () => {
    render(<QualificationClient subdomain="acme" waitlistId="wl-1" />);
    const link = screen.getByRole("link", { name: "Edit questions" });
    expect(link.getAttribute("href")).toBe(
      "/dashboard/wl-1/settings?tab=qualification"
    );
  });

  it("uses dashboard content width (max-w-6xl) (AC2)", () => {
    const { container } = render(
      <QualificationClient subdomain="acme" waitlistId="wl-1" />
    );
    expect(container.firstChild).toHaveClass("max-w-6xl");
  });
});
