import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalOnboardingProvider } from "../../app/onboarding/context";
import OnboardingStep1 from "../../app/onboarding/1/page";
import OnboardingStep2 from "../../app/onboarding/2/page";
import OnboardingStep3 from "../../app/onboarding/3/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

const DRAFT_KEY = "prewaitlist_onboarding";

function seedDraft(extra: Record<string, unknown> = {}) {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      slug: "buildly",
      productName: "Buildly",
      headline: "Ship faster with Buildly",
      subheadline: "The smarter way to ship",
      template: "minimal",
      brandColor: "#0F7A5E",
      ctaText: "Join Waitlist",
      milestoneRewards: [],
      qualificationEnabled: false,
      questions: [],
      signupCounterEnabled: false,
      signupCounterThreshold: 10,
      emailSubject: "",
      emailSenderName: "",
      emailBody: "",
      tier: "free",
      _ts: Date.now(),
      ...extra,
    })
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("Onboarding draft resume with hydration gates", () => {
  it("Step 1: draft prefills fields and unlocks submit after mount", () => {
    seedDraft();
    render(
      <LocalOnboardingProvider>
        <OnboardingStep1 />
      </LocalOnboardingProvider>
    );

    expect(screen.getByLabelText("Subdomain")).toHaveValue("buildly");
    expect(screen.getByLabelText("Headline")).toHaveValue(
      "Ship faster with Buildly"
    );
    expect(screen.getByLabelText("Subheadline")).toHaveValue(
      "The smarter way to ship"
    );
    expect(screen.getByRole("button", { name: /Next/ })).toBeEnabled();
  });

  it("Step 2: draft template card is highlighted after mount", () => {
    seedDraft({ template: "bold" });
    render(
      <LocalOnboardingProvider>
        <OnboardingStep2 />
      </LocalOnboardingProvider>
    );

    const boldCard = screen.getByRole("button", { name: /Bold/ });
    const minimalCard = screen.getByRole("button", { name: /Minimal/ });
    expect(boldCard.className).toContain("border-2 border-accent");
    expect(minimalCard.className).toContain("border border-border");
    expect(minimalCard.className).not.toContain("border-2 border-accent");
    expect(screen.getByRole("button", { name: /Next/ })).toBeEnabled();
  });

  it("Step 3: draft brand color, logo, and toggles applied after mount", () => {
    seedDraft({
      brandColor: "#2563EB",
      logoUrl: "data:image/png;base64,abc",
      milestoneRewards: [{ threshold: 3, label: "Early access" }],
      signupCounterEnabled: true,
    });
    render(
      <LocalOnboardingProvider>
        <OnboardingStep3 />
      </LocalOnboardingProvider>
    );

    // Brand swatch ring follows the draft color (Blue), not the default Jade
    expect(screen.getByTitle("Blue").className).toContain("ring-1");
    expect(screen.getByTitle("Jade").className).not.toContain("ring-1");

    // Logo upload button reflects the draft logo
    expect(
      screen.getByRole("button", { name: /Logo uploaded/ })
    ).toBeInTheDocument();

    // Both toggles on, both config blocks expanded
    const [milestoneToggle, counterToggle] = screen.getAllByRole("switch");
    expect(milestoneToggle).toHaveAttribute("aria-checked", "true");
    expect(counterToggle).toHaveAttribute("aria-checked", "true");
    // "Add tier" only renders inside the expanded milestone block
    expect(
      screen.getByRole("button", { name: /Add tier/ })
    ).toBeInTheDocument();
    expect(screen.getByText("or more signups")).toBeInTheDocument();
  });
});
