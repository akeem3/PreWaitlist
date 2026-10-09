import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const TALLY_URL = "https://tally.so/r/abc123";
const IG_URL = "https://ig.me/m/ak66m_";
const EMAIL = "hazaak004@gmail.com";
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

async function openContactModal(): Promise<void> {
  await renderButton();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Talk to the founder" }));
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

  it("renders nothing when all env vars are unset", async () => {
    await renderButton();
    expect(screen.queryByTestId("feedback-surfaces")).toBeNull();
    expect(screen.queryByTestId("feedback-fab")).toBeNull();
    expect(screen.queryByTestId("founder-contact-pill")).toBeNull();
    expect(screen.queryByTestId("contact-modal")).toBeNull();
  });

  it("renders FAB only when Tally URL set (no founder pill)", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    await renderButton();
    expect(screen.getByTestId("feedback-fab")).toBeTruthy();
    expect(screen.queryByTestId("founder-contact-pill")).toBeNull();
  });

  it("renders founder pill when a channel var is set (no FAB)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_EMAIL", EMAIL);
    await renderButton();
    expect(screen.getByTestId("founder-contact-pill")).toBeTruthy();
    expect(screen.queryByTestId("feedback-fab")).toBeNull();
    // Modal mounts only on open.
    expect(screen.queryByTestId("contact-modal")).toBeNull();
  });

  it("renders both surfaces when Tally + channel vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_TALLY_FORM_URL", TALLY_URL);
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_INSTAGRAM_URL", IG_URL);
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_EMAIL", EMAIL);
    await renderButton();
    expect(screen.getByTestId("feedback-fab")).toBeTruthy();
    expect(screen.getByTestId("founder-contact-pill")).toBeTruthy();
  });

  it("pill uses verbatim §8 copy and opens the modal on click", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_EMAIL", EMAIL);
    await renderButton();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Talk to the founder" })
    );
    expect(screen.getByTestId("contact-modal")).toBeTruthy();
    // The dialog carries the same approved name.
    expect(
      screen.getByRole("dialog", { name: "Talk to the founder" })
    ).toBeTruthy();
  });

  it("modal shows Instagram row (new tab) + Email row (mailto, same tab)", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_INSTAGRAM_URL", IG_URL);
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_EMAIL", EMAIL);
    await openContactModal();
    const ig = screen.getByTestId("contact-row-instagram");
    expect(ig.getAttribute("href")).toBe(IG_URL);
    expect(ig.getAttribute("target")).toBe("_blank");
    expect(ig.getAttribute("rel")).toBe("noopener noreferrer");
    expect(ig.textContent).toContain("Instagram");
    const mail = screen.getByTestId("contact-row-email");
    expect(mail.getAttribute("href")).toBe(`mailto:${EMAIL}`);
    expect(mail.getAttribute("target")).toBeNull();
    expect(mail.textContent).toContain("Email");
  });

  it("hides the Instagram row when its var is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_EMAIL", EMAIL);
    await openContactModal();
    expect(screen.queryByTestId("contact-row-instagram")).toBeNull();
    expect(screen.getByTestId("contact-row-email")).toBeTruthy();
  });

  it("hides the Email row when its var is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_INSTAGRAM_URL", IG_URL);
    await openContactModal();
    expect(screen.queryByTestId("contact-row-email")).toBeNull();
    expect(screen.getByTestId("contact-row-instagram")).toBeTruthy();
  });

  it("closes the modal via X button, Escape, and backdrop click", async () => {
    vi.stubEnv("NEXT_PUBLIC_FOUNDER_EMAIL", EMAIL);
    await renderButton();
    const user = userEvent.setup();
    const pill = screen.getByRole("button", { name: "Talk to the founder" });

    // X button.
    await user.click(pill);
    expect(screen.queryByTestId("contact-modal")).toBeTruthy();
    await user.click(screen.getByTestId("contact-modal-close"));
    expect(screen.queryByTestId("contact-modal")).toBeNull();

    // Escape.
    await user.click(pill);
    expect(screen.queryByTestId("contact-modal")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("contact-modal")).toBeNull();

    // Backdrop (overlay wrapping the dialog).
    await user.click(pill);
    const dialog = screen.getByRole("dialog", {
      name: "Talk to the founder",
    });
    await user.click(dialog.parentElement as HTMLElement);
    expect(screen.queryByTestId("contact-modal")).toBeNull();
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
