import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WaitlistTemplateContent } from "../../../components/share/waitlist-template-content";

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

  it("renders logo when logo_url provided", () => {
    render(
      <WaitlistTemplateContent {...defaultProps} logoUrl="/test-logo.png" />
    );
    const img = screen.getByRole("img", { name: /logo/i });
    expect(img).toBeDefined();
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
    expect(screen.getByText("people in line")).toBeDefined();
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

  it("uses bold heading for bold template", () => {
    render(<WaitlistTemplateContent {...defaultProps} template="bold" />);
    const heading = screen.getByText("Join our waitlist");
    expect(heading.className).toContain("text-h2");
  });

  it("uses h3 heading for minimal template", () => {
    render(<WaitlistTemplateContent {...defaultProps} />);
    const heading = screen.getByText("Join our waitlist");
    expect(heading.className).toContain("text-h3");
  });
});
