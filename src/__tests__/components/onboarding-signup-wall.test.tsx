import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

const mockGetUser = vi.fn();
vi.mock("../../../src/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    signInWithOAuth: vi.fn(),
  }),
}));

const mockForm = {
  headline: "",
  slug: "",
  template: "minimal",
  brandColor: "#0F7A5E",
  setLoading: vi.fn(),
};
// Partial mock: keep the REAL progress predicate (storedDraftHasProgress)
// so these tests exercise the same logic the wall runs against real
// localStorage — only the form hook is stubbed.
vi.mock("../../app/onboarding/context", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../app/onboarding/context")>();
  return {
    ...actual,
    useOnboardingForm: () => mockForm,
  };
});

import OnboardingSignup from "../../app/onboarding/signup/page";

// QA Batch 2 TC-ONB-14b: hard-landing on the Phase-B signup wall with no
// local draft must go to Step 1 — the wall fabricates defaults and fakes
// "Step 3 of 5" otherwise.
describe("Onboarding signup wall — no-draft redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("redirects to /onboarding/1 when there is no persisted draft", async () => {
    render(<OnboardingSignup />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/onboarding/1")
    );
  });

  it("does not redirect when a persisted draft exists", async () => {
    localStorage.setItem(
      "prewaitlist_onboarding",
      JSON.stringify({ headline: "My product", _ts: Date.now() })
    );

    render(<OnboardingSignup />);

    // Give the mount effect time to run — replace must never fire.
    await waitFor(() => expect(mockForm.setLoading).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // Live-proven regression (2026-10-19): LocalOnboardingProvider persists a
  // defaults-only payload for EVERY visitor ~3ms after mount, so the old
  // "storage key exists" check never redirected a no-draft visitor — they got
  // the fabricated preview + fake "Step 3 of 5" instead of Step 1.
  it("redirects even when a defaults-only draft was persisted on mount", async () => {
    localStorage.setItem(
      "prewaitlist_onboarding",
      JSON.stringify({
        waitlistId: undefined,
        slug: "",
        productName: "",
        headline: "",
        subheadline: "",
        template: "minimal",
        brandColor: "#0F7A5E",
        logoUrl: null,
        ctaText: "Join Waitlist",
        milestoneRewards: [],
        qualificationEnabled: false,
        questions: [],
        signupCounterEnabled: false,
        signupCounterThreshold: 10,
        emailSubject: "",
        emailSenderName: "",
        emailBody: "",
        phoneMode: "off",
        tier: "free",
        loading: false,
        _ts: Date.now(),
      })
    );

    render(<OnboardingSignup />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/onboarding/1")
    );
  });
});

// Pre-existing hydration bug (founder retest of TC-DASH-02): the preview card
// read draft values straight from the form context, so SSR painted defaults
// ("Your Product") while the first client render painted the draft — React
// threw a hydration mismatch. The mounted-gate must guarantee the server HTML
// contains only defaults, and the draft swap happens only post-hydration.
describe("Onboarding signup wall — preview card hydration", () => {
  const DRAFT = {
    headline: "Bat Is the Name",
    slug: "bat",
    template: "bold",
    brandColor: "#123456",
    setLoading: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    localStorage.clear();
    Object.assign(mockForm, DRAFT);
  });

  afterEach(() => {
    localStorage.clear();
    Object.assign(mockForm, {
      headline: "",
      slug: "",
      template: "minimal",
      brandColor: "#0F7A5E",
    });
  });

  it("server HTML contains only defaults, never the draft", () => {
    const html = renderToString(<OnboardingSignup />);

    expect(html).toContain("Your Product");
    expect(html).toContain("your-page.prewaitlist.com");
    expect(html).not.toContain("Bat Is the Name");
    expect(html).not.toContain("bat.prewaitlist.com");
    expect(html).not.toContain("#123456");
  });

  it("swaps in the draft values after mount", () => {
    render(<OnboardingSignup />);

    // Effects flushed by render's act() — the gate opens post-hydration.
    expect(screen.getByText("Bat Is the Name")).toBeDefined();
    expect(screen.getByText("bat.prewaitlist.com")).toBeDefined();
    expect(screen.queryByText("Your Product")).toBeNull();
  });
});
