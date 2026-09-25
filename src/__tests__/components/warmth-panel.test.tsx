import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import WarmthPanel from "../../../components/dashboard/warmth-panel";

const data = { hot: 1, warm: 2, cold: 3, unscored: 4, total: 10 };

function barFill(label: string): HTMLElement | null {
  const row = screen.getByText(label).closest("div") as HTMLElement | null;
  if (!row) return null;
  // Row children: [label span, track div, value span] → fill = track's child.
  const track = row.children[1] as HTMLElement | undefined;
  return (track?.firstElementChild as HTMLElement | null) ?? null;
}

describe("WarmthPanel", () => {
  it("renders Hot bar with bg-accent (not bg-status-hot)", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    const fill = barFill("Hot");
    expect(fill).not.toBeNull();
    expect(fill?.className).toContain("bg-accent");
    expect(fill?.className).not.toContain("bg-status-hot");
  });

  it("renders Warm/Cold/Unscored status classes", () => {
    render(<WarmthPanel tier="pro" warmthData={data} />);
    expect(barFill("Warm")?.className).toContain("bg-status-warm");
    expect(barFill("Cold")?.className).toContain("bg-status-cold");
    expect(barFill("Unscored")?.className).toContain("bg-muted");
  });

  it("renders em-dash values when total is 0", () => {
    render(
      <WarmthPanel
        tier="pro"
        warmthData={{ hot: 0, warm: 0, cold: 0, unscored: 0, total: 0 }}
      />
    );
    expect(screen.getAllByText("\u2014")).toHaveLength(4);
  });

  it("shows upgrade badge text on free tier", () => {
    render(<WarmthPanel tier="free" warmthData={data} />);
    expect(screen.getByText("Upgrade to target segments")).toBeDefined();
  });

  it("free tier still shows counts", () => {
    render(<WarmthPanel tier="free" warmthData={data} />);
    expect(screen.getByText("1 (10%)")).toBeDefined();
    expect(screen.getByText("2 (20%)")).toBeDefined();
    expect(screen.getByText("3 (30%)")).toBeDefined();
    expect(screen.getByText("4 (40%)")).toBeDefined();
  });
});
