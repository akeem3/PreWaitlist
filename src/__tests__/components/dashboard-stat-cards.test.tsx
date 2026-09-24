import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

import DashboardClient from "../../app/dashboard/client";

const baseProps = {
  liveUrl: "acme.prewaitlist.com",
  waitlistName: "Acme",
  logoUrl: null,
  tier: "free",
  subdomain: "acme",
  subscribers: [],
};

describe("Stat Cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders 4 stat cards", () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.getByText("Total signups")).toBeDefined();
    expect(screen.getByText("Referral %")).toBeDefined();
    expect(screen.getByText("Today")).toBeDefined();
    expect(screen.getByText("Hot / Warm / Cold")).toBeDefined();
  });

  it("displays actual count when stats provided", () => {
    render(
      <DashboardClient
        {...baseProps}
        stats={{ totalSignups: 42, referralPercentage: 12, todaySignups: 5 }}
      />
    );
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("12%")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("displays em-dash when stats is undefined", () => {
    render(<DashboardClient {...baseProps} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("displays em-dash when referralPercentage is null", () => {
    render(
      <DashboardClient
        {...baseProps}
        stats={{ totalSignups: 10, referralPercentage: null, todaySignups: 2 }}
      />
    );
    expect(screen.getByText("10")).toBeDefined();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("formats large numbers without commas", () => {
    render(
      <DashboardClient
        {...baseProps}
        stats={{ totalSignups: 1234, referralPercentage: 25, todaySignups: 0 }}
      />
    );
    expect(screen.getByText("1234")).toBeDefined();
  });

  it("tints positive deltas accent, flat deltas muted (brand color)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: unknown) => {
        if (String(url).includes("/api/dashboard/stats")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                current: { total: 10, referrals: 5, today: 3, yesterday: 1 },
                previous: { total: 5, referrals: 5 },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );

    render(<DashboardClient {...baseProps} />);

    const positive = await screen.findByText("↑ 100% vs last week");
    expect(positive.className).toContain("text-accent");

    const today = screen.getByText("↑ 2 vs yesterday");
    expect(today.className).toContain("text-accent");

    const flat = screen.getByText("— no change");
    expect(flat.className).toContain("text-muted-foreground");
    expect(flat.className).not.toContain("text-accent");
  });
});
