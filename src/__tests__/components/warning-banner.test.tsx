import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import WarningBanner from "../../../components/dashboard/warning-banner";

function warmth(hot: number, cold: number) {
  const total = 10;
  return {
    hot,
    warm: 0,
    cold,
    unscored: total - hot - cold,
    total,
  };
}

describe("WarningBanner", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stays hidden when total is below 10 even at 100% cold", () => {
    const { container } = render(
      <WarningBanner
        coldThreshold={40}
        warmthData={{ hot: 0, warm: 0, cold: 5, unscored: 0, total: 5 }}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("stays hidden when cold percent is below threshold", () => {
    const { container } = render(
      <WarningBanner coldThreshold={40} warmthData={warmth(7, 3)} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("becomes visible when cold percent meets threshold", () => {
    render(<WarningBanner coldThreshold={40} warmthData={warmth(6, 4)} />);
    expect(
      screen.getByText(
        "40% of your list has gone cold. Consider sending a re-engagement email."
      )
    ).toBeDefined();
  });

  it("makes no fetch request when warmthData is provided", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<WarningBanner coldThreshold={40} warmthData={warmth(6, 4)} />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders nothing without warmthData and makes no request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { container } = render(<WarningBanner coldThreshold={40} />);

    expect(container.innerHTML).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
