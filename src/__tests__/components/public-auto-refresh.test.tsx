import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AutoRefresh } from "../../../components/public/auto-refresh";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

describe("Public AutoRefresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("renders nothing (no DOM output)", () => {
    const { container } = render(<AutoRefresh />);
    expect(container.firstChild).toBeNull();
  });

  it("calls router.refresh() on 60-second interval", () => {
    render(<AutoRefresh />);
    expect(mockRefresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it("does not refresh on interval when tab is hidden", () => {
    render(<AutoRefresh />);
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });

    vi.advanceTimersByTime(120_000);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("calls router.refresh() when tab becomes visible again", () => {
    render(<AutoRefresh />);
    mockRefresh.mockClear();

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mockRefresh).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh on interval after unmount", () => {
    const { unmount } = render(<AutoRefresh />);
    unmount();

    vi.advanceTimersByTime(120_000);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("removes visibilitychange listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<AutoRefresh />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    removeSpy.mockRestore();
  });

  it("uses a custom interval when provided", () => {
    render(<AutoRefresh intervalMs={10_000} />);
    vi.advanceTimersByTime(10_000);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
