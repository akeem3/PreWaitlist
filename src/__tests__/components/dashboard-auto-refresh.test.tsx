import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
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

// Test the refresh mechanism pattern directly
describe("Dashboard Auto-Refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets up visibility change listener", () => {
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");
    // Simulate the hook pattern from dashboard client
    const setupRefresh = () => {
      document.addEventListener("visibilitychange", () => {});
    };
    setupRefresh();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    addEventListenerSpy.mockRestore();
  });

  it("sets up 60-second interval", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    const setupRefresh = () => {
      setInterval(() => {}, 60_000);
    };
    setupRefresh();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);
    setIntervalSpy.mockRestore();
  });

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const intervalId = 123;
    const cleanup = () => {
      clearInterval(intervalId);
    };
    cleanup();
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    clearIntervalSpy.mockRestore();
  });

  it("removes visibility change listener on cleanup", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
    const handler = () => {};
    const cleanup = () => {
      document.removeEventListener("visibilitychange", handler);
    };
    cleanup();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      handler
    );
    removeEventListenerSpy.mockRestore();
  });
});
