import { describe, it, expect, beforeAll } from "vitest";
import {
  verifyUnsubscribeToken,
  generateUnsubscribeToken,
} from "@/lib/unsubscribe";

beforeAll(() => {
  process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";
});

describe("Unsubscribe Token Verification", () => {
  it("returns subscriber ID for valid token", () => {
    const subscriberId = "sub-123";
    const token = generateUnsubscribeToken(subscriberId);
    const result = verifyUnsubscribeToken(token);
    expect(result).toBe(subscriberId);
  });

  it("returns null for invalid token", () => {
    const result = verifyUnsubscribeToken("invalid-token");
    expect(result).toBeNull();
  });

  it("returns null for empty token", () => {
    const result = verifyUnsubscribeToken("");
    expect(result).toBeNull();
  });

  it("returns null for token with wrong HMAC", () => {
    const result = verifyUnsubscribeToken("sub-123.wronghmacvalue");
    expect(result).toBeNull();
  });

  it("returns null for token with no dot separator", () => {
    const result = verifyUnsubscribeToken("sub-123nothmac");
    expect(result).toBeNull();
  });

  it("generates a token that can be verified", () => {
    const subscriberId = "test-sub-456";
    const token = generateUnsubscribeToken(subscriberId);
    expect(token).toContain(".");
    expect(verifyUnsubscribeToken(token)).toBe(subscriberId);
  });
});
