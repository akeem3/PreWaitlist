import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("../../app/onboarding/context", () => ({
  AuthedOnboardingProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { FlushGate } from "../../components/auth/flush-gate";

const STORAGE_KEY = "prewaitlist_onboarding";

let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SERVER_RECORD = {
  waitlistId: "wl-1",
  slug: "acme",
  productName: "Acme",
  headline: "Join Acme",
};

function storedDraft(overrides: Record<string, unknown> = {}) {
  return {
    slug: "acme",
    productName: "Acme",
    headline: "Join Acme",
    template: "minimal",
    ...overrides,
  };
}

describe("FlushGate (4.1)", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mockReplace.mockClear();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to Step 1 when truly fresh (GET 404, no local data)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "none" }, 404));

    render(
      <FlushGate>
        <div data-testid="kid" />
      </FlushGate>
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/onboarding/1")
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("kid")).toBeNull();
  });

  it("POSTs local data only when no server record exists, then clears the draft", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedDraft()));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "none" }, 404)) // pre-check
      .mockResolvedValueOnce(jsonResponse({ id: "wl-1" }, 201)) // POST
      .mockResolvedValueOnce(jsonResponse(SERVER_RECORD)); // full GET

    render(
      <FlushGate>
        <div data-testid="kid" />
      </FlushGate>
    );

    await waitFor(() => expect(screen.getByTestId("kid")).toBeTruthy());
    const posts = fetchMock.mock.calls.filter((c) => c[1]?.method === "POST");
    expect(posts).toHaveLength(1);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("skips POST when a server record already exists (server wins)", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedDraft()));
    fetchMock.mockResolvedValueOnce(jsonResponse([SERVER_RECORD]));

    render(
      <FlushGate>
        <div data-testid="kid" />
      </FlushGate>
    );

    await waitFor(() => expect(screen.getByTestId("kid")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(
      false
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("routes headline-without-slug back to Step 1 without any network call", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(storedDraft({ slug: "" }))
    );

    render(
      <FlushGate>
        <div data-testid="kid" />
      </FlushGate>
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/onboarding/1")
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("offers a Start fresh escape that discards the draft", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedDraft()));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "none" }, 404)) // pre-check
      .mockResolvedValueOnce(jsonResponse({ error: "bad" }, 400)); // POST fails

    render(
      <FlushGate>
        <div data-testid="kid" />
      </FlushGate>
    );

    const escape = await screen.findByRole("button", { name: "Start fresh" });
    await user.click(escape);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/1");
  });

  it("shows the error UI when the pre-check GET fails", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedDraft()));
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "db down" }, 500));

    render(
      <FlushGate>
        <div data-testid="kid" />
      </FlushGate>
    );

    await screen.findByRole("button", { name: "Try again" });
    expect(screen.queryByTestId("kid")).toBeNull();
  });
});
