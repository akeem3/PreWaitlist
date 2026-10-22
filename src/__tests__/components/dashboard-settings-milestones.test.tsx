import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

const previewCalls = vi.hoisted(() => ({
  list: [] as Record<string, unknown>[],
}));

vi.mock("../../../components/onboarding/live-preview", () => ({
  LivePreview: (props: Record<string, unknown>) => {
    previewCalls.list.push(props);
    return <div data-testid="live-preview" />;
  },
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
  phone_mode: null,
};

type PatchRule = (body: Record<string, unknown>) => {
  ok: boolean;
  body: unknown;
};

let fetchLog: { url: string; init?: RequestInit }[] = [];
let getPayload: unknown = [];
let patchRule: PatchRule | null = null;

function installFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      fetchLog.push({ url, init });
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        const outcome = patchRule
          ? patchRule(body)
          : { ok: true, body: { success: true } };
        return Promise.resolve({
          ok: outcome.ok,
          json: () => Promise.resolve(outcome.body),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(getPayload),
      });
    })
  );
}

function patchBodies(): Record<string, unknown>[] {
  return fetchLog
    .filter((c) => c.init?.method === "PATCH")
    .map((c) => JSON.parse(String(c.init?.body)));
}

function getList(
  overrides: Record<string, unknown> = {}
): Record<string, unknown>[] {
  return [
    {
      waitlistId: "wl-1",
      questions: [],
      milestoneRewards: [],
      signupCounterEnabled: false,
      signupCounterThreshold: 10,
      ...overrides,
    },
  ];
}

function renderSettings() {
  return render(
    <WaitlistSettingsClient waitlist={waitlist} initialTab="content" />
  );
}

