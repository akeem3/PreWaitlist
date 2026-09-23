import { describe, it, expect, vi, beforeEach } from "vitest";
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

import WarmthPanel from "../../../components/dashboard/warmth-panel";

describe("Tier Gating — WarmthPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders view-only bars with upgrade CTA for free tier", () => {
    render(
      <WarmthPanel
        tier="free"
        warmthData={{ hot: 10, warm: 5, cold: 3, unscored: 2, total: 20 }}
        onUpgradeClick={vi.fn()}
      />
    );
    expect(screen.getByText("Hot")).toBeDefined();
    expect(screen.getByText("Warm")).toBeDefined();
    expect(screen.getByText("Cold")).toBeDefined();
    expect(screen.getByText("Unscored")).toBeDefined();
    expect(screen.getByText("10 (50%)")).toBeDefined();
    expect(screen.getByText("Upgrade to target segments")).toBeDefined();
  });

  it("renders live data bars for pro tier with data", () => {
    render(
      <WarmthPanel
        tier="pro"
        warmthData={{ hot: 10, warm: 5, cold: 3, unscored: 2, total: 20 }}
      />
    );
    expect(screen.getByText("Hot")).toBeDefined();
    expect(screen.getByText("Warm")).toBeDefined();
    expect(screen.getByText("Cold")).toBeDefined();
    expect(screen.getByText("Unscored")).toBeDefined();
    expect(screen.getByText("10 (50%)")).toBeDefined();
  });

  it("shows em-dash when pro tier has zero subscribers", () => {
    render(
      <WarmthPanel
        tier="pro"
        warmthData={{ hot: 0, warm: 0, cold: 0, unscored: 0, total: 0 }}
      />
    );
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBe(4);
  });
});
