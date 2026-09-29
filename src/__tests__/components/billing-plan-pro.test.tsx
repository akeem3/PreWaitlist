import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

const tierMock = vi.fn(() => "free");
const triggerMock = vi.fn();

vi.mock("@/app/dashboard/shell", () => ({
  useDashboardTier: () => tierMock(),
  useUpgradeModal: () => triggerMock,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/settings/billing",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import BillingClient from "@/app/dashboard/settings/billing/client";

function setUrl(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("Billing ?plan=pro auto-open (existing-account leg)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tierMock.mockReturnValue("free");
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tier: "free" }),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("opens the upgrade modal once for a free founder and strips the param", async () => {
    setUrl("/dashboard/settings/billing?plan=pro");

    render(<BillingClient />);

    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith("pro-cta-billing")
    );
    expect(triggerMock).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/dashboard/settings/billing");
  });

  // Flicker regression: the deep link carries its own cooldown key, so a
  // prior dismissal of the settings-page "billing" opener must not block it.
  it("opens despite a prior 'billing' dismissal (separate cooldown key)", async () => {
    window.localStorage.setItem(
      "upgrade-dismissed-billing",
      JSON.stringify({ dismissedAt: Date.now() })
    );
    setUrl("/dashboard/settings/billing?plan=pro");

    render(<BillingClient />);

    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith("pro-cta-billing")
    );
    expect(window.location.search).toBe("");
  });

  // Double-pay safety: an already-Pro founder must never trigger checkout
  // from the plan=pro deep link.
  it("does not open the modal for an already-Pro founder", async () => {
    tierMock.mockReturnValue("pro");
    setUrl("/dashboard/settings/billing?plan=pro");

    render(<BillingClient />);

    // Wait until the mount profile sync has run, then assert no open.
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(triggerMock).not.toHaveBeenCalled();
    // Param still stripped so a refresh doesn't reopen later.
    expect(window.location.search).toBe("");
  });

  it("does not open the modal without the param", async () => {
    setUrl("/dashboard/settings/billing");

    render(<BillingClient />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(triggerMock).not.toHaveBeenCalled();
  });
});
