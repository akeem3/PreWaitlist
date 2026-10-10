import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalOnboardingProvider } from "../../app/onboarding/context";
import OnboardingStep4a from "../../app/onboarding/4a/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Onboarding Step 4a — qualification helper caption (Prompt #8)", () => {
  it("shows the approved scaffolding caption below the heading", () => {
    render(
      <LocalOnboardingProvider>
        <OnboardingStep4a />
      </LocalOnboardingProvider>
    );

    const heading = screen.getByRole("heading", {
      name: "Qualify your leads",
    });
    // Approved copy verbatim (straight quotes, matching the editor placeholder).
    // getByText resolves the inner <span>; assertions run on the parent <p>.
    const caption = screen
      .getByText(/Not sure what to ask\? Try:/)
      .closest("p") as HTMLParagraphElement;
    // Full verbatim lock — catches separator/spacing drift, not just the
    // example sentences (copy gate: approved string, exact).
    expect(caption.textContent).toBe(
      'Not sure what to ask? Try: "What are you currently using today?" · ' +
        '"What\'s your biggest challenge?" · "How soon do you need this?"'
    );

    // DOM order: heading → caption → question editor (first input).
    const follows = (a: Element, b: Element) =>
      !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(heading, caption)).toBe(true);
    const firstInput = screen.getAllByRole("textbox")[0];
    expect(follows(caption, firstInput)).toBe(true);
  });
});
