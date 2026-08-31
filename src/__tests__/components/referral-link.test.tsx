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
  const testUrl = "https://test.prewaitlist.com?ref=abc12345";

  it("renders full referral URL", () => {
    render(<ReferralLink url={testUrl} />);
    const input = screen.getByRole("textbox", { name: /referral link/i });
    expect(input).toHaveValue(testUrl);
  });

  it("input is read-only", () => {
    render(<ReferralLink url={testUrl} />);
    const input = screen.getByRole("textbox", { name: /referral link/i });
    expect(input).toHaveAttribute("readonly");
  });

  it("renders copy icon button", () => {
    render(<ReferralLink url={testUrl} />);
    expect(
      screen.getByRole("button", { name: /copy referral link/i })
    ).toBeDefined();
  });

  it("copies URL to clipboard on click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ReferralLink url={testUrl} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy referral link/i })
      );
    });

    expect(writeTextMock).toHaveBeenCalledWith(testUrl);
  });

  it("shows Copied! feedback after copy", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ReferralLink url={testUrl} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy referral link/i })
      );
    });

    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();
  });

  it("falls back to execCommand when clipboard API unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    render(<ReferralLink url={testUrl} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy referral link/i })
      );
    });

    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });

  it("resets Copied! after 2 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ReferralLink url={testUrl} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy referral link/i })
      );
    });

    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(
      screen.getByRole("button", { name: /copy referral link/i })
    ).toBeDefined();
  });
});
