import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { captureMock, openMock } = vi.hoisted(() => ({
  captureMock: vi.fn(),
  openMock: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({ capture: captureMock }));
vi.mock("@/hooks/use-paddle", () => ({
  usePaddle: () => ({ Checkout: { open: openMock } }),
}));

import { usePaddleUpgrade } from "@/hooks/use-paddle-upgrade";

type ProfileResponse = { ok: boolean; json: () => Promise<unknown> };

function okJson(body: unknown): ProfileResponse {
  return { ok: true, json: async () => body };
}

/**
 * Story 20.1 D2 / audit fix — the onboarding tier poll must never fire
 * `subscription_started` (or `onTierChanged`) after it has been cancelled
 * or the hook unmounted while a response was in flight: the dashboard
 * shell owns the flip after navigation, and the story claims the two
 * contexts are mutually exclusive (no double-fire).
 */
describe("usePaddleUpgrade tier poll", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    captureMock.mockReset();
    openMock.mockReset();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function checkoutOk(): void {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/billing/checkout") {
        return Promise.resolve(okJson({ priceId: "pri_1", customData: {} }));
      }
      return Promise.resolve(okJson({ tier: "free" }));
    });
  }

  it("captures subscription_started once when the poll sees pro while active", async () => {
    checkoutOk();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/billing/checkout") {
        return Promise.resolve(okJson({ priceId: "pri_1", customData: {} }));
      }
      return Promise.resolve(okJson({ tier: "pro" }));
    });

    const onTierChanged = vi.fn();
    const { result } = renderHook(() =>
      usePaddleUpgrade({ triggerSource: "test", onTierChanged })
    );

    await act(async () => {
      await result.current.openCheckout();
    });
    expect(openMock).toHaveBeenCalledTimes(1);
    captureMock.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("subscription_started", {
      source: "onboarding",
    });
    expect(onTierChanged).toHaveBeenCalledWith("pro");

    // The interval is cleared after detection — no second capture.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(captureMock).toHaveBeenCalledTimes(1);
  });

  it("keeps polling while the tier is free and captures only on the flip", async () => {
    let profileCalls = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/billing/checkout") {
        return Promise.resolve(okJson({ priceId: "pri_1", customData: {} }));
      }
      profileCalls++;
      return Promise.resolve(
        okJson({ tier: profileCalls < 2 ? "free" : "pro" })
      );
    });

    const { result } = renderHook(() =>
      usePaddleUpgrade({ triggerSource: "test" })
    );

    await act(async () => {
      await result.current.openCheckout();
    });
    captureMock.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(captureMock).not.toHaveBeenCalledWith(
      "subscription_started",
      expect.anything()
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("subscription_started", {
      source: "onboarding",
    });
  });

  it("does not capture subscription_started when unmounted while a response is in flight (D2 no double-fire)", async () => {
    let resolveProfile!: (r: ProfileResponse) => void;
    const pendingProfile = new Promise<ProfileResponse>((resolve) => {
      resolveProfile = resolve;
    });

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/billing/checkout") {
        return Promise.resolve(okJson({ priceId: "pri_1", customData: {} }));
      }
      return pendingProfile;
    });

    const onTierChanged = vi.fn();
    const { result, unmount } = renderHook(() =>
      usePaddleUpgrade({ triggerSource: "test", onTierChanged })
    );

    await act(async () => {
      await result.current.openCheckout();
    });
    captureMock.mockClear();

    // Start a tick whose /api/profile response stays in flight.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(captureMock).not.toHaveBeenCalled();

    // Unmount (navigation to the dashboard) while the fetch is pending —
    // cleanup clears and nulls pollingRef.
    unmount();

    // The late response now lands with tier=pro. The in-flight callback
    // resumes, sees the poll is gone, and must bail.
    await act(async () => {
      resolveProfile(okJson({ tier: "pro" }));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(captureMock).not.toHaveBeenCalledWith(
      "subscription_started",
      expect.anything()
    );
    expect(onTierChanged).not.toHaveBeenCalled();
  });

  it("does not capture after cancel() while a response is in flight", async () => {
    let resolveProfile!: (r: ProfileResponse) => void;
    const pendingProfile = new Promise<ProfileResponse>((resolve) => {
      resolveProfile = resolve;
    });

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/billing/checkout") {
        return Promise.resolve(okJson({ priceId: "pri_1", customData: {} }));
      }
      return pendingProfile;
    });

    const onTierChanged = vi.fn();
    const { result } = renderHook(() =>
      usePaddleUpgrade({ triggerSource: "test", onTierChanged })
    );

    await act(async () => {
      await result.current.openCheckout();
    });
    captureMock.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Explicit cancel (consumers call this on abandonment) mid-flight.
    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      resolveProfile(okJson({ tier: "pro" }));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(captureMock).not.toHaveBeenCalledWith(
      "subscription_started",
      expect.anything()
    );
    expect(onTierChanged).not.toHaveBeenCalled();
  });
});
