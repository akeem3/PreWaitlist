import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

vi.mock("../../app/dashboard/shell", () => ({
  useUpgradeModal: () => vi.fn(),
}));

// Captures the logoUrl prop passed to the preview (18.5 parity lock).
vi.mock("../../../components/onboarding/live-preview", () => ({
  LivePreview: (props: { logoUrl?: string | null }) => (
    <div data-testid="live-preview" data-logo={props.logoUrl ?? ""} />
  ),
}));

import WaitlistSettingsClient from "../../app/dashboard/[waitlistId]/settings/client";

const waitlist = {
  id: "wl-1",
  headline: "Acme",
  subheadline: null,
  cta_text: null,
  logo_url: null,
  brand_color: null,
  template: "minimal",
  sender_name: null,
  cold_threshold: 40,
  is_archived: false,
  tier: "pro",
  business_address: null,
  product_name: "Acme",
};

const DATA_URL = /^data:image\/png;base64,/;

let fetchMock: ReturnType<typeof vi.fn>;

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
}

function patchBodies(): Record<string, unknown>[] {
  return fetchMock.mock.calls
    .filter((c) => (c[1] as RequestInit | undefined)?.method === "PATCH")
    .map((c) => JSON.parse(String((c[1] as RequestInit).body)));
}

describe("Waitlist Settings — logo upload control (18.5 AC1e)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ waitlistId: "wl-1", questions: [] }]),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("initial state (no logo): upload copy, no thumbnail, no Remove, no Logo URL text input", async () => {
    const { container } = render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="content" />
    );

    expect(
      await screen.findByRole("button", {
        name: "Click to upload logo (PNG or SVG, max 2MB)",
      })
    ).toBeDefined();
    expect(screen.queryByRole("img", { name: "Logo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    // AC3 lock: the URL text input was replaced by the upload control
    expect(screen.queryByLabelText("Logo URL")).toBeNull();
    // AC4: hidden file input, accept limited to PNG/SVG
    const input = getFileInput(container);
    expect(input.accept).toBe("image/png,image/svg+xml");
    // preview starts with no logo
    expect(screen.getByTestId("live-preview").getAttribute("data-logo")).toBe(
      ""
    );
  });

  it("upload sets the thumbnail and replace copy, PATCHes the data URL, and passes it to the preview", async () => {
    const { container } = render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="content" />
    );
    await screen.findByRole("button", { name: /Click to upload logo/ });

    const file = new File([new Uint8Array(64)], "logo.png", {
      type: "image/png",
    });
    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    // thumbnail + "Logo uploaded — click to replace" + Remove appear
    const img = await screen.findByRole("img", { name: "Logo" });
    expect(img.getAttribute("src")).toMatch(DATA_URL);
    expect(
      screen.getByRole("button", {
        name: "Logo uploaded — click to replace",
      })
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Remove" })).toBeDefined();

    // preview receives the data URL
    await waitFor(() =>
      expect(
        screen.getByTestId("live-preview").getAttribute("data-logo")
      ).toMatch(DATA_URL)
    );

    // immediate persistence via saveField PATCH
    await waitFor(() => {
      const bodies = patchBodies();
      expect(bodies).toHaveLength(1);
      expect(bodies[0].waitlist_id).toBe("wl-1");
      expect(bodies[0].logo_url).toMatch(DATA_URL);
    });
  });

  it("Remove clears the thumbnail, restores upload copy, and PATCHes logo_url: ''", async () => {
    const { container } = render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="content" />
    );
    await screen.findByRole("button", { name: /Click to upload logo/ });

    const file = new File([new Uint8Array(64)], "logo.png", {
      type: "image/png",
    });
    fireEvent.change(getFileInput(container), { target: { files: [file] } });
    await screen.findByRole("img", { name: "Logo" });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(screen.queryByRole("img", { name: "Logo" })).toBeNull()
    );
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Click to upload logo (PNG or SVG, max 2MB)",
      })
    ).toBeDefined();
    expect(screen.getByTestId("live-preview").getAttribute("data-logo")).toBe(
      ""
    );

    // last PATCH clears the logo
    await waitFor(() => {
      const bodies = patchBodies();
      expect(bodies.length).toBeGreaterThanOrEqual(2);
      expect(bodies[bodies.length - 1].logo_url).toBe("");
    });
  });

  it("rejects files over 2MB with an alert and no upload or PATCH", async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal("alert", alertSpy);
    const { container } = render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="content" />
    );
    await screen.findByRole("button", { name: /Click to upload logo/ });

    const oversized = new File(
      [new Uint8Array(2 * 1024 * 1024 + 1)],
      "big.png",
      { type: "image/png" }
    );
    fireEvent.change(getFileInput(container), {
      target: { files: [oversized] },
    });

    expect(alertSpy).toHaveBeenCalledWith("File must be under 2MB");
    expect(screen.queryByRole("img", { name: "Logo" })).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Click to upload logo (PNG or SVG, max 2MB)",
      })
    ).toBeDefined();
    expect(patchBodies()).toHaveLength(0);
  });
});
