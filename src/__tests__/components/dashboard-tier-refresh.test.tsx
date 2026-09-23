import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";

const mockRefresh = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
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
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("../../../components/dashboard/upgrade-modal", () => ({
  UpgradeModal: () => null,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import DashboardShell, {
  useDashboardTier,
  useRefreshTier,
} from "../../app/dashboard/shell";

const waitlists = [
  {
    id: "wl-1",
    subdomain: "acme",
    product_name: "Acme",
    logo_url: null,
    is_archived: false,
  },
];

function TierProbe() {
  const tier = useDashboardTier();
  const refreshTier = useRefreshTier();
  return (
    <div>
      <span data-testid="tier">{tier}</span>
      <button type="button" onClick={() => refreshTier?.()}>
        refresh
      </button>
    </div>
  );
}

function renderShell(serverTier = "free") {
  return render(
    <DashboardShell waitlists={waitlists} tier={serverTier}>
      <TierProbe />
    </DashboardShell>
  );
}

/** Broadcast is locked (button) for free, unlocked (link) for pro. */
function broadcastIsLocked(): boolean {
  const broadcast = screen.getByText("Broadcast");
  return broadcast.closest("button") !== null;
}

function profileResponse(tier: string) {
  return {
    ok: true,
    json: () => Promise.resolve({ tier }),
  };
}

describe("Dashboard tier refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch.mockResolvedValue(profileResponse("free"));
    window.history.replaceState({}, "", "/dashboard");
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("initializes tier from server prop and locks Broadcast when free", () => {
    renderShell("free");
    expect(screen.getByTestId("tier").textContent).toBe("free");
    expect(broadcastIsLocked()).toBe(true);
  });

  it("renders unlocked Broadcast when server tier is pro", () => {
    renderShell("pro");
    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(broadcastIsLocked()).toBe(false);
  });

  it("starts polling on paddle-checkout-opened and unlocks sidebar when API returns pro", async () => {
    renderShell("free");
    expect(broadcastIsLocked()).toBe(true);

    mockFetch.mockResolvedValue(profileResponse("pro"));

    act(() => {
      window.dispatchEvent(new Event("paddle-checkout-opened"));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(broadcastIsLocked()).toBe(false);
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith("/api/profile");
  });

  it("stops polling after successful tier change", async () => {
    renderShell("free");

    mockFetch.mockResolvedValue(profileResponse("pro"));

    act(() => {
      window.dispatchEvent(new Event("paddle-checkout-opened"));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    const callsAfterSuccess = mockFetch.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(mockFetch.mock.calls.length).toBe(callsAfterSuccess);
  });

  it("stops polling after 60s cap if tier never changes", async () => {
    renderShell("free");

    act(() => {
      window.dispatchEvent(new Event("paddle-checkout-opened"));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });

    expect(screen.getByTestId("tier").textContent).toBe("free");

    const callsAtCap = mockFetch.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(mockFetch.mock.calls.length).toBe(callsAtCap);
  });

  it("updates tier and refreshes on tier-changed event", () => {
    renderShell("free");
    expect(screen.getByTestId("tier").textContent).toBe("free");

    act(() => {
      window.dispatchEvent(
        new CustomEvent("tier-changed", { detail: { tier: "pro" } })
      );
    });

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(broadcastIsLocked()).toBe(false);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("starts polling when URL has ?upgraded=1 and strips the param", async () => {
    window.history.replaceState(
      {},
      "",
      "/dashboard/settings/billing?upgraded=1"
    );
    renderShell("free");

    mockFetch.mockResolvedValue(profileResponse("pro"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(window.location.search).not.toContain("upgraded=1");
  });

  it("refreshTier fetches once and applies a changed tier", async () => {
    renderShell("free");

    mockFetch.mockResolvedValue(profileResponse("pro"));

    const btn = screen.getByRole("button", { name: "refresh" });
    await act(async () => {
      btn.click();
      // flush the fetch promise
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("accepts server prop updates after router.refresh", () => {
    const { rerender } = renderShell("free");
    expect(screen.getByTestId("tier").textContent).toBe("free");

    rerender(
      <DashboardShell waitlists={waitlists} tier="pro">
        <TierProbe />
      </DashboardShell>
    );

    expect(screen.getByTestId("tier").textContent).toBe("pro");
    expect(broadcastIsLocked()).toBe(false);
  });

  it("cleans up listeners and polling on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderShell("free");
    act(() => {
      window.dispatchEvent(new Event("paddle-checkout-opened"));
    });
    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "paddle-checkout-opened",
      expect.any(Function)
    );
    expect(removeSpy).toHaveBeenCalledWith(
      "tier-changed",
      expect.any(Function)
    );
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
