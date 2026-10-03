import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  WaitlistBrand,
  WaitlistTemplateContent,
} from "../../../components/share/waitlist-template-content";

afterEach(() => {
  cleanup();
});

const defaultProps = {
  template: "minimal" as const,
  headline: "Join our waitlist",
  subheadline: "Be the first to know when we launch",
  brandColor: "#0F7A5E",
  logoUrl: null,
  milestoneRewards: [],
  emailCaptureForm: <div data-testid="form" />,
};

describe("WaitlistTemplateContent", () => {
  it("renders headline and subheadline", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    expect(screen.getByText("Join our waitlist")).toBeDefined();
    expect(
      screen.getByText("Be the first to know when we launch")
    ).toBeDefined();
  });

  it("renders no brand lockup (brand lives in the page shell)", () => {
    render(
      <WaitlistTemplateContent {...defaultProps} logoUrl="/test-logo.png" />
    );
    expect(screen.queryByRole("img", { name: /logo/i })).toBeNull();
  });

  it("does not render logo when logo_url is null", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    expect(screen.queryByRole("img", { name: /logo/i })).toBeNull();
  });

  it("renders form slot", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    expect(screen.getByTestId("form")).toBeDefined();
  });

  it("conditionally renders milestone rewards when enabled", () => {
    render(
      <WaitlistTemplateContent
        {...defaultProps}
        milestoneRewards={[
          { threshold: 3, label: "Early access" },
          { threshold: 10, label: "Free swag" },
        ]}
      />
    );
    expect(screen.getByText("Early access")).toBeDefined();
    expect(screen.getByText("Free swag")).toBeDefined();
  });

  it("does not render milestone rewards when empty", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    expect(screen.queryByText("Refer friends")).toBeNull();
  });

  it("renders signup counter when visible", () => {
    render(
      <WaitlistTemplateContent
        {...defaultProps}
        signupCounter={42}
        signupCounterVisible={true}
      />
    );
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("people on the waitlist")).toBeDefined();
  });

  it("does not render signup counter when not visible", () => {
    render(
      <WaitlistTemplateContent
        {...defaultProps}
        signupCounter={42}
        signupCounterVisible={false}
      />
    );
    expect(screen.queryByText("people in line")).toBeNull();
  });

  it("uses text-4xl heading for bold template", () => {
    render(<WaitlistTemplateContent {...defaultProps} template="bold" />);
    const heading = screen.getByText("Join our waitlist");
    expect(heading.className).toContain("text-4xl");
  });

  it("uses text-4xl heading for minimal template", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    const heading = screen.getByText("Join our waitlist");
    expect(heading.className).toContain("text-4xl");
  });

  it("renders latestUpdate slot when provided", () => {
    render(
      <WaitlistTemplateContent
        {...defaultProps}
        latestUpdateSlot={<div data-testid="latest-update">Update content</div>}
      />
    );
    expect(screen.getByTestId("latest-update")).toBeDefined();
    expect(screen.getByText("Update content")).toBeDefined();
  });

  it("does not render latestUpdate slot when undefined", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    expect(screen.queryByTestId("latest-update")).toBeNull();
  });

  // --- Epic 18 (18.5 AC1a): section order, variant scales, centering, divider ---

  const fullProps = {
    ...defaultProps,
    logoUrl: "/test-logo.png",
    productName: "Acme",
    signupCounter: 42,
    signupCounterVisible: true,
    milestoneRewards: [{ threshold: 3, label: "Early access" }],
    latestUpdateSlot: <div data-testid="latest-update">Update content</div>,
  };

  function isBefore(a: Element, b: Element) {
    return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function byTextContent(text: string) {
    return (_: string, el: Element | null) => el?.textContent === text;
  }

  it.each(["default", "live"] as const)(
    "section order — %s: headline → subheadline → counter → form → milestones → how-it-works → updates",
    (mode) => {
      render(
        <WaitlistTemplateContent
          {...fullProps}
          variant={mode === "live" ? "live" : "preview"}
        />
      );
      const headline = screen.getByText("Join our waitlist");
      const subheadline = screen.getByText(
        "Be the first to know when we launch"
      );
      const counter = screen.getByText("people on the waitlist");
      const form = screen.getByTestId("form");
      const milestone = screen.getByText("Early access");
      const howItWorks = screen.getByText("How it works");
      const updates = screen.getByTestId("latest-update");

      const ordered = [
        headline,
        subheadline,
        counter,
        form,
        milestone,
        howItWorks,
        updates,
      ];
      for (let i = 0; i < ordered.length - 1; i++) {
        expect(isBefore(ordered[i], ordered[i + 1])).toBe(true);
      }
    }
  );

  it("updates render below how-it-works", () => {
    render(<WaitlistTemplateContent {...fullProps} />);
    const howItWorks = screen.getByText("How it works");
    const updates = screen.getByTestId("latest-update");
    expect(isBefore(howItWorks, updates)).toBe(true);
    expect(isBefore(updates, howItWorks)).toBe(false);
  });

  it("live scale — h1 text-5xl sm:text-6xl extrabold tracking-tight, root space-y-8 + pt-6, subheadline text-lg font-medium", () => {
    const { container } = render(
      <WaitlistTemplateContent {...defaultProps} variant="live" />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("space-y-8");
    expect(root.className).toContain("pt-6");
    const h1 = screen.getByText("Join our waitlist");
    expect(h1.className).toContain("text-5xl");
    expect(h1.className).toContain("sm:text-6xl");
    expect(h1.className).toContain("font-extrabold");
    expect(h1.className).toContain("tracking-tight");
    const sub = screen.getByText("Be the first to know when we launch");
    expect(sub.className).toContain("text-lg");
    expect(sub.className).toContain("font-medium");
  });

  it("preview scale (default) — h1 text-4xl extrabold without sm:text-6xl, subheadline text-base font-medium, root space-y-5", () => {
    const { container } = render(<WaitlistTemplateContent {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("space-y-5");
    expect(root.className).not.toContain("space-y-6");
    const h1 = screen.getByText("Join our waitlist");
    expect(h1.className).toContain("text-4xl");
    expect(h1.className).not.toContain("sm:text-6xl");
    expect(h1.className).toContain("font-extrabold");
    const sub = screen.getByText("Be the first to know when we launch");
    expect(sub.className).toContain("text-base");
    expect(sub.className).toContain("font-medium");
  });

  it.each([
    { mode: "live" as const, nameClass: "text-2xl" },
    { mode: "preview" as const, nameClass: "text-sm" },
  ])(
    "WaitlistBrand — $mode: left-aligned lockup, wordmark bold in $nameClass",
    ({ mode, nameClass }) => {
      render(
        <WaitlistBrand
          logoUrl="/test-logo.png"
          productName="Acme"
          isDark={false}
          isLive={mode === "live"}
        />
      );
      const header = screen.getByRole("img", { name: /logo/i })
        .parentElement as HTMLElement;
      expect(header.className).not.toContain("justify-center");
      expect(header.className).toContain("items-center");
      const wordmark = screen.getByText("Acme");
      expect(wordmark.className).toContain("font-bold");
      expect(wordmark.className).toContain(nameClass);
      expect(wordmark.className).toContain("text-foreground");
    }
  );

  it("WaitlistBrand — null when no logo and no product name", () => {
    const { container } = render(
      <WaitlistBrand
        logoUrl={null}
        productName={undefined}
        isDark={false}
        isLive
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("how-it-works block (minimal) — border-t + border-border, no mt-auto, label + step sizes", () => {
    const { container } = render(<WaitlistTemplateContent {...defaultProps} />);
    const label = screen.getByText("How it works");
    const hiw = label.parentElement as HTMLElement;
    expect(hiw.className).toContain("border-t");
    expect(hiw.className).toContain("border-border");
    expect(container.innerHTML).not.toContain("mt-auto");
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("font-semibold");
    const step = screen.getByText(/Enter your email/);
    expect(step.className).toContain("text-sm");
    expect(step.className).toContain("rounded-[var(--radius-md)]");
  });

  it("how-it-works block (dark) — border-t + border-dark-template-border, dark step cards", () => {
    render(<WaitlistTemplateContent {...defaultProps} template="dark" />);
    const label = screen.getByText("How it works");
    const hiw = label.parentElement as HTMLElement;
    expect(hiw.className).toContain("border-t");
    expect(hiw.className).toContain("border-dark-template-border");
    const step = screen.getByText(/Enter your email/);
    expect(step.className).toContain("bg-dark-template-input");
  });

  it("how-it-works block (bold) — border-2 step cards", () => {
    render(<WaitlistTemplateContent {...defaultProps} template="bold" />);
    const step = screen.getByText(/Enter your email/);
    expect(step.className).toContain("border-2");
    expect(step.className).toContain("border-foreground");
  });

  it("strings frozen — how-it-works steps render verbatim", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    expect(screen.getByText("How it works")).toBeDefined();
    expect(
      screen.getByText(byTextContent("1. Enter your email"))
    ).toBeDefined();
    expect(
      screen.getByText(byTextContent("2. Get your position"))
    ).toBeDefined();
    expect(
      screen.getByText(byTextContent("3. Refer friends to move up"))
    ).toBeDefined();
  });

  // --- Phase 3: compact density step (preview only) ---

  it("compact density (preview) — space-y-3 + pt-3", () => {
    const { container } = render(
      <WaitlistTemplateContent {...defaultProps} compact />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("space-y-3");
    expect(root.className).toContain("pt-3");
  });

  it("compact density (default preview) — space-y-5", () => {
    const { container } = render(<WaitlistTemplateContent {...defaultProps} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("space-y-5");
    expect(root.className).not.toContain("space-y-3");
  });

  it("compact ignored for live variant — keeps space-y-8", () => {
    const { container } = render(
      <WaitlistTemplateContent {...defaultProps} variant="live" compact />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("space-y-8");
    expect(root.className).not.toContain("space-y-3");
  });

  // --- Phase 4: spec conformance (guide §5 headline, §7.1 how-it-works) ---

  it("headline line-length + wrapping per guide §5 — max-w-xl + text-balance", () => {
    render(<WaitlistTemplateContent {...defaultProps} variant="live" />);
    const h1 = screen.getByText("Join our waitlist");
    expect(h1.className).toContain("max-w-xl");
    expect(h1.className).toContain("text-balance");
  });

  it("how-it-works padding per guide §7.1 — pt-8 on live", () => {
    render(<WaitlistTemplateContent {...defaultProps} variant="live" />);
    const hiw = screen.getByText("How it works").parentElement as HTMLElement;
    expect(hiw.className).toContain("pt-8");
  });

  it("how-it-works padding per guide §7.1 — pt-6 (not pt-8) on preview", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    const hiw = screen.getByText("How it works").parentElement as HTMLElement;
    expect(hiw.className).toContain("pt-6");
    expect(hiw.className).not.toContain("pt-8");
  });
});
