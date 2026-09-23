import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DashboardContext,
  useActiveWaitlistId,
  useDashboardTier,
  useRefreshTier,
} from "../../app/dashboard/shell";

function TestConsumer() {
  const tier = useDashboardTier();
  const activeWaitlistId = useActiveWaitlistId();
  const refreshTier = useRefreshTier();
  return (
    <div>
      <span data-testid="tier">{tier}</span>
      <span data-testid="activeWaitlistId">{activeWaitlistId}</span>
      <span data-testid="hasRefresh">{refreshTier ? "yes" : "no"}</span>
    </div>
  );
}

const baseValue = {
  tier: "free",
  activeWaitlistId: "wl-1",
  setUpgradeModal: vi.fn(),
  refreshTier: vi.fn(async () => {}),
};

describe("DashboardContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes tier via useDashboardTier", () => {
    render(
      <DashboardContext.Provider value={{ ...baseValue, tier: "pro" }}>
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("tier").textContent).toBe("pro");
  });

  it("exposes activeWaitlistId via useActiveWaitlistId", () => {
    render(
      <DashboardContext.Provider
        value={{ ...baseValue, activeWaitlistId: "wl-42" }}
      >
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("activeWaitlistId").textContent).toBe("wl-42");
  });

  it("returns null when context is missing", () => {
    render(<TestConsumer />);
    expect(screen.getByTestId("tier").textContent).toBe("");
    expect(screen.getByTestId("activeWaitlistId").textContent).toBe("");
    expect(screen.getByTestId("hasRefresh").textContent).toBe("no");
  });

  it("exposes refreshTier via useRefreshTier", () => {
    render(
      <DashboardContext.Provider value={baseValue}>
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("hasRefresh").textContent).toBe("yes");
  });

  it("updates activeWaitlistId when provider value changes", () => {
    const { rerender } = render(
      <DashboardContext.Provider
        value={{ ...baseValue, activeWaitlistId: "wl-1" }}
      >
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("activeWaitlistId").textContent).toBe("wl-1");

    rerender(
      <DashboardContext.Provider
        value={{ ...baseValue, activeWaitlistId: "wl-2" }}
      >
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("activeWaitlistId").textContent).toBe("wl-2");
  });
});
