import { describe, it, expect } from "vitest";
import { resolveFromAddress } from "@/lib/from-address";

describe("resolveFromAddress — default domains (no sending_domain)", () => {
  it("transactional stream resolves to notifications@prewaitlist.com", () => {
    expect(resolveFromAddress(null, null, null, "transactional")).toBe(
      "PreWaitlist <notifications@prewaitlist.com>"
    );
  });

  it("broadcast stream resolves to updates@mail.prewaitlist.com (segregated subdomain)", () => {
    expect(resolveFromAddress(null, null, null, "broadcast")).toBe(
      "PreWaitlist <updates@mail.prewaitlist.com>"
    );
  });

  it("broadcast bulk mail never shares the root domain with transactional mail", () => {
    const transactional = resolveFromAddress(null, null, null, "transactional");
    const broadcast = resolveFromAddress(null, null, null, "broadcast");
    expect(transactional).toContain("<notifications@prewaitlist.com>");
    expect(broadcast).toContain("<updates@mail.prewaitlist.com>");
    expect(broadcast).not.toContain("<updates@prewaitlist.com>");
  });
});

describe("resolveFromAddress — sender name resolution chain", () => {
  it("prefers senderName over productName and headline", () => {
    expect(
      resolveFromAddress("Acme Team", "Acme", "Acme headline", "broadcast")
    ).toBe("Acme Team <updates@mail.prewaitlist.com>");
  });

  it("falls back to productName when senderName is empty or whitespace", () => {
    expect(
      resolveFromAddress("   ", "Acme", "Acme headline", "transactional")
    ).toBe("Acme <notifications@prewaitlist.com>");
  });

  it("falls back to headline when senderName and productName are absent", () => {
    expect(
      resolveFromAddress(null, undefined, "Acme headline", "transactional")
    ).toBe("Acme headline <notifications@prewaitlist.com>");
  });

  it("falls back to 'PreWaitlist' when every name input is empty", () => {
    expect(resolveFromAddress("  ", "", "  ", "broadcast")).toBe(
      "PreWaitlist <updates@mail.prewaitlist.com>"
    );
  });
});

describe("resolveFromAddress — custom sending_domain override (Pro)", () => {
  it("uses notifications@{sendingDomain} for the transactional stream", () => {
    expect(
      resolveFromAddress("Acme", null, null, "transactional", "mail.acme.com")
    ).toBe("Acme <notifications@mail.acme.com>");
  });

  it("uses updates@{sendingDomain} for the broadcast stream", () => {
    expect(
      resolveFromAddress("Acme", null, null, "broadcast", "acme.com")
    ).toBe("Acme <updates@acme.com>");
  });

  it("empty-string sendingDomain falls through to the default domains", () => {
    expect(resolveFromAddress("Acme", null, null, "broadcast", "")).toBe(
      "Acme <updates@mail.prewaitlist.com>"
    );
  });
});
