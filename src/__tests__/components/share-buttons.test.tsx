import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareButtons } from "../../../components/share/share-buttons";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ShareButtons", () => {
  const testUrl = "https://test.prewaitlist.com?ref=abc12345";

  it("renders Share button", () => {
    render(<ShareButtons url={testUrl} />);
    expect(screen.getByRole("button", { name: /share/i })).toBeDefined();
  });

  it("renders Copy link button", () => {
    render(<ShareButtons url={testUrl} />);
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("uses Web Share API when available", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    render(<ShareButtons url={testUrl} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share/i }));
    });

    expect(shareMock).toHaveBeenCalledWith({
      text: "Join the waitlist!",
      url: testUrl,
    });
  });

  it("falls back to clipboard when Web Share API unavailable", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ShareButtons url={testUrl} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share/i }));
    });

    expect(writeTextMock).toHaveBeenCalledWith(testUrl);
  });

  it("copies to clipboard on Copy link click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ShareButtons url={testUrl} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    });

    expect(writeTextMock).toHaveBeenCalledWith(testUrl);
  });

  it("shows Copied! confirmation after copy", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(<ShareButtons url={testUrl} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    });

    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();
  });
});
