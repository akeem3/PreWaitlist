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

describe("Archive Waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // happy-dom doesn't have window.confirm — define it
    vi.stubGlobal("confirm", vi.fn());
  });

  it("renders archive button in advanced tab", () => {
    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Advanced"));
    // Both heading and button say "Archive waitlist" — use getAllByText
    const archiveElements = screen.getAllByText("Archive waitlist");
    expect(archiveElements.length).toBeGreaterThanOrEqual(2);
  });

  it("calls API on archive click", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Advanced"));
    const archiveButtons = screen.getAllByText("Archive waitlist");
    const button = archiveButtons.find((el) => el.tagName === "BUTTON");
    fireEvent.click(button!);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/waitlist",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  it("calls API on confirmed archive", async () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistSettingsClient waitlist={baseWaitlist} />);
    fireEvent.click(screen.getByText("Advanced"));
    const archiveButtons = screen.getAllByText("Archive waitlist");
    const button = archiveButtons.find((el) => el.tagName === "BUTTON");
    fireEvent.click(button!);

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/waitlist",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  it("shows archived badge when waitlist is archived", () => {
    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, is_archived: true }}
      />
    );
    fireEvent.click(screen.getByText("Advanced"));
    expect(screen.getByText("Archived")).toBeDefined();
  });

  it("shows unarchive button when archived", () => {
    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, is_archived: true }}
      />
    );
    fireEvent.click(screen.getByText("Advanced"));
    expect(screen.getByText("Unarchive")).toBeDefined();
  });

  it("calls API on unarchive", async () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, is_archived: true }}
      />
    );
    fireEvent.click(screen.getByText("Advanced"));
    fireEvent.click(screen.getByText("Unarchive"));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/waitlist",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });
});
