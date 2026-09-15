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
  logo_url: null,
  brand_color: "#0F7A5E",
  template: "minimal",
  sender_name: null,
  cold_threshold: 40,
  is_archived: false,
  tier: "free",
  business_address: null,
};

describe("Settings — Business Address", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders business address field in email tab", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Email"));
    expect(screen.getByText("Business address")).toBeDefined();
  });

  it("renders business address input with placeholder", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Email"));
    expect(
      screen.getByPlaceholderText("Acme Inc., 123 Main St, City, State 12345")
    ).toBeDefined();
  });

  it("renders CAN-SPAM helper text", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Email"));
    expect(
      screen.getByText(/Physical address required in marketing emails/)
    ).toBeDefined();
  });

  it("save triggers PATCH on blur", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Email"));

    const input = screen.getByPlaceholderText(
      "Acme Inc., 123 Main St, City, State 12345"
    );
    fireEvent.change(input, {
      target: { value: "Acme Inc, 456 Oak Ave, NYC" },
    });
    fireEvent.blur(input);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/waitlist",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            waitlist_id: "wl-1",
            business_address: "Acme Inc, 456 Oak Ave, NYC",
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
    fireEvent.click(screen.getByText("Email"));

    const input = screen.getByPlaceholderText(
      "Acme Inc., 123 Main St, City, State 12345"
    );
    fireEvent.blur(input);

    await vi.waitFor(() => {
      expect(screen.getByText("Saved")).toBeDefined();
    });
  });
});
