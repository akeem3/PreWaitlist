import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  UpgradeModal,
  isSuppressed,
} from "../../../components/dashboard/upgrade-modal";

vi.mock("../../../src/hooks/use-paddle", () => ({
  usePaddle: vi.fn(() => ({
    Checkout: { open: vi.fn() },
  })),
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
