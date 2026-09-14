import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/settings",
  useRouter: () => ({ push: vi.fn() }),
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

import SettingsClient from "../../app/dashboard/settings/client";

const baseProps = {
  waitlistId: "w1",
  waitlistName: "Acme",
  logoUrl: null as string | null,
  senderName: null,
  coldThreshold: 40,
  sendingDomain: null,
  tier: "free",
  paddleSubscriptionId: null,
};

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings page heading", () => {
    render(<SettingsClient {...baseProps} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Settings" })
    ).toBeDefined();
  });

  it("renders sender name input", () => {
    render(<SettingsClient {...baseProps} />);
    expect(screen.getByText("Sender name")).toBeDefined();
  });

  it("renders cold threshold section", () => {
    render(<SettingsClient {...baseProps} />);
    expect(screen.getByText("Cold threshold (%)")).toBeDefined();
  });

  it("upgrade button has coming soon title for free tier", () => {
    render(<SettingsClient {...baseProps} tier="free" />);
    const upgradeBtns = screen.getAllByText("Upgrade to Pro");
    const billingSection = upgradeBtns.find(
      (el) =>
        el.closest("button")?.getAttribute("title") ===
        "Paddle billing coming soon"
    );
    expect(billingSection).toBeDefined();
  });

  it("manage billing button appears for pro tier", () => {
    render(<SettingsClient {...baseProps} tier="pro" />);
    const billingBtn = screen.getByText("Manage billing").closest("button");
    expect(billingBtn?.getAttribute("title")).toBe(
      "Paddle billing coming soon"
    );
  });
});
