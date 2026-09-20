import { describe, it, expect } from "vitest";
import { isPro, requirePro } from "../../../src/lib/tier-gating";

describe("isPro", () => {
  it("returns true for pro", () => {
    expect(isPro("pro")).toBe(true);
  });

  it("returns false for free", () => {
    expect(isPro("free")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPro("")).toBe(false);
  });

  it("returns false for growth", () => {
    expect(isPro("growth")).toBe(false);
  });
});

describe("requirePro", () => {
  it("allows pro tier", () => {
    const result = requirePro("pro", "Broadcast");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("blocks free tier", () => {
    const result = requirePro("free", "Broadcast");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Broadcast");
  });

  it("blocks growth tier", () => {
    const result = requirePro("growth", "Warmth");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Warmth");
  });

  it("blocks empty tier", () => {
    const result = requirePro("", "Feature");
    expect(result.allowed).toBe(false);
  });
});
