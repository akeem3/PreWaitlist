import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, screen, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding/1",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const Empty = () => null;
    Empty.displayName = "DynamicComponent";
    return Empty;
  },
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

vi.mock("@/hooks/use-paddle", () => ({
  usePaddle: () => null,
}));

vi.mock("@/hooks/use-paddle-upgrade", () => ({
  usePaddleUpgrade: () => ({ cancel: vi.fn() }),
}));

import { OnboardingClientLayout } from "@/app/onboarding/onboarding-client-layout";

function setUrl(path: string): void {
  window.history.replaceState({}, "", path);
}

describe("Onboarding ?plan=pro auto-open", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tier: "free" }),
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window.history.replaceState({}, "", "/");
  });

  it("opens the upgrade modal and strips the param", async () => {
    setUrl("/onboarding/1?plan=pro");

    render(
      <OnboardingClientLayout>
        <div>step one</div>
      </OnboardingClientLayout>
    );

    expect(await screen.findByText("Unlock all Pro features")).toBeTruthy();
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/onboarding/1");
  });

  it("does not open the modal without the param", async () => {
    setUrl("/onboarding/1");

    render(
      <OnboardingClientLayout>
        <div>step one</div>
      </OnboardingClientLayout>
    );

    expect(screen.queryByText("Upgrade to Pro")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("does not open the modal for an already-Pro founder", async () => {
    setUrl("/onboarding/1?plan=pro");

    render(
      <OnboardingClientLayout tier="pro">
        <div>step one</div>
      </OnboardingClientLayout>
    );

    expect(screen.queryByText("Upgrade to Pro")).toBeNull();
    // Param still stripped so a refresh doesn't reopen.
    expect(window.location.search).toBe("");
  });

  // Founder-reported flicker repro: a prior dismissal of this trigger must
  // NOT auto-close the ?plan=pro arrival modal (explicit intent is exempt
  // from the AC8 cooldown) — the modal has to stay on screen.
  it("keeps the arrival modal open despite a prior dismissal (cooldown exemption)", async () => {
    window.localStorage.setItem(
      "upgrade-dismissed-pro-cta-onboarding",
      JSON.stringify({ dismissedAt: Date.now() })
    );
    setUrl("/onboarding/1?plan=pro");

    render(
      <OnboardingClientLayout>
        <div>step one</div>
      </OnboardingClientLayout>
    );

    expect(await screen.findByText("Unlock all Pro features")).toBeTruthy();
    // AC8 close effect runs post-paint; pre-fix the modal unmounted ~3ms
    // after mount. Give effect cycles a beat, then assert it is still shown.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(screen.getByText("Unlock all Pro features")).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  // Post-payment return leg: Paddle successUrl lands here with ?upgraded=1 —
  // the param must be stripped and the tier polled so Pro-gated steps unlock.
  it("handles the ?upgraded=1 pay-return: strips param and polls until Pro", async () => {
    vi.useFakeTimers();
    setUrl("/onboarding/1?upgraded=1");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tier: "pro" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <OnboardingClientLayout>
        <div>step one</div>
      </OnboardingClientLayout>
    );

    expect(window.location.search).toBe("");
    // No plan param → no modal, only the tier poll runs.
    expect(screen.queryByText("Upgrade to Pro")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/profile");
  });
});
