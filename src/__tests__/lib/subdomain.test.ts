import { describe, expect, it } from "vitest";
import { isReservedSubdomain, isValidSubdomain } from "@/lib/subdomain";

describe("subdomain validation", () => {
  it.each(["a", "acme", "a-b", `a${"b".repeat(61)}z`])(
    "accepts valid subdomain %s",
    (value) => {
      expect(isValidSubdomain(value)).toBe(true);
    }
  );

  it.each([
    "",
    "ABC",
    "abc def",
    "abc!",
    "-abc",
    "abc-",
    `a${"b".repeat(62)}z`,
    null,
    42,
  ])("rejects malformed subdomain %s", (value) => {
    expect(isValidSubdomain(value)).toBe(false);
  });

  it("matches reserved subdomains case-insensitively", () => {
    expect(isReservedSubdomain("admin")).toBe(true);
    expect(isReservedSubdomain("ADMIN")).toBe(true);
    expect(isReservedSubdomain("acme")).toBe(false);
  });
});
