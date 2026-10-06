import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const TALLY_URL = "https://tally.so/r/abc123";
const CONTACT_URL = "https://twitter.com/founder";
const SCRIPT_SELECTOR = 'script[src="https://tally.so/widgets/embed.js"]';

type TallyMock = { openPopup: ReturnType<typeof vi.fn> };

async function renderButton(): Promise<void> {
  const { FeedbackButton } =
    await import("../../../components/dashboard/feedback-button");
  render(<FeedbackButton />);
}

function removeTallyScripts() {
  document.querySelectorAll(SCRIPT_SELECTOR).forEach((s) => s.remove());
}

describe("FeedbackButton", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    delete (window as { Tally?: unknown }).Tally;
    removeTallyScripts();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (window as { Tally?: unknown }).Tally;
    removeTallyScripts();
  });

  it("renders nothing when both env vars are unset", async () => {
    await renderButton();
    expect(screen.queryByTestId("feedback-surfaces")).toBeNull();
    expect(screen.queryByTestId("feedback-fab")).toBeNull();
    expect(screen.queryByTestId("founder-contact-link")).toBeNull();
  });

  it("renders FAB only when Tally URL set (no founder link)", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    await renderButton();
    expect(screen.getByTestId("feedback-fab")).toBeTruthy();
    expect(screen.queryByTestId("founder-contact-link")).toBeNull();
  });

  it("renders founder link only when contact URL set (no FAB)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_CONTACT_URL", CONTACT_URL);
    await renderButton();
    expect(screen.getByTestId("founder-contact-link")).toBeTruthy();
    expect(screen.queryByTestId("feedback-fab")).toBeNull();
  });

  it("renders both surfaces when both env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_CONTACT_URL", CONTACT_URL);
    await renderButton();
    expect(screen.getByTestId("feedback-fab")).toBeTruthy();
    expect(screen.getByTestId("founder-contact-link")).toBeTruthy();
  });

  it("founder link uses verbatim §8 copy and opens in a new tab", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_CONTACT_URL", CONTACT_URL);
    await renderButton();
    const link = screen.getByRole("link", { name: "Talk to the founder" });
    expect(link.getAttribute("href")).toBe(CONTACT_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("FAB is icon-only with aria-label Feedback", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    await renderButton();
    const fab = screen.getByRole("button", { name: "Feedback" });
    expect(fab.textContent?.trim()).toBe("");
  });

  it("does not load embed.js before first click (AC6 lazy-load)", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    await renderButton();
    expect(document.querySelector(SCRIPT_SELECTOR)).toBeNull();
  });

  it("injects embed.js on first click only", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    // happy-dom disables JS file loading, so the injected script rejects the
    // loader promise and the component takes its window.open fallback — spy so
    // the fallback doesn't hit the real window.open during this assertion.
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await renderButton();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Feedback" }));

    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);
    expect(open).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Feedback" }));
    expect(document.querySelectorAll(SCRIPT_SELECTOR)).toHaveLength(1);
  });

  it("opens Tally popup with parsed formId and modal layout", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    // Script already available → loader short-circuits and openPopup runs
    // directly (mirrors a second visit after embed.js cached by the browser).
    const tally: TallyMock = { openPopup: vi.fn() };
    Object.assign(window, { Tally: tally });
    await renderButton();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Feedback" }));

    await waitFor(() => expect(tally.openPopup).toHaveBeenCalledTimes(1));
    expect(tally.openPopup).toHaveBeenCalledWith("abc123", {
      layout: "modal",
    });
  });

  it("falls back to window.open for a non-/r/ Tally URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", "https://tally.so/forms/xyz");
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await renderButton();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Feedback" }));

    expect(open).toHaveBeenCalledWith(
      "https://tally.so/forms/xyz",
      "_blank",
      "noopener,noreferrer"
    );
    expect(document.querySelector(SCRIPT_SELECTOR)).toBeNull();
  });

  it("falls back to window.open when the Tally script fails to load", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await renderButton();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Feedback" }));

    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(open).toHaveBeenCalledWith(
      TALLY_URL,
      "_blank",
      "noopener,noreferrer"
    );
  });
});
