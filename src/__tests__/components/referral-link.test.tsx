import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReferralLink } from "../../../components/share/referral-link";

afterEach(() => {
  cleanup();
});

describe("ReferralLink", () => {
  it("renders full referral URL", () => {
    render(<ReferralLink url="https://test.prewaitlist.com?ref=abc12345" />);
    const input = screen.getByRole("textbox", { name: /referral link/i });
    expect(input).toHaveValue("https://test.prewaitlist.com?ref=abc12345");
  });

  it("input is read-only", () => {
    render(<ReferralLink url="https://test.prewaitlist.com?ref=abc12345" />);
    const input = screen.getByRole("textbox", { name: /referral link/i });
    expect(input).toHaveAttribute("readonly");
  });
});
