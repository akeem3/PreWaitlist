import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: mockRefresh,
  }),
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

vi.mock("next/dynamic", () => ({
  default: () => {
    // Return a component that renders nothing to avoid loading states
    const Empty = () => null;
    Empty.displayName = "DynamicComponent";
    return Empty;
  },
}));

// Mock fetch for stats and warmth endpoints
const mockFetch = vi.fn();
global.fetch = mockFetch;

import DashboardClient from "@/app/dashboard/client";

const defaultProps = {
  liveUrl: "test.prewaitlist.com",
  tier: "free" as const,
  subdomain: "test",
  subscribers: [],
  stats: { totalSignups: 0, referralPercentage: 0, todaySignups: 0 },
  coldThreshold: 40,
};

describe("Dashboard Auto-Refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ total: 0 }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("calls router.refresh() when tab regains visibility", () => {
    render(<DashboardClient {...defaultProps} />);

    // Simulate tab becoming visible
    const event = new Event("visibilitychange");
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(event);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls router.refresh() on 60-second interval", () => {
    render(<DashboardClient {...defaultProps} />);

    // Advance timer by 60 seconds
    vi.advanceTimersByTime(60_000);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("does not refresh when tab is hidden", () => {
    render(<DashboardClient {...defaultProps} />);

    // Simulate tab becoming hidden
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });

    // Advance timer by 60 seconds
    vi.advanceTimersByTime(60_000);

    // refresh should not be called for interval when hidden
    // (visibility change to hidden doesn't trigger refresh, only visible does)
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = render(<DashboardClient {...defaultProps} />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("removes visibilitychange listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<DashboardClient {...defaultProps} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });
});
