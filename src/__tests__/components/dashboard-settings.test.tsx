import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/settings",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

vi.mock("../../../lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

import SettingsHubClient from "../../app/dashboard/settings/client";

describe("Settings Hub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings page heading", () => {
    render(<SettingsHubClient waitlistCount={1} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Settings" })
    ).toBeDefined();
  });

  it("renders waitlist settings category", () => {
    render(<SettingsHubClient waitlistCount={2} />);
    expect(screen.getByText("Waitlist Settings")).toBeDefined();
    expect(screen.getByText("2 waitlists")).toBeDefined();
  });

  it("renders profile category", () => {
    render(<SettingsHubClient waitlistCount={1} />);
    expect(screen.getByText("Profile")).toBeDefined();
  });

  it("shows sign out button", () => {
    render(<SettingsHubClient waitlistCount={0} />);
    expect(screen.getByText("Sign out")).toBeDefined();
  });

  it("shows waitlist count correctly for single waitlist", () => {
    render(<SettingsHubClient waitlistCount={1} />);
    expect(screen.getByText("1 waitlist")).toBeDefined();
  });
});
