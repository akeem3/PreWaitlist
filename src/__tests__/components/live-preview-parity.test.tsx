import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LivePreview } from "../../../components/onboarding/live-preview";

afterEach(() => {
  cleanup();
});

const previewProps = {
  template: "minimal" as const,
  headline: "Join our waitlist",
  subheadline: "Be the first to know when we launch",
  brandColor: "#0F7A5E",
  logoUrl: null as string | null,
  ctaText: "Join Waitlist",
  milestoneRewards: [] as { threshold: number; label: string }[],
};

const CONSENT_SENTENCE =
  "By joining, you agree to receive emails and accept our Terms and Privacy Policy.";
const TRUST_LINE = "No spam. Unsubscribe anytime.";

function isBefore(a: Element, b: Element) {
  return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

// PoweredByFooter (free tier) also links Terms/Privacy — pick the consent
// links by their in-app hrefs so both sources can coexist.
function consentLink(name: "Terms" | "Privacy Policy") {
  const href = name === "Terms" ? "/legal/terms" : "/legal/privacy";
  return screen
    .getAllByRole("link", { name })
    .find((a) => a.getAttribute("href") === href);
}

describe("LivePreview parity (18.5 AC1c)", () => {
  it("renders the sample updates card after How it works", () => {
    render(<LivePreview {...previewProps} />);
    const howItWorks = screen.getByText("How it works");
    const updateCard = screen.getByText("We just launched our beta!");
    expect(isBefore(howItWorks, updateCard)).toBe(true);
    expect(isBefore(updateCard, howItWorks)).toBe(false);
  });

  it("PreviewEmailForm — shared consent sentence + both legal links, trust line, no checkbox", () => {
    render(<LivePreview {...previewProps} />);

    const terms = consentLink("Terms");
    const privacy = consentLink("Privacy Policy");
    expect(terms).toBeDefined();
    expect(privacy).toBeDefined();
    expect(terms!.parentElement?.textContent).toBe(CONSENT_SENTENCE);

    expect(screen.getAllByText(TRUST_LINE)).toHaveLength(1);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("PreviewQuestionForm — shared consent sentence + trust line, no checkbox", () => {
    render(
      <LivePreview
        {...previewProps}
        showQuestions
        questions={[
          {
            id: "q-1",
            text: "What are you currently using?",
            type: "free_text",
            options: null,
          },
        ]}
      />
    );

    expect(
      screen.getByText("What are you currently using?")
    ).toBeInTheDocument();

    const terms = consentLink("Terms");
    expect(terms).toBeDefined();
    expect(consentLink("Privacy Policy")).toBeDefined();
    expect(terms!.parentElement?.textContent).toBe(CONSENT_SENTENCE);

    expect(screen.getAllByText(TRUST_LINE)).toHaveLength(1);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("swaps (amended 2026-09-30): button → consent → trust", () => {
    render(<LivePreview {...previewProps} />);
    const button = screen.getByRole("button", { name: /Join Waitlist/i });
    const trust = screen.getByText(TRUST_LINE);
    const consent = screen.getByText(/By joining, you agree to receive emails/);
    expect(isBefore(button, consent)).toBe(true);
    expect(isBefore(consent, trust)).toBe(true);
    // immediate neighbours — matches the live form's flex order
    expect(button.nextElementSibling).toBe(consent.closest("p"));
    expect(consent.closest("p")?.nextElementSibling).toBe(trust.closest("p"));
  });

  it("shared-string lock — literals live only in consent-line.tsx", () => {
    const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

    const consentLine = read("components/public/consent-line.tsx");
    expect(consentLine).toContain(TRUST_LINE);
    expect(consentLine).toContain(
      "By joining, you agree to receive emails and accept our"
    );

    for (const file of [
      "components/onboarding/live-preview.tsx",
      "components/public/email-capture-form.tsx",
    ]) {
      const source = read(file);
      expect(source).not.toContain(TRUST_LINE);
      expect(source).not.toContain("By joining, you agree to receive emails");
      // both shared components are consumed, not re-implemented
      expect(source).toContain("<ConsentLine");
      expect(source).toContain("<TrustLine");
    }
  });

  // --- Phase 4: template pass (guide §3/§4/§7.6/§9) ---

  function frameEl(container: HTMLElement) {
    return container.querySelector('[class*="max-h-"]') as HTMLElement;
  }

  it("frame paints the light page background per guide §9 — bg-background, not bg-card", () => {
    const { container } = render(<LivePreview {...previewProps} />);
    const frame = frameEl(container);
    expect(frame.className).toContain("bg-background");
    expect(frame.className).not.toContain("bg-card");
  });

  it("frame paints the dark page background per guide §9", () => {
    const { container } = render(
      <LivePreview {...previewProps} template="dark" />
    );
    expect(frameEl(container).className).toContain("bg-dark-template-bg");
  });

  it("preview footer is standalone (guide §7.6) — no white band on the page bg", () => {
    render(<LivePreview {...previewProps} />);
    const footer = screen.getByText("Powered by").closest("div") as HTMLElement;
    expect(footer.className).toContain("border-t");
    expect(footer.className).not.toContain("bg-card");
    expect(footer.className).not.toContain("bg-dark-template-bg");
  });

  it("preview CTA label is semibold per guide §4 — not font-medium", () => {
    render(<LivePreview {...previewProps} />);
    const button = screen.getByRole("button", { name: /Join Waitlist/i });
    expect(button.className).toContain("font-semibold");
    expect(button.className).not.toContain("font-medium");
  });

  it("preview brand lockup sits in a pt-6 row per guide §3", () => {
    render(<LivePreview {...previewProps} productName="Acme" />);
    const wordmark = screen.getByText("Acme");
    const row = wordmark.parentElement as HTMLElement;
    expect(row.className).toContain("items-center");
    expect(row.parentElement?.className).toContain("pt-6");
  });

  it("no header section without logo or name (guide §3) — no pt-6 band", () => {
    const { container } = render(<LivePreview {...previewProps} />);
    expect(screen.queryByText("Acme")).toBeNull();
    // exact match — the brand wrapper is a bare pt-6 div (the how-it-works
    // divider also carries pt-6 on preview, per guide §7.1)
    expect(container.querySelector('div[class="pt-6"]')).toBeNull();
  });

  it("preview in-field question scales with the template (guide §4) — text-base on bold", () => {
    render(
      <LivePreview
        {...previewProps}
        template="bold"
        showQuestions
        questions={[
          { id: "q-1", text: "Role", type: "free_text", options: null },
        ]}
      />
    );
    const question = screen.getByText("Role?");
    expect(question.className).toContain("text-base");
  });
});
