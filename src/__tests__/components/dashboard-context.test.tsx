import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DashboardContext,
  useActiveWaitlistId,
  useDashboardTier,
} from "../../app/dashboard/shell";

function TestConsumer() {
  const tier = useDashboardTier();
  const activeWaitlistId = useActiveWaitlistId();
  return (
    <div>
      <span data-testid="tier">{tier}</span>
      <span data-testid="activeWaitlistId">{activeWaitlistId}</span>
    </div>
  );
}

describe("DashboardContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes tier via useDashboardTier", () => {
    render(
      <DashboardContext.Provider
        value={{ tier: "pro", activeWaitlistId: "wl-1" }}
      >
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("tier").textContent).toBe("pro");
  });

  it("exposes activeWaitlistId via useActiveWaitlistId", () => {
    render(
      <DashboardContext.Provider
        value={{ tier: "free", activeWaitlistId: "wl-42" }}
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
  });

  it("updates activeWaitlistId when provider value changes", () => {
    const { rerender } = render(
      <DashboardContext.Provider
        value={{ tier: "free", activeWaitlistId: "wl-1" }}
      >
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("activeWaitlistId").textContent).toBe("wl-1");

    rerender(
      <DashboardContext.Provider
        value={{ tier: "free", activeWaitlistId: "wl-2" }}
      >
        <TestConsumer />
      </DashboardContext.Provider>
    );
    expect(screen.getByTestId("activeWaitlistId").textContent).toBe("wl-2");
  });
});
