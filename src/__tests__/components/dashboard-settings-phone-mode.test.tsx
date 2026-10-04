import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

vi.mock("../../../components/onboarding/live-preview", () => ({
  LivePreview: () => <div data-testid="live-preview" />,
}));

import WaitlistSettingsClient from "../../app/dashboard/[waitlistId]/settings/client";

const baseWaitlist = {
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

function mockFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function patchCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.filter(
    ([, init]) =>
      typeof init === "object" &&
      init !== null &&
      (init as RequestInit).method === "PATCH"
  );
}

describe("Waitlist Settings — Signup fields (phone collection)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Signup fields block with the approved copy", async () => {
    mockFetch();

    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, phone_mode: "off" }}
        initialTab="qualification"
      />
    );

    expect(await screen.findByText("Signup fields")).toBeDefined();
    expect(
      screen.getByText("Show a phone number field on your public signup form.")
    ).toBeDefined();

    const select = screen.getByLabelText("Phone number");
    expect(select).toBeDefined();
    expect(screen.getByRole("option", { name: "Off" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Optional" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Required" })).toBeDefined();
  });

  it("hydrates the select from waitlist.phone_mode", async () => {
    mockFetch();

    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, phone_mode: "required" }}
        initialTab="qualification"
      />
    );

    const select = (await screen.findByLabelText(
      "Phone number"
    )) as HTMLSelectElement;
    expect(select.value).toBe("required");
  });

  it("defaults to off when phone_mode is missing or invalid", async () => {
    mockFetch();

    const { unmount } = render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist }}
        initialTab="qualification"
      />
    );
    const select = (await screen.findByLabelText(
      "Phone number"
    )) as HTMLSelectElement;
    expect(select.value).toBe("off");
    unmount();

    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, phone_mode: "banana" }}
        initialTab="qualification"
      />
    );
    const select2 = (await screen.findByLabelText(
      "Phone number"
    )) as HTMLSelectElement;
    expect(select2.value).toBe("off");
  });

  it("PATCHes phone_mode on change and shows saved feedback", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch();

    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, phone_mode: "off" }}
        initialTab="qualification"
      />
    );

    const select = (await screen.findByLabelText(
      "Phone number"
    )) as HTMLSelectElement;
    await user.selectOptions(select, "optional");

    expect(select.value).toBe("optional");

    const patches = patchCalls(fetchMock);
    expect(patches).toHaveLength(1);
    const body = JSON.parse((patches[0][1] as RequestInit).body as string);
    expect(body).toEqual({ waitlist_id: "wl-1", phone_mode: "optional" });

    expect(await screen.findByText("Saved")).toBeDefined();
  });

  it("saving state shows while the PATCH is in flight", async () => {
    const user = userEvent.setup();
    let resolvePatch: (v: unknown) => void = () => {};
    const fetchMock = vi
      .fn()
      // mount GET resolves immediately
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      // phone PATCH stays pending until we resolve it
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePatch = resolve;
          })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <WaitlistSettingsClient
        waitlist={{ ...baseWaitlist, phone_mode: "off" }}
        initialTab="qualification"
      />
    );

    const select = (await screen.findByLabelText(
      "Phone number"
    )) as HTMLSelectElement;
    await user.selectOptions(select, "optional");

    // Saving… appears until the PATCH promise resolves
    expect(await screen.findByText("Saving…")).toBeDefined();

    resolvePatch({ ok: true, json: () => Promise.resolve([]) });
    expect(await screen.findByText("Saved")).toBeDefined();
  });
});
