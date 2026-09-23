import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const reauthenticate = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/dashboard/settings/security",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      reauthenticate: (...args: unknown[]) => reauthenticate(...args),
      updateUser: (...args: unknown[]) => updateUser(...args),
      signOut: (...args: unknown[]) => signOut(...args),
    },
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import SecurityClient from "../../app/dashboard/settings/security/client";

function profileResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({
      email: "founder@example.com",
      hasPassword: true,
      ...overrides,
    }),
  };
}

describe("Security — change password (email OTP reauth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reauthenticate.mockResolvedValue({ error: null });
    updateUser.mockResolvedValue({ data: { user: null }, error: null });
    signOut.mockResolvedValue({ error: null });
    mockFetch.mockResolvedValue(profileResponse());
  });

  it("starts on the send-code step (does not show new password fields)", async () => {
    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );
    expect(screen.queryByText("New password")).toBeNull();
    expect(screen.queryByPlaceholderText("New password")).toBeNull();
  });

  it("sends reauth code and advances to OTP step", async () => {
    const user = userEvent.setup();
    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );

    await user.click(screen.getByText("Send verification code"));
    expect(reauthenticate).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toBeDefined()
    );
    expect(screen.getByText("Resend code")).toBeDefined();
  });

  it("advances to set-password step after entering 6-digit code", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(profileResponse());
    reauthenticate.mockResolvedValue({ error: null });

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );
    await user.click(screen.getByText("Send verification code"));
    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toBeDefined()
    );

    await user.type(screen.getByLabelText("Verification code"), "123456");
    await user.click(screen.getByText("Verify"));

    await waitFor(() =>
      expect(screen.getByLabelText("New password")).toBeDefined()
    );
    expect(screen.getByLabelText("Confirm password")).toBeDefined();
  });

  it("blocks update when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );
    await user.click(screen.getByText("Send verification code"));
    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toBeDefined()
    );
    await user.type(screen.getByLabelText("Verification code"), "123456");
    await user.click(screen.getByText("Verify"));
    await waitFor(() =>
      expect(screen.getByLabelText("New password")).toBeDefined()
    );

    await user.type(screen.getByLabelText("New password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password2");
    await user.click(screen.getByText("Update password"));

    expect(screen.getByText("New passwords do not match.")).toBeDefined();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser with password and nonce on success", async () => {
    const user = userEvent.setup();
    updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );
    await user.click(screen.getByText("Send verification code"));
    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toBeDefined()
    );
    await user.type(screen.getByLabelText("Verification code"), "654321");
    await user.click(screen.getByText("Verify"));
    await waitFor(() =>
      expect(screen.getByLabelText("New password")).toBeDefined()
    );

    await user.type(screen.getByLabelText("New password"), "newpass1");
    await user.type(screen.getByLabelText("Confirm password"), "newpass1");
    await user.click(screen.getByText("Update password"));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({
        password: "newpass1",
        nonce: "654321",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Password updated.")).toBeDefined()
    );
  });

  it("shows invalid-code error and returns to verify step when nonce rejected", async () => {
    const user = userEvent.setup();
    updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Nonce should be a valid UUID" },
    });

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );
    await user.click(screen.getByText("Send verification code"));
    await waitFor(() =>
      expect(screen.getByLabelText("Verification code")).toBeDefined()
    );
    await user.type(screen.getByLabelText("Verification code"), "000000");
    await user.click(screen.getByText("Verify"));
    await waitFor(() =>
      expect(screen.getByLabelText("New password")).toBeDefined()
    );

    await user.type(screen.getByLabelText("New password"), "newpass1");
    await user.type(screen.getByLabelText("Confirm password"), "newpass1");
    await user.click(screen.getByText("Update password"));

    await waitFor(() =>
      expect(
        screen.getByText("That code is invalid or expired. Send a new code.")
      ).toBeDefined()
    );
    expect(screen.getByLabelText("Verification code")).toBeDefined();
  });

  it("hides OTP change-password form for OAuth-only users", async () => {
    mockFetch.mockResolvedValue(
      profileResponse({ email: "google@example.com", hasPassword: false })
    );

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Create a password")).toBeDefined()
    );
    expect(screen.queryByText("Send verification code")).toBeNull();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(
      screen.getByText(
        "You're signed in with Google. Create a password so you can also sign in with email."
      )
    ).toBeDefined();
  });

  it("creates password for OAuth account via updateUser without nonce", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(
      profileResponse({ email: "google@example.com", hasPassword: false })
    );
    updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Create a password")).toBeDefined()
    );

    await user.type(screen.getByLabelText("Password"), "newpass1");
    await user.type(screen.getByLabelText("Confirm password"), "newpass1");
    await user.click(screen.getByRole("button", { name: "Create password" }));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ password: "newpass1" })
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "Password created. You can now sign in with email and password."
        )
      ).toBeDefined()
    );
    await waitFor(() =>
      expect(screen.getByText("Send verification code")).toBeDefined()
    );
    expect(reauthenticate).not.toHaveBeenCalled();
  });

  it("blocks create when passwords do not match", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(
      profileResponse({ email: "google@example.com", hasPassword: false })
    );

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getByText("Create a password")).toBeDefined()
    );

    await user.type(screen.getByLabelText("Password"), "password1");
    await user.type(screen.getByLabelText("Confirm password"), "password2");
    await user.click(screen.getByRole("button", { name: "Create password" }));

    expect(screen.getByText("New passwords do not match.")).toBeDefined();
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe("Security — delete account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(profileResponse());
    reauthenticate.mockResolvedValue({ error: null });
    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
  });

  it("requires typing exact email before permanent delete", async () => {
    const user = userEvent.setup();
    render(<SecurityClient />);

    await waitFor(() =>
      expect(screen.getAllByText("Delete account").length).toBeGreaterThan(0)
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.getByText("Continue")).toBeDefined();
    await user.click(screen.getByText("Continue"));

    await waitFor(() =>
      expect(screen.getByPlaceholderText("your@email.com")).toBeDefined()
    );

    const confirmBtn = screen.getByText("Permanently delete");
    expect(confirmBtn).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("your@email.com"),
      "wrong@x.com"
    );
    expect(confirmBtn).toBeDisabled();

    await user.clear(screen.getByPlaceholderText("your@email.com"));
    await user.type(
      screen.getByPlaceholderText("your@email.com"),
      "founder@example.com"
    );
    expect(confirmBtn).not.toBeDisabled();
  });

  it("calls DELETE /api/profile and signs out on success", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.resolve(profileResponse());
    });

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getAllByText("Delete account").length).toBeGreaterThan(0)
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    await user.click(screen.getByText("Continue"));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("your@email.com")).toBeDefined()
    );
    await user.type(
      screen.getByPlaceholderText("your@email.com"),
      "founder@example.com"
    );
    await user.click(screen.getByText("Permanently delete"));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("surfaces API error when delete fails", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            error:
              "Could not cancel your subscription. Cancel it from Billing, then try again.",
          }),
        });
      }
      return Promise.resolve(profileResponse());
    });

    render(<SecurityClient />);
    await waitFor(() =>
      expect(screen.getAllByText("Delete account").length).toBeGreaterThan(0)
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    await user.click(screen.getByText("Continue"));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("your@email.com")).toBeDefined()
    );
    await user.type(
      screen.getByPlaceholderText("your@email.com"),
      "founder@example.com"
    );
    await user.click(screen.getByText("Permanently delete"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Could not cancel your subscription. Cancel it from Billing, then try again."
        )
      ).toBeDefined()
    );
    expect(push).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
