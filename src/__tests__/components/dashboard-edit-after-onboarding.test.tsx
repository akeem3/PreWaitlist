import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/wl-1/settings",
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

import WaitlistSettingsClient from "@/app/dashboard/[waitlistId]/settings/client";

const baseWaitlist = {
  id: "wl-1",
  headline: "Join us",
  subheadline: "Be first",
  cta_text: "Join",
  logo_url: "https://example.com/logo.png",
  brand_color: "#0F7A5E",
  template: "minimal",
  sender_name: "Acme",
  cold_threshold: 40,
  is_archived: false,
  tier: "free",
  business_address: "123 Main St",
};

describe("Edit After Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders editable fields for headline, subheadline, CTA, logo", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    expect(screen.getByDisplayValue("Join us")).toBeDefined();
    expect(screen.getByDisplayValue("Be first")).toBeDefined();
    expect(screen.getByDisplayValue("Join")).toBeDefined();
    expect(
      screen.getByDisplayValue("https://example.com/logo.png")
    ).toBeDefined();
  });

  it("renders sender name in email tab", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Email"));
    expect(screen.getByDisplayValue("Acme")).toBeDefined();
  });

  it("save triggers PATCH on blur", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    const headlineInput = screen.getByDisplayValue("Join us");
    fireEvent.change(headlineInput, { target: { value: "New headline" } });
    fireEvent.blur(headlineInput);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/waitlist",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            waitlist_id: "wl-1",
            headline: "New headline",
          }),
        })
      );
    });
  });

  it("shows saved feedback after successful save", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    const headlineInput = screen.getByDisplayValue("Join us");
    fireEvent.blur(headlineInput);

    await vi.waitFor(() => {
      expect(screen.getByText("Saved")).toBeDefined();
    });
  });

  it("renders live preview in content tab", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    expect(screen.getByText("Preview")).toBeDefined();
  });

  it("renders brand color picker", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    const colorInput = screen.getByDisplayValue("#0F7A5E");
    expect(colorInput).toBeDefined();
  });
});
