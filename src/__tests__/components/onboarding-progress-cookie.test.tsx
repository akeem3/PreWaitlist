import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LocalOnboardingProvider,
  hasOnboardingProgress,
  storedDraftHasProgress,
  useOnboardingForm,
} from "../../app/onboarding/context";
import { ONBOARDING_PROGRESS_COOKIE } from "@/lib/onboarding-progress-core";

// Bugs locked here (QA Batch 2 TC-ONB-14a/14b, live-verified 2026-10-19):
// the provider persisted a defaults-only draft + wrote the guard cookie for
// EVERY visitor on mount, so the cookie meant "an onboarding route mounted",
// not "draft in progress" — OnboardingGuard's re-run protection was dead, and
// the signup wall's raw-key check could never tell a real draft apart.

const DEFAULTS = {
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
};

function guardCookie(): string | null {
  const prefix = `${ONBOARDING_PROGRESS_COOKIE}=`;
  const row = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

function clearGuardCookie() {
  document.cookie = `${ONBOARDING_PROGRESS_COOKIE}=; path=/; max-age=0`;
}

function seedDraft(extra: Record<string, unknown> = {}, ageMs = 0) {
  localStorage.setItem(
    "prewaitlist_onboarding",
    JSON.stringify({ ...DEFAULTS, _ts: Date.now() - ageMs, ...extra })
  );
}

function DraftControls() {
  const form = useOnboardingForm();
  return (
    <>
      <button type="button" onClick={() => form.updateField("slug", "acme")}>
        Type slug
      </button>
      <button type="button" onClick={() => form.clearDraft()}>
        Start fresh
      </button>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearGuardCookie();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  clearGuardCookie();
});

describe("hasOnboardingProgress — what counts as a real draft", () => {
  it("treats a missing draft as no progress", () => {
    expect(hasOnboardingProgress(null)).toBe(false);
    expect(hasOnboardingProgress(undefined)).toBe(false);
  });

  it("rejects the defaults-only payload the provider writes on mount", () => {
    expect(hasOnboardingProgress(DEFAULTS)).toBe(false);
  });

  it("ignores tier — provenance, not progress", () => {
    expect(hasOnboardingProgress({ ...DEFAULTS, tier: "pro" })).toBe(false);
  });

  it.each([
    ["slug", { slug: "acme" }],
    ["productName", { productName: "Acme" }],
    ["headline", { headline: "Ship faster" }],
    ["subheadline", { subheadline: "The smarter way" }],
    ["template", { template: "bold" }],
    ["brandColor", { brandColor: "#2563EB" }],
    ["logoUrl", { logoUrl: "data:image/png;base64,abc" }],
    ["ctaText", { ctaText: "Get early access" }],
    ["milestoneRewards", { milestoneRewards: [{ threshold: 3, label: "x" }] }],
    ["qualificationEnabled", { qualificationEnabled: true }],
    ["questions", { questions: [{ text: "Who are you?", type: "free_text" }] }],
    ["signupCounterEnabled", { signupCounterEnabled: true }],
    ["signupCounterThreshold", { signupCounterThreshold: 25 }],
    ["emailSubject", { emailSubject: "Welcome aboard" }],
    ["emailSenderName", { emailSenderName: "Hana" }],
    ["emailBody", { emailBody: "You're on the list" }],
    ["phoneMode", { phoneMode: "required" }],
  ])("accepts a changed %s field", (_field, change) => {
    expect(hasOnboardingProgress({ ...DEFAULTS, ...change })).toBe(true);
  });

  it("storedDraftHasProgress reads real localStorage (TTL honored)", () => {
    expect(storedDraftHasProgress()).toBe(false);

    seedDraft({ slug: "live" });
    expect(storedDraftHasProgress()).toBe(true);

    seedDraft({}, 25 * 60 * 60 * 1000); // older than the 24h TTL
    expect(storedDraftHasProgress()).toBe(false);
  });
});

describe("Guard cookie (onboarding_in_progress) — written only on real progress", () => {
  it("a fresh visit (defaults-only draft) writes NO cookie", () => {
    render(
      <LocalOnboardingProvider>
        <span>fresh</span>
      </LocalOnboardingProvider>
    );

    // Pre-fix: the mount persist effect wrote both the defaults-only draft
    // and this cookie — disabling OnboardingGuard for every signed-in founder.
    expect(guardCookie()).toBeNull();
    expect(localStorage.getItem("prewaitlist_onboarding")).not.toBeNull();
  });

  it("editing a field flips the cookie on (mid-flow signal)", () => {
    render(
      <LocalOnboardingProvider>
        <DraftControls />
      </LocalOnboardingProvider>
    );
    expect(guardCookie()).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Type slug" }));

    expect(guardCookie()).toBe("1");
    expect(storedDraftHasProgress()).toBe(true);
  });

  it("a seeded real draft writes the cookie on mount", () => {
    seedDraft({ slug: "buildly" });

    render(
      <LocalOnboardingProvider>
        <span>resume</span>
      </LocalOnboardingProvider>
    );

    expect(guardCookie()).toBe("1");
  });

  it("Start fresh (clearDraft) drops the cookie with the draft", () => {
    seedDraft({ slug: "buildly" });

    render(
      <LocalOnboardingProvider>
        <DraftControls />
      </LocalOnboardingProvider>
    );
    expect(guardCookie()).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Start fresh" }));

    // clearDraft wipes the draft, then the persist effect re-writes the
    // defaults-only payload — what matters is the cookie is gone and the
    // remaining draft no longer counts as progress.
    expect(guardCookie()).toBeNull();
    expect(storedDraftHasProgress()).toBe(false);
  });
});
