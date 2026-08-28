import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReferralLink } from "../../../components/share/referral-link";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ReferralLink", () => {
  it("renders full referral URL", () => {
    render(<ReferralLink url="https://test.prewaitlist.com?ref=abc12345" />);
    const input = screen.getByRole("textbox", { name: /referral link/i });
    expect(input).toHaveValue("https://test.prewaitlist.com?ref=abc12345");
  });

  it("copies URL to clipboard on click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ReferralLink url="https://test.prewaitlist.com?ref=abc12345" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      "https://test.prewaitlist.com?ref=abc12345"
    );
  });

  it("shows Copied! feedback", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    render(<ReferralLink url="https://test.prewaitlist.com?ref=abc12345" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    });

    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();
  });

  it("reverts after 2 seconds", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    vi.useFakeTimers();
    render(<ReferralLink url="https://test.prewaitlist.com?ref=abc12345" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    });

    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("button", { name: /^copy$/i })).toBeDefined();
  });
});
