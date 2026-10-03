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

  // --- Phone group parity (phone collection — Phase 4) ---

  it("PreviewEmailForm — phone group hidden when phoneMode is off (default)", () => {
    render(<LivePreview {...previewProps} />);
    expect(screen.queryByPlaceholderText("Phone number")).toBeNull();
    expect(screen.queryByLabelText("Country code")).toBeNull();
  });

  it("PreviewEmailForm — phone group shown when phoneMode is on, same strings as the live form", () => {
    render(<LivePreview {...previewProps} phoneMode="required" />);

    const tel = screen.getByPlaceholderText("Phone number") as HTMLInputElement;
    expect(tel).toBeDefined();
    expect(tel.readOnly).toBe(true);
    expect(tel.type).toBe("tel");

    const country = screen.getByLabelText("Country code") as HTMLInputElement;
    expect(country.readOnly).toBe(true);
    expect(country.value).toBe("+1");

    // preview stays inert — no datalist binding (live form has the list attr)
    expect(country.getAttribute("list")).toBeNull();
    expect(tel.getAttribute("list")).toBeNull();
  });

  it("PreviewQuestionForm — phone group follows phoneMode too", () => {
    render(
      <LivePreview
        {...previewProps}
        phoneMode="optional"
        showQuestions
        questions={[
          { id: "q-1", text: "Role", type: "free_text", options: null },
        ]}
      />
    );
    expect(screen.getByPlaceholderText("Phone number")).toBeDefined();
    expect(screen.getByLabelText("Country code")).toBeDefined();
  });

  it("phone placeholder + country aria are shared string literals with the live form", () => {
    const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
    for (const file of [
      "components/onboarding/live-preview.tsx",
      "components/public/email-capture-form.tsx",
    ]) {
      const source = read(file);
      expect(source).toContain('placeholder="Phone number"');
      expect(source).toContain('aria-label="Country code"');
    }
  });

  // --- MC dropdown parity (Tally-style — founder directive 2026-10-03) ---

  it("PreviewQuestionForm — MC renders as a collapsed dropdown, options stay inside", () => {
    render(
      <LivePreview
        {...previewProps}
        showQuestions
        questions={[
          {
            id: "q-1",
            text: "Which plan",
            type: "multiple_choice",
            options: ["Free", "Pro"],
          },
        ]}
      />
    );
    // label above (question auto-?d) + placeholder box, no radio rows
    expect(screen.getByText("Which plan?")).toBeDefined();
    expect(screen.getByText("Select an option")).toBeDefined();
    expect(screen.queryByRole("radio")).toBeNull();
    // collapsed — option strings are not painted as sibling rows
    expect(screen.queryByText("Free")).toBeNull();
    expect(screen.queryByText("Pro")).toBeNull();
  });

  it("MC dropdown placeholder is a shared string literal with the live form", () => {
    const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
    for (const file of [
      "components/onboarding/live-preview.tsx",
      "components/public/email-capture-form.tsx",
    ]) {
      expect(read(file)).toContain("Select an option");
    }
  });

  it("(optional) is warning-colored and right-aligned on both question types", () => {
    render(
      <LivePreview
        {...previewProps}
        showQuestions
        questions={[
          {
            id: "q-1",
            text: "Which plan",
            type: "multiple_choice",
            options: ["Free", "Pro"],
          },
          { id: "q-2", text: "Role", type: "free_text", options: null },
        ]}
      />
    );
    const optionals = screen.getAllByText("(optional)");
    expect(optionals).toHaveLength(2);
    for (const el of optionals) {
      expect(el.className).toContain("text-warning");
      expect(el.className).toContain("shrink-0");
      // pinned to the right end of its row
      expect((el.parentElement as HTMLElement).className).toContain(
        "justify-between"
      );
    }
    // source lock — both renderers color (optional) from the warning token
    const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
    for (const file of [
      "components/onboarding/live-preview.tsx",
      "components/public/email-capture-form.tsx",
    ]) {
      const source = read(file);
      expect(source).toContain("text-warning");
      expect(source).toContain("(optional)");
    }
  });
});
