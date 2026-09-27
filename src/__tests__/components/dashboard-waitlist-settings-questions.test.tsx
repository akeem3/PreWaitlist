import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

const existingQuestions = [
  {
    id: "q1",
    text: "Which tools do you use today?",
    type: "free_text" as const,
    options: null,
  },
  {
    id: "q2",
    text: "What is your role?",
    type: "multiple_choice" as const,
    options: ["Founder", "Engineer"],
  },
];

function mockGetWaitlist(items: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(items),
    })
  );
}

describe("Waitlist Settings — qualification questions hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads existing questions into the editor (waitlistId key)", async () => {
    // GET /api/waitlist returns items keyed `waitlistId`, NOT `id` — matching
    // on `.id` silently hydrated an empty editor (the reported bug).
    mockGetWaitlist([{ waitlistId: "wl-1", questions: existingQuestions }]);

    render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="qualification" />
    );

    const input1 = await screen.findByDisplayValue(
      "Which tools do you use today?"
    );
    expect(input1).toBeDefined();
    const input2 = await screen.findByDisplayValue("What is your role?");
    expect(input2).toBeDefined();

    // no empty-state misdirection when questions exist
    expect(
      screen.queryByText("No qualification questions configured.")
    ).toBeNull();
  });

  it("hydrates question type and multiple-choice options", async () => {
    mockGetWaitlist([{ waitlistId: "wl-1", questions: existingQuestions }]);

    render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="qualification" />
    );

    await screen.findByDisplayValue("What is your role?");
    expect(await screen.findByDisplayValue("Founder")).toBeDefined();
    expect(await screen.findByDisplayValue("Engineer")).toBeDefined();
    // MC type restored from DB, not defaulted to free text
    const mcRadios = screen.getAllByRole("radio", { name: /Multiple choice/ });
    expect(mcRadios).toHaveLength(2);
    expect(
      mcRadios.some((r) => r.getAttribute("aria-checked") === "true")
    ).toBe(true);
  });

  it("keeps add and remove affordances visible for editing", async () => {
    mockGetWaitlist([{ waitlistId: "wl-1", questions: existingQuestions }]);

    render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="qualification" />
    );

    await screen.findByDisplayValue("Which tools do you use today?");
    expect(
      screen.getByRole("button", { name: /Add new question/ })
    ).toBeDefined();
    expect(screen.getByLabelText("Remove question 1")).toBeDefined();
    expect(screen.getByLabelText("Remove question 2")).toBeDefined();
    expect(screen.getByRole("button", { name: /Save changes/ })).toBeDefined();
  });

  it("still shows the empty state when the waitlist has no questions", async () => {
    mockGetWaitlist([{ waitlistId: "wl-1", questions: [] }]);

    render(
      <WaitlistSettingsClient waitlist={waitlist} initialTab="qualification" />
    );

    expect(
      await screen.findByText("No qualification questions configured.")
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Add new question/ })
    ).toBeDefined();
  });
});
