import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, fireEvent } from "@testing-library/react";
import { StrictMode } from "react";
import {
  DashboardTour,
  TOUR_FLAG_KEY,
  TOUR_REPLAY_EVENT,
} from "../../../components/dashboard/tour";

interface TourStepShape {
  element: string;
  // driver.js v1.9 reads title/description/side ONLY from step.popover.
  // Flat steps render an empty popover — this type + the shape-lock test
  // prevent the regression (Prompt #8, 2026-10-10).
  popover: { title: string; description: string; side: string };
  // Explicitly assert the flat keys are absent at runtime (see shape-lock).
  title?: undefined;
  description?: undefined;
  side?: undefined;
}

interface TourDriverConfig {
  steps: TourStepShape[];
  showProgress?: boolean;
  skipMissingElement?: boolean;
  waitForElement?: number;
  onPopoverRender?: (popover: { footerButtons: HTMLElement }) => void;
  onDestroyed?: () => void;
}

const mocks = vi.hoisted(() => {
  let active = false;
  const mockDrive = vi.fn(() => {
    active = true;
  });
  const mockIsActive = vi.fn(() => active);
  const mockDriver = vi.fn();
  const mockDestroy = vi.fn(() => {
    active = false;
    // Mirror driver.js: destroy() invokes onDestroyed synchronously.
    const calls = mockDriver.mock.calls;
    const cfg = calls.length > 0 ? calls[calls.length - 1][0] : undefined;
    cfg?.onDestroyed?.();
  });
  mockDriver.mockImplementation(() => ({
    drive: mockDrive,
    destroy: mockDestroy,
    isActive: mockIsActive,
  }));
  return {
    mockDrive,
    mockDestroy,
    mockIsActive,
    mockDriver,
    resetActive: () => {
      active = false;
    },
  };
});

const { mockSetSurveySuppressed, mockPathname } = vi.hoisted(() => ({
  mockSetSurveySuppressed: vi.fn(),
  mockPathname: vi.fn(() => "/dashboard"),
}));

