import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

const { getUserMock, signUpMock, pushMock, captureMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  signUpMock: vi.fn(),
  pushMock: vi.fn(),
  captureMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      signUp: signUpMock,
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  }),
}));

vi.mock("@/lib/analytics", () => ({
  capture: captureMock,
  setSurveySuppressed: vi.fn(),
}));

import SignupPage from "@/app/(auth)/signup/page";

async function submitSignup(email: string) {
  fireEvent.change(screen.getByLabelText("Email Address"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
}

function verifyEmailPushed() {
  return pushMock.mock.calls.some(
    ([path]) => typeof path === "string" && path.startsWith("/verify-email")
  );
}

// TC-AUTH-03: with email confirmations enabled (our config), GoTrue never
// returns "User already registered" for an existing email — it returns a
// 200 success payload with an obfuscated user whose identities[] is empty
// (supabase/auth#1517). The signup page must treat that as a duplicate.
describe("Signup duplicate-email detection (TC-AUTH-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: null } });
  });

  afterEach(() => {
    cleanup();
  });

  it("new signup (identities populated) proceeds to verify-email and captures account_created", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { identities: [{ id: "email", provider: "email" }] } },
      error: null,
    });

    render(<SignupPage />);
    await submitSignup("fresh@example.com");

    await waitFor(() => expect(verifyEmailPushed()).toBe(true));
    expect(captureMock).toHaveBeenCalledWith("account_created", {
      method: "email",
    });
  });

  it("empty identities with no error (obfuscated dupe user) shows the already-exists error and does not redirect", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    });

    render(<SignupPage />);
    await submitSignup("duplicate@example.com");

    expect(
      await screen.findByText(
        "An account with this email already exists. Please sign in."
      )
    ).toBeInTheDocument();
    expect(verifyEmailPushed()).toBe(false);
    expect(captureMock).not.toHaveBeenCalledWith("account_created", {
      method: "email",
    });
  });

  it("legacy 'User already registered' error path still shows the same message", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    render(<SignupPage />);
    await submitSignup("confirmed-dupe@example.com");

    expect(
      await screen.findByText(
        "An account with this email already exists. Please sign in."
      )
    ).toBeInTheDocument();
    expect(verifyEmailPushed()).toBe(false);
  });

  it("other signUp errors keep the generic fallback", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Database error" },
    });

    render(<SignupPage />);
    await submitSignup("broken@example.com");

    expect(
      await screen.findByText("Something went wrong. Please try again.")
    ).toBeInTheDocument();
    expect(verifyEmailPushed()).toBe(false);
  });
});
