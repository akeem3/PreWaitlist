import { describe, it, expect } from "vitest";
import {
  PHONE_MODES,
  isPhoneMode,
  normalizePhoneInput,
  buildPhone,
} from "../../../src/lib/phone";

describe("PHONE_MODES", () => {
  it("contains exactly off, optional, required", () => {
    expect([...PHONE_MODES]).toEqual(["off", "optional", "required"]);
  });
});

describe("isPhoneMode", () => {
  it.each(["off", "optional", "required"])("accepts %s", (mode) => {
    expect(isPhoneMode(mode)).toBe(true);
  });

  it.each(["OFF", "true", "", "yes", "disabled"])("rejects %s", (value) => {
    expect(isPhoneMode(value)).toBe(false);
  });

  it.each([null, undefined, 1, 0, {}])("rejects non-string %s", (value) => {
    expect(isPhoneMode(value)).toBe(false);
  });
});

describe("normalizePhoneInput", () => {
  it("strips spaces, dashes, and parentheses", () => {
    expect(normalizePhoneInput("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("returns compact input unchanged when already E.164", () => {
    expect(normalizePhoneInput("+15551234567")).toBe("+15551234567");
  });

  it("accepts minimum length (7 digits after +)", () => {
    expect(normalizePhoneInput("+1234567")).toBe("+1234567");
  });

  it("accepts maximum length (15 digits after +)", () => {
    expect(normalizePhoneInput("+123456789012345")).toBe("+123456789012345");
  });

  it("rejects 16 digits after +", () => {
    expect(normalizePhoneInput("+1234567890123456")).toBeNull();
  });

  it("rejects fewer than 7 digits after +", () => {
    expect(normalizePhoneInput("+123456")).toBeNull();
  });

  it("rejects leading zero", () => {
    expect(normalizePhoneInput("+01234567")).toBeNull();
  });

  it("rejects missing +", () => {
    expect(normalizePhoneInput("15551234567")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(normalizePhoneInput("")).toBeNull();
  });

  it("rejects lone +", () => {
    expect(normalizePhoneInput("+")).toBeNull();
  });

  it("rejects pure letter garbage", () => {
    expect(normalizePhoneInput("not a phone")).toBeNull();
  });

  it("rejects input with + in the middle", () => {
    expect(normalizePhoneInput("+1+5551234")).toBeNull();
  });

  it("rejects two separate numbers", () => {
    expect(normalizePhoneInput("+15551234567+44")).toBeNull();
  });
});

describe("buildPhone", () => {
  it("combines dial and national number", () => {
    expect(buildPhone("+1", "5551234567")).toBe("+15551234567");
  });

  it("prepends + when dial is missing it", () => {
    expect(buildPhone("44", "2012345678")).toBe("+442012345678");
  });

  it("falls back to +1 when dial is empty", () => {
    expect(buildPhone("", "5551234567")).toBe("+15551234567");
  });

  it("falls back to +1 when dial is only +", () => {
    expect(buildPhone("+", "5551234567")).toBe("+15551234567");
  });

  it("ignores dial when national already starts with +", () => {
    expect(buildPhone("+1", "+442012345678")).toBe("+442012345678");
  });

  it("converts 00 international prefix", () => {
    expect(buildPhone("+1", "00442012345678")).toBe("+442012345678");
  });

  it("strips formatting from national number", () => {
    expect(buildPhone("+44", "20 1234 5678")).toBe("+442012345678");
  });

  it("returns null when national number is too short", () => {
    expect(buildPhone("+1", "123")).toBeNull();
  });

  it("returns null when national number is empty", () => {
    expect(buildPhone("+1", "")).toBeNull();
  });

  it("returns null for garbage national number", () => {
    expect(buildPhone("+1", "abc")).toBeNull();
  });
});