vi.mock("driver.js", () => ({ driver: mocks.mockDriver }));
vi.mock("@/lib/analytics", () => ({
  setSurveySuppressed: mockSetSurveySuppressed,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

function lastConfig(): TourDriverConfig {
  const calls = mocks.mockDriver.mock.calls;
  return calls[calls.length - 1][0] as TourDriverConfig;
}

function TourFixture({
  count = 3,
  interrupt = false,
}: {
  count?: number;
  interrupt?: boolean;
}) {
  return (
    <>
      <div data-tour="dashboard-header" />
      <div data-tour="stat-cards" />
      <div data-tour="signup-chart" />
      <div data-tour="warmth-panel" />
      <div data-tour="qualification-panel" />
      <div data-tour="dashboard-sidebar" />
      <DashboardTour subscriberCount={count} interruptOpen={interrupt} />
    </>
  );
}

const APPROVED_COPY = [
  {
    title: "Your waitlist is live",
    description:
      "Your public page is live. Share this link where your audience already is — signups land here.",
  },
  {
    title: "Overview",
    description:
      "Total signups, referral share, today's growth, and subscriber warmth — all in one row.",
  },
  {
    title: "Signups Over Time",
    description:
      "Watch momentum build. The trend line updates as new subscribers join.",
  },
  {
    title: "Warmth Distribution",
    description:
      "See who's engaged: Hot, Warm, and Cold — target broadcasts to the right people.",
  },
  {
    title: "Qualification Breakdown",
    description:
      "See how subscribers answered your questions — your best leads stand out.",
  },
  {
    title: "Your toolkit",
    description:
      "Leaderboard, updates, broadcast, and settings — everything else lives in the sidebar.",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resetActive();
  window.localStorage.clear();
  mockPathname.mockReturnValue("/dashboard");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("DashboardTour", () => {
  it("starts once with the approved six-step copy when all gates hold", () => {
    render(<TourFixture />);
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);
    expect(mocks.mockDrive).toHaveBeenCalledTimes(1);
    expect(mockSetSurveySuppressed).toHaveBeenCalledWith(true);

    const cfg = lastConfig();
    expect(cfg.showProgress).toBe(true);
    expect(cfg.skipMissingElement).toBe(true);
    expect(cfg.steps.map((step) => step.popover.title)).toEqual(
      APPROVED_COPY.map((step) => step.title)
    );
    expect(cfg.steps.map((step) => step.popover.description)).toEqual(
      APPROVED_COPY.map((step) => step.description)
    );
    expect(cfg.steps.map((step) => step.element)).toEqual([
      '[data-tour="dashboard-header"]',
      '[data-tour="stat-cards"]',
      '[data-tour="signup-chart"]',
      '[data-tour="warmth-panel"]',
      '[data-tour="qualification-panel"]',
      '[data-tour="dashboard-sidebar"]',
    ]);
  });

  it("uses the driver.js popover shape on every step (no flat title/description/side)", () => {
    render(<TourFixture />);
    const cfg = lastConfig();
    expect(cfg.steps).toHaveLength(6);

    for (const step of cfg.steps) {
      // Popover present, non-empty, and typed.
      expect(typeof step.popover).toBe("object");
      expect(step.popover.title.trim().length).toBeGreaterThan(0);
      expect(step.popover.description.trim().length).toBeGreaterThan(0);
      expect(["top", "bottom", "left", "right"]).toContain(step.popover.side);
      // Flat keys the driver ignores must be absent — a flat step is the
      // exact regression that rendered titleless popovers.
      expect(step.title).toBeUndefined();
      expect(step.description).toBeUndefined();
      expect(step.side).toBeUndefined();
    }

    // Sides honored per spec (previously all ignored → bottom).
    expect(cfg.steps.map((step) => step.popover.side)).toEqual([
      "bottom",
      "bottom",
      "bottom",
      "top",
      "top",
      "right",
    ]);
  });

  it("omits the sidebar step below the lg breakpoint (AC7)", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as unknown as MediaQueryList);
    render(<TourFixture />);
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);
    const cfg = lastConfig();
    expect(cfg.steps).toHaveLength(5);
    expect(
      cfg.steps.some(
        (step) => step.element === '[data-tour="dashboard-sidebar"]'
      )
    ).toBe(false);
  });

  it("does not start when subscriberCount is below 1", () => {
    render(<TourFixture count={0} />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();
    expect(mockSetSurveySuppressed).not.toHaveBeenCalled();
  });

  it("does not start when the completion flag is already set", () => {
    window.localStorage.setItem(TOUR_FLAG_KEY, "1");
    render(<TourFixture />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();
  });

  it("does not start outside /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard/leaderboard");
    render(<TourFixture />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();
  });

  it("waits for the first target to enter the DOM, then starts", async () => {
    vi.useFakeTimers();
    const { container } = render(<DashboardTour subscriberCount={3} />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();

    const header = document.createElement("div");
    header.setAttribute("data-tour", "dashboard-header");
    container.appendChild(header);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);
    expect(mocks.mockDrive).toHaveBeenCalledTimes(1);
  });

  it("never starts while the first target stays absent", async () => {
    vi.useFakeTimers();
    render(<DashboardTour subscriberCount={3} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16_000);
    });
    expect(mocks.mockDriver).not.toHaveBeenCalled();
  });

  it("renders a Skip control that destroys the tour and sets the flag", () => {
    render(<TourFixture />);
    const cfg = lastConfig();
    expect(cfg.onPopoverRender).toBeTypeOf("function");

    const footer = document.createElement("div");
    cfg.onPopoverRender?.({ footerButtons: footer });

    const skip = footer.querySelector("button");
    expect(skip?.textContent).toBe("Skip");
    expect(skip?.className).toBe("driver-popover-footer-btn");
    fireEvent.click(skip!);

    expect(mocks.mockDestroy).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(TOUR_FLAG_KEY)).toBe("1");
    expect(mockSetSurveySuppressed).toHaveBeenLastCalledWith(false);
  });

  it("writes the completion flag and releases suppression on destroy", () => {
    render(<TourFixture />);
    expect(window.localStorage.getItem(TOUR_FLAG_KEY)).toBeNull();

    const cfg = lastConfig();
    act(() => {
      cfg.onDestroyed?.();
    });

    expect(window.localStorage.getItem(TOUR_FLAG_KEY)).toBe("1");
    expect(mockSetSurveySuppressed).toHaveBeenLastCalledWith(false);
  });

  it("does not write the flag when unmounting destroys the tour", () => {
    const { unmount } = render(<TourFixture />);
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);

    unmount();
    // mockDestroy invokes onDestroyed — the unmounting guard must skip it.
    expect(mocks.mockDestroy).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(TOUR_FLAG_KEY)).toBeNull();
    expect(mockSetSurveySuppressed).toHaveBeenLastCalledWith(false);
  });

  it("survives StrictMode double-mounting without self-blocking", () => {
    render(
      <StrictMode>
        <TourFixture />
      </StrictMode>
    );
    // First effect run starts, cleanup destroys (no flag), second run starts.
    expect(mocks.mockDrive.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(window.localStorage.getItem(TOUR_FLAG_KEY)).toBeNull();
  });

  it("replays on demand after the tour completed (flag already set)", () => {
    window.localStorage.setItem(TOUR_FLAG_KEY, "1");
    render(<TourFixture />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new CustomEvent(TOUR_REPLAY_EVENT));
    });
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);
    expect(mocks.mockDrive).toHaveBeenCalledTimes(1);
  });

  it("does not double-start when replay fires while the tour is active", () => {
    render(<TourFixture />);
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new CustomEvent(TOUR_REPLAY_EVENT));
    });
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);
  });

  it("does not start while the upgrade modal is open (?upgrade=cap)", () => {
    render(<TourFixture interrupt />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();
    expect(mockSetSurveySuppressed).not.toHaveBeenCalled();
  });

  it("starts after the interrupt clears", () => {
    const { rerender } = render(<TourFixture interrupt />);
    expect(mocks.mockDriver).not.toHaveBeenCalled();

    rerender(<TourFixture interrupt={false} />);
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);
    expect(mocks.mockDrive).toHaveBeenCalledTimes(1);
  });

  it("lets an interrupting modal destroy the active tour without the flag", () => {
    const { rerender } = render(<TourFixture />);
    expect(mocks.mockDriver).toHaveBeenCalledTimes(1);

    rerender(<TourFixture interrupt />);
    // cleanup destroyed the tour; unmounting guard must skip the flag so the
    // tour can still run on a later visit once the modal is gone.
    expect(mocks.mockDestroy).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(TOUR_FLAG_KEY)).toBeNull();
    expect(mockSetSurveySuppressed).toHaveBeenLastCalledWith(false);
  });
});
