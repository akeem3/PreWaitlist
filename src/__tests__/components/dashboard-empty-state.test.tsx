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
  coldThreshold: 40,
};

describe("Empty State", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders welcome heading with live URL", () => {
    render(<DashboardClient {...baseProps} />);
    expect(
      screen.getByText(/Your waitlist is live at acme\.prewaitlist\.com/)
    ).toBeDefined();
  });

  it("renders share guidance text", () => {
    render(<DashboardClient {...baseProps} />);
    expect(
      screen.getByText("Share your link and start collecting signups.")
    ).toBeDefined();
  });

  it("renders Copy Link button", () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.getByText("Copy Link")).toBeDefined();
  });

  it("renders View Public Page link", () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.getByText("View Public Page")).toBeDefined();
  });

  it("renders What to do next guidance", () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.getByText("What to do next")).toBeDefined();
  });

  it("renders ghost stat cards with em-dashes when empty", () => {
    render(<DashboardClient {...baseProps} />);
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("does NOT render subscriber table when empty", () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.queryByText("Search subscribers...")).toBeNull();
  });
});
