import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const mockRefresh = vi.fn();
const mockPush = vi.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
let mockParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard",
  useSearchParams: () => mockParams,
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

vi.mock("@/lib/analytics", () => ({
  capture: vi.fn(),
  identifyFounder: vi.fn(),
  registerContext: vi.fn(),
  setSurveySuppressed: vi.fn(),
  initAnalytics: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import DashboardShell from "../../app/dashboard/shell";
import { STORAGE_KEY } from "../../../components/dashboard/waitlist-switcher";

const PREF = "active_waitlist_id";

// Layout orders created_at ASC — the last element is the newest waitlist.
const waitlists = [
  {
    id: "wl-1",
    subdomain: "acme-one",
    product_name: "Acme One",
    logo_url: null,
    is_archived: false,
  },
  {
    id: "wl-2",
    subdomain: "acme-two",
    product_name: "Acme Two",
    logo_url: null,
    is_archived: false,
  },
];

function seedPref({
  cookie,
  local,
}: {
  cookie?: string;
  local?: string;
}): void {
  if (cookie) document.cookie = `${PREF}=${cookie}; path=/`;
  if (local) localStorage.setItem(STORAGE_KEY, local);
}

function readPrefCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${PREF}=`));
  if (!match) return null;
  const value = match.slice(PREF.length + 1);
  return value ? decodeURIComponent(value) : null;
}

function renderShell(defaultWaitlistId?: string) {
  return render(
    <DashboardShell
      waitlists={waitlists}
      tier="free"
      defaultWaitlistId={defaultWaitlistId}
    >
      <div data-testid="child" />
    </DashboardShell>
  );
}

describe("waitlist preference reconciliation (shell)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = new URLSearchParams();
    document.cookie = `${PREF}=; max-age=0; path=/`;
    localStorage.clear();
    window.history.replaceState({}, "", "/dashboard");
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tier: "free" }),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("steady state: localStorage + cookie agree — no refresh, label matches", () => {
    seedPref({ cookie: "wl-1", local: "wl-1" });
    renderShell("wl-1");

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Acme One/ })).toBeTruthy();
    expect(readPrefCookie()).toBe("wl-1");
  });

  it("legacy localStorage-only preference: writes the cookie and refreshes once", () => {
    // Server rendered newest (wl-2) because no cookie existed at request time.
    seedPref({ local: "wl-1" });
    renderShell("wl-2");

    expect(readPrefCookie()).toBe("wl-1");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("wl-1");
    expect(screen.getByRole("button", { name: /Acme One/ })).toBeTruthy();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("cookie-only (localStorage cleared): resolves from cookie, no refresh, restores localStorage", () => {
    seedPref({ cookie: "wl-1" });
    renderShell("wl-1");

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("wl-1");
    expect(screen.getByRole("button", { name: /Acme One/ })).toBeTruthy();
  });

  it("fresh browser: defaults to newest without refreshing", () => {
    renderShell("wl-2");

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Acme Two/ })).toBeTruthy();
    // Resolution materializes the preference so the next plain entry agrees.
    expect(readPrefCookie()).toBe("wl-2");
  });

  it("explicit ?wid: no refresh, both stores synced to the wid", () => {
    // Layouts cannot read search params — the server dropdown seed is newest.
    mockParams = new URLSearchParams("wid=wl-1");
    renderShell("wl-2");

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(readPrefCookie()).toBe("wl-1");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("wl-1");
    expect(screen.getByRole("button", { name: /Acme One/ })).toBeTruthy();
  });

  it("invalid stored preference falls through to newest (no refresh)", () => {
    seedPref({ cookie: "wl-gone", local: "wl-gone" });
    renderShell("wl-2");

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Acme Two/ })).toBeTruthy();
    expect(readPrefCookie()).toBe("wl-2");
  });

  it("dropdown switch writes both stores and navigates with ?wid", () => {
    renderShell("wl-2");

    fireEvent.click(screen.getByRole("button", { name: /Acme Two/ }));
    fireEvent.click(screen.getByRole("button", { name: /Acme One/ }));

    expect(mockPush).toHaveBeenCalledWith("/dashboard?wid=wl-1");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("wl-1");
    expect(readPrefCookie()).toBe("wl-1");
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
