import { describe, expect, it } from "vitest";
import { validateWaitlistFields } from "@/lib/waitlist-validation";

describe("validateWaitlistFields", () => {
  it.each(["minimal", "bold", "dark"])(
    "accepts the %s template",
    (template) => {
      expect(validateWaitlistFields({ template })).toBeNull();
    }
  );

  it("rejects unknown templates", () => {
    expect(validateWaitlistFields({ template: "neon" })).toBe(
      "Template must be minimal, bold, or dark."
    );
  });

  it("accepts CTA text at its limit and rejects longer text", () => {
    expect(validateWaitlistFields({ cta_text: "x".repeat(100) })).toBeNull();
    expect(validateWaitlistFields({ cta_text: "x".repeat(101) })).toBe(
      "Button text must be 100 characters or fewer."
    );
  });

  it("accepts the documented headline boundaries", () => {
    expect(
      validateWaitlistFields({
        headline: "h".repeat(200),
        subheadline: "s".repeat(500),
      })
    ).toBeNull();
    expect(validateWaitlistFields({ headline: "h".repeat(201) })).toContain(
      "200 characters"
    );
    expect(validateWaitlistFields({ subheadline: "s".repeat(501) })).toContain(
      "500 characters"
    );
  });

  it("accepts valid hex brand colors and rejects malformed values", () => {
    expect(validateWaitlistFields({ brand_color: "#0F7A5E" })).toBeNull();
    expect(validateWaitlistFields({ brand_color: "red" })).toContain(
      "valid hex color"
    );
  });

  it("accepts supported logo data URLs and rejects unsupported formats", () => {
    expect(
      validateWaitlistFields({ logo_url: "data:image/png;base64,YQ==" })
    ).toBeNull();
    expect(
      validateWaitlistFields({ logo_url: "https://example.com/logo.png" })
    ).toBe("Only PNG and SVG files are allowed");
  });

  it("requires boolean flags and an integer threshold within bounds", () => {
    expect(
      validateWaitlistFields({
        qualification_enabled: true,
        signup_counter_enabled: false,
        signup_counter_threshold: 1_000_000,
      })
    ).toBeNull();
    expect(
      validateWaitlistFields({ qualification_enabled: "false" })
    ).toContain("true or false");
    expect(
      validateWaitlistFields({ signup_counter_threshold: 1_000_001 })
    ).toContain("1,000,000");
  });
});
