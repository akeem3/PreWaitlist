import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  UpgradeModal,
  isSuppressed,
} from "../../../components/dashboard/upgrade-modal";

vi.mock("../../../src/hooks/use-paddle", () => ({
  usePaddle: vi.fn(() => ({
    Checkout: { open: vi.fn() },
  })),
}));

const { mockCapture, mockSetSurveySuppressed } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockSetSurveySuppressed: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  capture: mockCapture,
  setSurveySuppressed: mockSetSurveySuppressed,
  identifyFounder: vi.fn(),
  registerContext: vi.fn(),
  initAnalytics: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

describe("UpgradeModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    triggerSource: "sidebar" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("renders when open", () => {
    render(<UpgradeModal {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "Upgrade to Pro" })
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<UpgradeModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
  });

  it("displays price", () => {
    render(<UpgradeModal {...defaultProps} />);
    expect(screen.getByText("$15")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when X is clicked", () => {
    const onOpenChange = vi.fn();
    render(<UpgradeModal {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Maybe later is clicked", () => {
    const onOpenChange = vi.fn();
    render(<UpgradeModal {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("Maybe later"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows different headline for warmth trigger", () => {
    render(<UpgradeModal {...defaultProps} triggerSource="warmth" />);
    expect(
      screen.getByText("See who's engaged and who's cold")
    ).toBeInTheDocument();
  });

  it("redirects logged-out users to signup on 401", async () => {
    const onOpenChange = vi.fn();
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false });
    render(<UpgradeModal {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/signup?next=/dashboard/settings/billing&plan=pro"
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows API errors inline and keeps the modal open", async () => {
    const onOpenChange = vi.fn();
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ error: "Already subscribed" }),
    });
    render(<UpgradeModal {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(await screen.findByText("Already subscribed")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Upgrade to Pro" })
    ).toBeInTheDocument();
  });

  // Non-2xx must still show the API's own error string (the route pairs
  // every error with a non-2xx status), not the generic fallback.
  it("surfaces the API error string on non-2xx responses", async () => {
    const onOpenChange = vi.fn();
    mockFetch.mockResolvedValueOnce({
      status: 400,
      ok: false,
      json: async () => ({ error: "Already subscribed to Pro" }),
    });
    render(<UpgradeModal {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(
      await screen.findByText("Already subscribed to Pro")
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  // Error body without a message (e.g. the checkout route's empty-object 500)
  // falls back to the generic message.
  it("falls back to the generic message when the error body has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
      json: async () => ({}),
    });
    render(<UpgradeModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(
      await screen.findByText("Something went wrong. Please try again.")
    ).toBeInTheDocument();
  });

  it("auto-closes when the trigger is within cooldown", () => {
    const onOpenChange = vi.fn();
    localStorageMock.setItem(
      "upgrade-dismissed-sidebar",
      JSON.stringify({ dismissedAt: Date.now() })
    );
    render(
      <UpgradeModal
        {...defaultProps}
        triggerSource="sidebar"
        onOpenChange={onOpenChange}
      />
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // Flicker regression: explicit-intent ?plan=pro deep links must survive a
  // prior dismissal, or the arrival modal shuts ~3ms after paint and the
  // stripped param loses the pay intent.
  it.each(["pro-cta-onboarding", "pro-cta-billing"])(
    "does not auto-close exempted trigger %s within cooldown",
    (trigger) => {
      const onOpenChange = vi.fn();
      localStorageMock.setItem(
        `upgrade-dismissed-${trigger}`,
        JSON.stringify({ dismissedAt: Date.now() })
      );
      render(
        <UpgradeModal
          {...defaultProps}
          triggerSource={trigger}
          onOpenChange={onOpenChange}
        />
      );
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Upgrade to Pro" })
      ).toBeInTheDocument();
    }
  );

  // Story 20.1 AC2 + D7 — the open effect captures the funnel event, raises
  // the survey-suppression flag for as long as the modal owns the UI, and
  // releases it via cleanup on close.
  it("captures upgrade_triggered and toggles survey suppression with open state", () => {
    const { rerender } = render(<UpgradeModal {...defaultProps} />);
    expect(mockCapture).toHaveBeenCalledWith("upgrade_triggered", {
      trigger_source: "sidebar",
    });
    expect(mockSetSurveySuppressed).toHaveBeenCalledWith(true);

    rerender(<UpgradeModal {...defaultProps} open={false} />);
    expect(mockSetSurveySuppressed).toHaveBeenCalledWith(false);
  });

  // A cooldown-suppressed open auto-closes before doing anything else —
  // it must not report a trigger that never showed to the founder.
  it("does not capture upgrade_triggered when the trigger is cooldown-suppressed", () => {
    const onOpenChange = vi.fn();
    localStorageMock.setItem(
      "upgrade-dismissed-sidebar",
      JSON.stringify({ dismissedAt: Date.now() })
    );
    render(
      <UpgradeModal
        {...defaultProps}
        triggerSource="sidebar"
        onOpenChange={onOpenChange}
      />
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockCapture).not.toHaveBeenCalled();
  });
});

describe("isSuppressed (cooldown)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("returns false when no cooldown stored", () => {
    expect(isSuppressed("sidebar")).toBe(false);
  });

  it("returns true within cooldown period", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorageMock.setItem(
      "upgrade-dismissed-sidebar",
      JSON.stringify({ dismissedAt: now - 1000 })
    );
    expect(isSuppressed("sidebar")).toBe(true);
  });

  it("returns false after cooldown period", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    localStorageMock.setItem(
      "upgrade-dismissed-sidebar",
      JSON.stringify({ dismissedAt: now - eightDaysMs })
    );
    expect(isSuppressed("sidebar")).toBe(false);
  });

  it("returns false for different trigger source", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorageMock.setItem(
      "upgrade-dismissed-sidebar",
      JSON.stringify({ dismissedAt: now - 1000 })
    );
    expect(isSuppressed("warmth")).toBe(false);
  });
});
