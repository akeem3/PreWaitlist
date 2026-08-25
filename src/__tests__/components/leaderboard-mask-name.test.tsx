import { describe, expect, it } from "vitest";
import { anonymizeEmail } from "../../lib/format";

describe("anonymizeEmail", () => {
  it("masks a standard email", () => {
    expect(anonymizeEmail("john@example.com")).toBe("j••••n@example.com");
  });

  it("masks a short local part (<=2 chars drops last char)", () => {
    expect(anonymizeEmail("ab@example.com")).toBe("a••••@example.com");
  });

  it("masks a two-char local part", () => {
    expect(anonymizeEmail("jo@example.com")).toBe("j••••@example.com");
  });

  it("masks a long email", () => {
    expect(anonymizeEmail("longname@example.com")).toBe("l••••e@example.com");
  });

  it("returns raw email if no domain", () => {
    expect(anonymizeEmail("noemail")).toBe("noemail");
  });
});