describe("Waitlist Settings — Milestone rewards card (append-only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewCalls.list.length = 0;
    fetchLog = [];
    getPayload = getList();
    patchRule = null;
    installFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates persisted tiers as read-only rows with a frozen toggle", async () => {
    getPayload = getList({
      milestoneRewards: [
        { threshold: 1, label: "Early access" },
        { threshold: 5, label: "VIP badge" },
      ],
      signupCounterEnabled: true,
      signupCounterThreshold: 25,
    });
    renderSettings();

    await screen.findByText("Early access");
    expect(screen.getByText("VIP badge")).toBeDefined();

    // Frozen rows are spans, never editable inputs.
    expect(screen.queryByDisplayValue("Early access")).toBeNull();
    expect(screen.queryByDisplayValue("VIP badge")).toBeNull();

    // Toggle is checked and locked — persisted milestones can't be disabled.
    const toggle = screen.getByRole("switch", { name: "Milestone rewards" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect((toggle as HTMLButtonElement).disabled).toBe(true);

    // Clicking the disabled toggle must not resurrect an editor.
    const user = userEvent.setup();
    await user.click(toggle);
    expect(screen.queryByDisplayValue("Early access")).toBeNull();

    // Nothing unsaved → no Save button (Content tab has no other one).
    expect(screen.queryByRole("button", { name: /Save changes/ })).toBeNull();

    // Counter state hydrates alongside.
    const counterToggle = screen.getByRole("switch", {
      name: "Signup counter",
    });
    expect(counterToggle.getAttribute("aria-checked")).toBe("true");
    const thresholdInput = screen.getByPlaceholderText(
      "10"
    ) as HTMLInputElement;
    expect(thresholdInput.value).toBe("25");

    // Preview receives the real persisted values, never [].
    const lastPreview = previewCalls.list[previewCalls.list.length - 1];
    expect(lastPreview.milestoneRewards).toEqual([
      { threshold: 1, label: "Early access" },
      { threshold: 5, label: "VIP badge" },
    ]);
    expect(lastPreview.signupCounterEnabled).toBe(true);
    expect(lastPreview.signupCounterThreshold).toBe(25);
  });

  it("appends a new tier and saves the full superset", async () => {
    getPayload = getList({
      milestoneRewards: [{ threshold: 1, label: "Early access" }],
    });
    renderSettings();
    const user = userEvent.setup();

    await screen.findByText("Early access");
    await user.click(screen.getByRole("button", { name: /Add tier/ }));

    // Draft row: threshold defaults to last persisted + 5.
    const thresholdInputs = screen.getAllByPlaceholderText(
      "3"
    ) as HTMLInputElement[];
    expect(thresholdInputs).toHaveLength(1);
    expect(thresholdInputs[0].value).toBe("6");

    const labelInput = screen.getByPlaceholderText(
      "e.g. Free Pro plan for 1 month"
    );
    await user.type(labelInput, "Founder call");

    // Unsaved draft reaches the preview immediately.
    let lastPreview = previewCalls.list[previewCalls.list.length - 1];
    expect(lastPreview.milestoneRewards).toEqual([
      { threshold: 1, label: "Early access" },
      { threshold: 6, label: "Founder call" },
    ]);

    await user.click(screen.getByRole("button", { name: /Save changes/ }));
    await screen.findByText("Saved!");

    const milestonePatches = patchBodies().filter(
      (b) => "milestone_rewards" in b
    );
    expect(milestonePatches).toHaveLength(1);
    expect(milestonePatches[0].milestone_rewards).toEqual([
      { threshold: 1, label: "Early access" },
      { threshold: 6, label: "Founder call" },
    ]);

    // After save the new tier joins the frozen base.
    expect(screen.queryByDisplayValue("Founder call")).toBeNull();
    expect(screen.getByText("Founder call")).toBeDefined();
    expect(screen.queryAllByLabelText("Remove tier")).toHaveLength(0);
    expect(
      (
        screen.getByRole("switch", {
          name: "Milestone rewards",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    lastPreview = previewCalls.list[previewCalls.list.length - 1];
    expect(lastPreview.milestoneRewards).toEqual([
      { threshold: 1, label: "Early access" },
      { threshold: 6, label: "Founder call" },
    ]);
  });

  it("prefills defaults on enable, blocks save on validation, clears drafts on disable", async () => {
    getPayload = getList({ milestoneRewards: [] });
    renderSettings();
    const user = userEvent.setup();

    const toggle = await screen.findByRole("switch", {
      name: "Milestone rewards",
    });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await user.click(toggle);

    // Four draft rows prefilled with the approved defaults.
    expect(await screen.findByDisplayValue("Early access")).toBeDefined();
    expect(screen.getByDisplayValue("Free Pro plan for 1 month")).toBeDefined();
    expect(screen.getByDisplayValue("Lifetime 20% discount")).toBeDefined();
    expect(screen.getByDisplayValue("Founding member status")).toBeDefined();
    expect(screen.getByRole("button", { name: /Save changes/ })).toBeDefined();

    // Empty label blocks the save with the approved validation string.
    const firstLabel = screen.getByDisplayValue("Early access");
    await user.clear(firstLabel);
    await user.click(screen.getByRole("button", { name: /Save changes/ }));
    await screen.findByText('Reward for "Refer 1 friends" is required');
    expect(patchBodies().filter((b) => "milestone_rewards" in b)).toHaveLength(
      0
    );

    // Turning the toggle back off discards the unsaved draft locally.
    await user.click(screen.getByRole("switch", { name: "Milestone rewards" }));
    expect(screen.queryByDisplayValue("Free Pro plan for 1 month")).toBeNull();
    expect(screen.queryByRole("button", { name: /Save changes/ })).toBeNull();
  });

  it("surfaces the server's append-only rejection on save", async () => {
    getPayload = getList({
      milestoneRewards: [{ threshold: 1, label: "Early access" }],
    });
    patchRule = (body) =>
      "milestone_rewards" in body
        ? {
            ok: false,
            body: { error: "Existing milestones can't be removed or edited." },
          }
        : { ok: true, body: { success: true } };
    renderSettings();
    const user = userEvent.setup();

    await screen.findByText("Early access");
    await user.click(screen.getByRole("button", { name: /Add tier/ }));
    await user.type(
      screen.getByPlaceholderText("e.g. Free Pro plan for 1 month"),
      "Founder call"
    );
    await user.click(screen.getByRole("button", { name: /Save changes/ }));

    await screen.findByText("Existing milestones can't be removed or edited.");
    // Draft survives so the founder can back out — nothing frozen on failure.
    expect(screen.queryByText("Saved!")).toBeNull();
  });
});

describe("Waitlist Settings — Signup counter card (instant save)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewCalls.list.length = 0;
    fetchLog = [];
    getPayload = getList();
    patchRule = null;
    installFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves toggle changes immediately", async () => {
    getPayload = getList({ signupCounterEnabled: false });
    renderSettings();
    const user = userEvent.setup();

    const toggle = await screen.findByRole("switch", {
      name: "Signup counter",
    });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await user.click(toggle);

    expect(toggle.getAttribute("aria-checked")).toBe("true");
    const bodies = patchBodies().filter((b) => "signup_counter_enabled" in b);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].signup_counter_enabled).toBe(true);
    expect(bodies[0].waitlist_id).toBe("wl-1");
  });

  it("saves the threshold on blur", async () => {
    getPayload = getList({ signupCounterEnabled: true });
    renderSettings();

    const thresholdInput = (await screen.findByPlaceholderText(
      "10"
    )) as HTMLInputElement;
    expect(thresholdInput.value).toBe("10");
    // Direct change (not userEvent.clear + type): the handler intentionally
    // ignores non-positive input, so a cleared field snaps back to state and
    // appended keystrokes would type "1030". This mirrors select-all + type.
    fireEvent.change(thresholdInput, { target: { value: "30" } });
    // React derives onBlur from the bubbling focusout event.
    fireEvent.focusOut(thresholdInput);

    const bodies = patchBodies().filter((b) => "signup_counter_threshold" in b);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].signup_counter_threshold).toBe(30);
  });

  it("keeps the threshold input hidden while the toggle is off", async () => {
    getPayload = getList({ signupCounterEnabled: false });
    renderSettings();

    await screen.findByRole("switch", { name: "Signup counter" });
    expect(screen.queryByPlaceholderText("10")).toBeNull();

    const lastPreview = previewCalls.list[previewCalls.list.length - 1];
    expect(lastPreview.signupCounterEnabled).toBe(false);
    expect(lastPreview.milestoneRewards).toEqual([]);
  });
});
