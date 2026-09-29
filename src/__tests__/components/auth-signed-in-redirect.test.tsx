import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

const { getUserMock, replaceMock, pushMock, countMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams("next=/dashboard/settings/billing&plan=pro"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      resend: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: async () => ({ count: countMock(), error: null }),
      }),
    }),
  }),
}));

import SignupPage from "@/app/(auth)/signup/page";
import SigninPage from "@/app/(auth)/signin/page";

const PRO_INTENT_DEST = "/dashboard/settings/billing?plan=pro";
const PRO_ONBOARDING_ENTRY = "/onboarding/1?plan=pro";

describe("Signed-in redirect on auth pages (Go Pro entry leg)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    countMock.mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
  });

  it("signup: zero-waitlist Pro-intent founder lands where the modal opens", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(<SignupPage />);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(PRO_ONBOARDING_ENTRY)
    );
    expect(replaceMock).not.toHaveBeenCalledWith(PRO_INTENT_DEST);
  });

  it("signup: Pro-intent founder with a waitlist goes to billing", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    countMock.mockReturnValue(1);

    render(<SignupPage />);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(PRO_INTENT_DEST)
    );
    expect(replaceMock).not.toHaveBeenCalledWith(PRO_ONBOARDING_ENTRY);
  });

  it("signup: keeps the form for visitors without a session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    render(<SignupPage />);

    await waitFor(() => expect(getUserMock).toHaveBeenCalled());
    expect(replaceMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
  });

  it("signin: zero-waitlist Pro-intent founder lands where the modal opens", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(<SigninPage />);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(PRO_ONBOARDING_ENTRY)
    );
  });

  it("signin: Pro-intent founder with a waitlist goes to billing", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    countMock.mockReturnValue(1);

    render(<SigninPage />);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(PRO_INTENT_DEST)
    );
  });

  it("signin: keeps the form for visitors without a session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    render(<SigninPage />);

    await waitFor(() => expect(getUserMock).toHaveBeenCalled());
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
