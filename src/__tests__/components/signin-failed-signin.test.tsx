import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Bug locked here (live-verified 2026-10-19): a 2s fallback timer in the
// sign-in submit handler called navigatePostAuth() BLIND — it fired while
// signInWithPassword was still pending (or would have, on failure), pushing
// /dashboard before the 400 came back, bouncing straight back to /signin
// with "Invalid email or password" never shown. Navigation must only ever
// happen on confirmed success.

const {
  getUserMock,
  replaceMock,
  pushMock,
  signInMock,
  resetPasswordMock,
  onAuthStateChangeMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  signInMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: signInMock,
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: resetPasswordMock,
    },
    from: () => ({
      select: () => ({
        eq: async () => ({ count: 0, error: null }),
      }),
    }),
  }),
}));

import SigninPage from "@/app/(auth)/signin/page";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

const EMAIL = "founder@example.com";
const PASSWORD = "wrong-pass-123";

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Email Address"), {
    target: { value: EMAIL },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: PASSWORD },
  });
  const form = screen.getByRole("button", { name: "Sign in" }).closest("form");
  if (!form) throw new Error("sign-in form not found");
  fireEvent.submit(form);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  getUserMock.mockResolvedValue({ data: { user: null } });
  onAuthStateChangeMock.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  resetPasswordMock.mockResolvedValue({ error: null });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Sign-in submit — navigation only on confirmed success", () => {
  it("blocks an invalid email on the first submit before calling Supabase", async () => {
    render(<SigninPage />);
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "invalid" },
    });
    const form = screen
      .getByRole("button", { name: "Sign in" })
      .closest("form");
    if (!form) throw new Error("sign-in form not found");

    fireEvent.submit(form);

    expect(signInMock).not.toHaveBeenCalled();
    expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
  });

  it("failed sign-in never navigates, error copy is shown", async () => {
    signInMock.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<SigninPage />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    fillAndSubmit();

    // Old bug: the 2s fallback pushed /dashboard here. Advance well past it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid email or password. Please try again."
    );
  });

  it("success whose SIGNED_IN event never fires navigates exactly once", async () => {
    let resolveSignIn!: (value: { error: null }) => void;
    signInMock.mockReturnValue(
      new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      })
    );

    render(<SigninPage />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    fillAndSubmit();

    // Still pending: the old timer would already have navigated blind.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(pushMock).not.toHaveBeenCalled();

    await act(async () => {
      resolveSignIn({ error: null });
    });

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("SIGNED_IN event during the call navigates exactly once, no double-fire", async () => {
    let authHandler: ((event: string) => void) | null = null;
    onAuthStateChangeMock.mockImplementation((handler: (e: string) => void) => {
      authHandler = handler;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    signInMock.mockImplementation(async () => {
      authHandler?.("SIGNED_IN");
      return { error: null };
    });

    render(<SigninPage />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    fillAndSubmit();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(pushMock).toHaveBeenCalledTimes(1);

    // No second navigation from any later tick.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(pushMock).toHaveBeenCalledTimes(1);
  });
});

describe("Forgot password submit", () => {
  it("blocks an invalid email on the first submit before calling Supabase", () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "invalid" },
    });
    const form = screen
      .getByRole("button", { name: "Send reset link" })
      .closest("form");
    if (!form) throw new Error("forgot-password form not found");

    fireEvent.submit(form);

    expect(resetPasswordMock).not.toHaveBeenCalled();
    expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
  });
});
