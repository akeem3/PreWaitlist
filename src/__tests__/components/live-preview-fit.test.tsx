import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LivePreview } from "../../../components/onboarding/live-preview";

vi.mock("next/image", () => ({
  default: ({ alt, ...rest }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...rest} alt={typeof alt === "string" ? alt : ""} />
  ),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

type ROInstance = {
  cb: ResizeObserverCallback;
  el: Element | null;
};

const roInstances: ROInstance[] = [];

class MockResizeObserver {
  private inst: ROInstance;
  constructor(cb: ResizeObserverCallback) {
    this.inst = { cb, el: null };
    roInstances.push(this.inst);
  }
  observe(el: Element) {
    this.inst.el = el;
  }
  unobserve() {}
  disconnect() {}
}

const baseProps = {
  template: "minimal" as const,
  headline: "Join the waitlist",
  subheadline: "Be first in line",
  brandColor: "#0F7A5E",
  logoUrl: null,
  ctaText: "Join Waitlist",
  milestoneRewards: [],
  slug: "acme",
};

// Mirrors BrowserFrame's available-height formula. happy-dom: innerHeight 768,
// offsetHeight 0 → header falls back to the h-9 class height (36).
const HEADER = 36;
const CHROME = HEADER + 8 + 24 + 3;
const available = Math.max(240, window.innerHeight - 96 - CHROME);

beforeEach(() => {
  roInstances.length = 0;
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fireNaturalHeight(height: number) {
  // happy-dom has no layout (scrollHeight = 0) → BrowserFrame falls back to
  // the ResizeObserver contentRect height.
  act(() => {
    for (const inst of roInstances) {
      inst.cb(
        [{ contentRect: { height } } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    }
  });
}

describe("LivePreview fit mechanism (Phase 3)", () => {
  it("grows with content when it fits — no transform, no forced height", () => {
    render(<LivePreview {...baseProps} />);
    expect(roInstances.length).toBeGreaterThan(0);
    fireNaturalHeight(400);
    expect(400).toBeLessThan(available);

    const content = screen.getByTestId("preview-content");
    const scaler = screen.getByTestId("preview-scaler");
    expect(content.style.transform).toBe("");
    expect(scaler.style.height).toBe("");
  });

  it("clamps at 0.6 and scrolls when content far exceeds the pane", () => {
    render(<LivePreview {...baseProps} />);
    fireNaturalHeight(2000);

    const content = screen.getByTestId("preview-content");
    const scaler = screen.getByTestId("preview-scaler");
    expect(content.style.transform).toBe("scale(0.6)");
    expect(content.style.transformOrigin).toBe("top center");
    expect(scaler.style.height).toBe(`${available}px`);
    expect(scaler.style.overflowY).toBe("auto");
  });

  it("scales down uniformly to exactly fit when moderately over", () => {
    render(<LivePreview {...baseProps} />);
    fireNaturalHeight(900);

    const content = screen.getByTestId("preview-content");
    const scaler = screen.getByTestId("preview-scaler");
    expect(content.style.transform).toMatch(/^scale\(0\.\d+\)$/);
    expect(content.style.transform).not.toBe("scale(1)");
    expect(scaler.style.height).toBe(`${available}px`);
    expect(scaler.style.overflowY).toBe("hidden");
  });

  it("re-fits on subsequent content growth (typing/toggles)", () => {
    render(<LivePreview {...baseProps} />);
    fireNaturalHeight(400);
    expect(screen.getByTestId("preview-content").style.transform).toBe("");

    fireNaturalHeight(1400);
    const content = screen.getByTestId("preview-content");
    const scaler = screen.getByTestId("preview-scaler");
    expect(content.style.transform).not.toBe("");
    expect(scaler.style.height).toBe(`${available}px`);
  });
});
