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

  it("renders Twitter link with correct URL", () => {
    render(<ShareButtons url={testUrl} />);
    const twitterLink = screen.getByRole("link", { name: /twitter/i });
    expect(twitterLink).toBeDefined();
    expect(twitterLink.getAttribute("href")).toContain(
      "twitter.com/intent/tweet"
    );
    expect(twitterLink.getAttribute("href")).toContain(
      encodeURIComponent(testUrl)
    );
  });

  it("renders LinkedIn link with correct URL", () => {
    render(<ShareButtons url={testUrl} />);
    const linkedinLink = screen.getByRole("link", { name: /linkedin/i });
    expect(linkedinLink).toBeDefined();
    expect(linkedinLink.getAttribute("href")).toContain(
      "linkedin.com/sharing/share-offsite"
    );
    expect(linkedinLink.getAttribute("href")).toContain(
      encodeURIComponent(testUrl)
    );
  });

  it("renders Copy Link button", () => {
    render(<ShareButtons url={testUrl} />);
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDefined();
  });

  it("copies to clipboard on Copy Link click", async () => {
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
});
