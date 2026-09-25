import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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

import WarmthPanel from "../../../components/dashboard/warmth-panel";

const data = { hot: 1, warm: 2, cold: 3, total: 10 };

function barFill(label: string): HTMLElement | null {
  const row = screen.getByText(label).closest("div") as HTMLElement | null;
  if (!row) return null;
  // Row children: [label span, track div, value span] → fill = track's child.
  const track = row.children[1] as HTMLElement | undefined;
  return (track?.firstElementChild as HTMLElement | null) ?? null;
}

describe("WarmthPanel", () => {
  it("renders Hot bar with bg-status-hot (design token, not accent green)", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    const fill = barFill("Hot");
    expect(fill).not.toBeNull();
    expect(fill?.className).toContain("bg-status-hot");
    expect(fill?.className).not.toContain("bg-accent");
  });

  it("renders Warm/Cold status classes — no Unscored row (restructure)", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    expect(barFill("Warm")?.className).toContain("bg-status-warm");
    expect(barFill("Cold")?.className).toContain("bg-status-cold");
    expect(screen.queryByText("Unscored")).toBeNull();
  });

  it("colors values with status tokens", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    const hotValue = screen.getByText("1 (10%)");
    expect(hotValue.className).toContain("text-status-hot");
    const warmValue = screen.getByText("2 (20%)");
    expect(warmValue.className).toContain("text-status-warm");
    const coldValue = screen.getByText("3 (30%)");
    expect(coldValue.className).toContain("text-status-cold");
  });

  it("renders em-dash values when total is 0 and hides the meta line", () => {
    render(
      <WarmthPanel
        tier="pro"
        warmthData={{ hot: 0, warm: 0, cold: 0, total: 0 }}
      />
    );
    expect(screen.getAllByText("\u2014")).toHaveLength(3);
    expect(screen.queryByText(/\d+ subscribers?/)).toBeNull();
  });

  it("shows the subscriber meta line with accent count when total > 0", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    const meta = screen.getByText("10 subscribers");
    expect(meta.className).toContain("text-accent");
  });

  it("pluralizes the meta line", () => {
    render(
      <WarmthPanel
        tier="pro"
        warmthData={{ hot: 1, warm: 0, cold: 0, total: 1 }}
      />
    );
    expect(screen.getByText("1 subscriber")).toBeDefined();
  });

  it("links the pro card title to the warmth page", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    const link = screen.getByRole("link", { name: "Warmth Distribution" });
    expect(link.getAttribute("href")).toBe("/dashboard/warmth");
  });

  it("includes wid in the title link when waitlistId is provided", () => {
    render(<WarmthPanel tier="pro" warmthData={data} waitlistId="wl-123" />);
    const link = screen.getByRole("link", { name: "Warmth Distribution" });
    expect(link.getAttribute("href")).toBe("/dashboard/warmth?wid=wl-123");
  });

  it("hides the View all action from assistive tech (single tab stop)", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    const action = screen.getByText("View all →");
    expect(action.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows upgrade badge text on free tier", () => {
    render(<WarmthPanel tier="free" warmthData={data} />);
    expect(screen.getByText("Upgrade to target segments")).toBeDefined();
  });

  it("free tier still shows counts and meta line", () => {
    render(<WarmthPanel tier="free" warmthData={data} />);
    expect(screen.getByText("1 (10%)")).toBeDefined();
    expect(screen.getByText("2 (20%)")).toBeDefined();
    expect(screen.getByText("3 (30%)")).toBeDefined();
    expect(screen.getByText("10 subscribers")).toBeDefined();
  });
});
