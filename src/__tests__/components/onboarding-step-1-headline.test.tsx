import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalOnboardingProvider } from "../../app/onboarding/context";
import OnboardingStep1 from "../../app/onboarding/1/page";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorage.clear();
  pushMock.mockClear();
  // slug availability — always available (debounce → fetch → available)
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ available: true }),
    })
  );
});

function draft(): Record<string, unknown> {
  const raw = localStorage.getItem("prewaitlist_onboarding");
  expect(raw).not.toBeNull();
  return JSON.parse(raw!) as Record<string, unknown>;
}

function renderStep1() {
  return render(
    <LocalOnboardingProvider>
      <OnboardingStep1 />
    </LocalOnboardingProvider>
  );
}

async function fillSlugAndUnlockSubmit(
  user: ReturnType<typeof userEvent.setup>,
  value: string
) {
  await user.type(screen.getByLabelText("Subdomain"), value);
  await waitFor(
    () => expect(screen.getByRole("button", { name: /Next/ })).toBeEnabled(),
    { timeout: 2000 }
  );
}

describe("Onboarding Step 1 — Headline field (18.5 AC1d)", () => {
  it("renders the Headline field between Product Name and Subheadline", () => {
    renderStep1();
    const productName = screen.getByLabelText("Product Name");
    const headline = screen.getByLabelText("Headline");
    const subheadline = screen.getByLabelText("Subheadline");

    expect(headline.id).toBe("headline");
    const follows = (a: Element, b: Element) =>
      !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(productName, headline)).toBe(true);
    expect(follows(headline, subheadline)).toBe(true);
  });

  it("persists a typed headline on submit", async () => {
    const user = userEvent.setup();
    renderStep1();

    await user.type(
      screen.getByLabelText("Headline"),
      "Ship faster with Buildly"
    );
    await fillSlugAndUnlockSubmit(user, "buildly");
    await user.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() =>
      expect(draft().headline).toBe("Ship faster with Buildly")
    );
    expect(pushMock).toHaveBeenCalledWith("/onboarding/2");
  });

  it("falls back to Product Name when Headline is empty", async () => {
    const user = userEvent.setup();
    renderStep1();

    await user.type(screen.getByLabelText("Product Name"), "Buildly");
    await fillSlugAndUnlockSubmit(user, "buildly");
    await user.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => expect(draft().headline).toBe("Buildly"));
  });

  it("falls back to the slug when Headline and Product Name are empty", async () => {
    const user = userEvent.setup();
    renderStep1();

    await fillSlugAndUnlockSubmit(user, "My Product");
    await user.click(screen.getByRole("button", { name: /Next/ }));

    // deriveSlug lowercases + strips non-[a-z0-9-] (spaces are removed)
    await waitFor(() => expect(draft().headline).toBe("myproduct"));
  });

  it("does not overwrite a typed headline with Product Name", async () => {
    const user = userEvent.setup();
    renderStep1();

    await user.type(screen.getByLabelText("Product Name"), "Buildly");
    await user.type(
      screen.getByLabelText("Headline"),
      "Original headline stays"
    );
    await fillSlugAndUnlockSubmit(user, "buildly");
    await user.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() =>
      expect(draft().headline).toBe("Original headline stays")
    );
  });

  it("I'll name it later keeps a typed headline", async () => {
    const user = userEvent.setup();
    renderStep1();

    await user.type(screen.getByLabelText("Headline"), "Keep me on skip");
    await user.click(screen.getByRole("button", { name: /name it later/i }));

    await waitFor(() => expect(draft().headline).toBe("Keep me on skip"));
    expect(pushMock).toHaveBeenCalledWith("/onboarding/2");
  });

  it("I'll name it later defaults an empty headline to My Waitlist", async () => {
    const user = userEvent.setup();
    renderStep1();

    await user.click(screen.getByRole("button", { name: /name it later/i }));

    await waitFor(() => expect(draft().headline).toBe("My Waitlist"));
    expect(pushMock).toHaveBeenCalledWith("/onboarding/2");
  });
});
