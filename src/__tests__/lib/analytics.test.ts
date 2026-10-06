import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  register: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthogMock }));

type AnalyticsModule = typeof import("../../../src/lib/analytics");

/**
 * Story 20.1 — wrapper behavior: no-key no-op (AC1), init shape (AC1/D4),
 * suppression gating (D7), and forwarding. Module state (initialized/enabled)
 * is per-import, so every test loads a fresh copy.
 */
describe("analytics wrapper", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  async function load(): Promise<AnalyticsModule> {
    return import("../../../src/lib/analytics");
  }

  async function loadEnabled(): Promise<AnalyticsModule> {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    const mod = await load();
    mod.initAnalytics();
    return mod;
  }

  it("does not initialize the SDK without a key (AC1 no-key no-op)", async () => {
    const mod = await load();
    mod.initAnalytics();

    expect(posthogMock.init).not.toHaveBeenCalled();

    mod.capture("account_created", { method: "email" });
    mod.identifyFounder("user-1", { tier: "pro" });
    mod.registerContext({ tier: "pro" });

    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.identify).not.toHaveBeenCalled();
    expect(posthogMock.register).not.toHaveBeenCalled();
  });

  it("initializes with the key, default host, and the pinned defaults preset", async () => {
    await loadEnabled();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.init).toHaveBeenCalledWith("phc_test_key", {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-05-30",
    });
  });

  it("uses NEXT_PUBLIC_POSTHOG_HOST when set", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
    const mod = await load();
    mod.initAnalytics();

    expect(posthogMock.init).toHaveBeenCalledWith("phc_test_key", {
      api_host: "https://eu.i.posthog.com",
      defaults: "2026-05-30",
    });
  });

  it("initializes only once even if called twice", async () => {
    const mod = await loadEnabled();
    mod.initAnalytics();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });

  it("forwards capture events and properties once enabled", async () => {
    const mod = await loadEnabled();

    mod.capture("broadcast_sent", { waitlist_id: "wl-1", recipient_count: 5 });

    expect(posthogMock.capture).toHaveBeenCalledWith("broadcast_sent", {
      waitlist_id: "wl-1",
      recipient_count: 5,
    });
  });

  it("forwards identify and register once enabled", async () => {
    const mod = await loadEnabled();

    mod.identifyFounder("founder-1", { tier: "pro", subscriber_count: 3 });
    mod.registerContext({ tier: "pro", waitlist_id: "wl-1" });

    expect(posthogMock.identify).toHaveBeenCalledWith("founder-1", {
      tier: "pro",
      subscriber_count: 3,
    });
    expect(posthogMock.register).toHaveBeenCalledWith({
      tier: "pro",
      waitlist_id: "wl-1",
    });
  });

  it("drops surveyTrigger captures while suppressed, passes everything else (D7)", async () => {
    const mod = await loadEnabled();

    mod.setSurveySuppressed(true);

    mod.capture("cancel_intent", undefined, { surveyTrigger: true });
    expect(posthogMock.capture).not.toHaveBeenCalled();

    mod.capture("broadcast_sent", { recipient_count: 1 });
    expect(posthogMock.capture).toHaveBeenCalledTimes(1);

    mod.setSurveySuppressed(false);
    mod.capture("cancel_intent", undefined, { surveyTrigger: true });
    expect(posthogMock.capture).toHaveBeenCalledTimes(2);
    expect(posthogMock.capture).toHaveBeenLastCalledWith(
      "cancel_intent",
      undefined
    );
  });
});
