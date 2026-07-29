import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareCopyLink from "../../../components/share/share-copy-link";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ShareCopyLink", () => {
  it("renders Copy Link button", () => {
    render(<ShareCopyLink url="https://example.com" />);
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("does not render Share button when navigator.share is undefined", () => {
    render(<ShareCopyLink url="https://example.com" />);
    expect(screen.queryByRole("button", { name: /share$/i })).toBeNull();
  });

  it("renders Share button when navigator.share is defined", () => {
    const shareMock = vi.fn();
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    render(<ShareCopyLink url="https://example.com" />);
    expect(screen.getByRole("button", { name: /share$/i })).toBeDefined();
  });

  it("copies URL to clipboard and shows Copied! state", async () => {
    const user = userEvent.setup();
    render(<ShareCopyLink url="https://example.com/waitlist" />);

    const copyButton = screen.getByRole("button", { name: /copy link/i });
    await user.click(copyButton);

    // The button text should change to "Copied!" after successful clipboard write
    // (using the global mock from setup.ts)
    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();
  });

  it("reverts Copied! state after 2 seconds", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    vi.useFakeTimers();
    render(<ShareCopyLink url="https://example.com" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    });

    expect(screen.getByRole("button", { name: /copied!/i })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("calls onCopy callback when copy is clicked", async () => {
    const onCopyMock = vi.fn();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const user = userEvent.setup();
    render(<ShareCopyLink url="https://example.com" onCopy={onCopyMock} />);

    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(onCopyMock).toHaveBeenCalledOnce();
  });

  it("calls onShare callback when share is clicked", async () => {
    const onShareMock = vi.fn();
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: shareMock,
    });

    const user = userEvent.setup();
    render(<ShareCopyLink url="https://example.com" onShare={onShareMock} />);

    await user.click(screen.getByRole("button", { name: /share$/i }));
    expect(shareMock).toHaveBeenCalledWith({ url: "https://example.com" });
    expect(onShareMock).toHaveBeenCalledOnce();
  });
});
