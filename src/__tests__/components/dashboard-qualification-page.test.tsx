import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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
});
