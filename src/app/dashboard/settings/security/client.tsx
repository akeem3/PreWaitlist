"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../../../components/ui/input";
import { createClient } from "../../../../lib/supabase/client";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";

interface ProfileData {
  email: string;
  hasPassword?: boolean;
}

type PasswordStep = "request" | "verify" | "set";

export default function SecurityClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const router = useRouter();

  // Password reauth flow
  const [passwordStep, setPasswordStep] = useState<PasswordStep>("request");
  const [sendingCode, setSendingCode] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Delete Account state
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProfileData | null) => {
        if (cancelled || !data) return;
        setProfile(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendCode() {
    setSendingCode(true);
    setPasswordMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.reauthenticate();
      if (error) {
        setPasswordMsg({ type: "err", text: error.message });
      } else {
        setPasswordStep("verify");
        setPasswordMsg({
          type: "ok",
          text: `We sent a 6-digit code to ${profile?.email ?? "your email"}.`,
        });
      }
    } catch {
      setPasswordMsg({
        type: "err",
        text: "Could not send verification code. Try again.",
      });
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    if (otp.trim().length < 6) {
      setPasswordMsg({ type: "err", text: "Enter the 6-digit code." });
      return;
    }
    // Nonce is validated server-side with updateUser({ password, nonce })
    setVerifying(true);
    setPasswordMsg(null);
    setPasswordStep("set");
    setVerifying(false);
  }

  function handleCancelPasswordFlow() {
    setPasswordStep("request");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMsg(null);
  }

  async function handleCreatePassword() {
    setPasswordSaving(true);
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New passwords do not match." });
      setPasswordSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "err",
        text: "Password must be at least 6 characters.",
      });
      setPasswordSaving(false);
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("recent") ||
          msg.includes("reauthenticate") ||
          msg.includes("secure")
        ) {
          setPasswordMsg({
            type: "err",
            text: "Please sign in again to create a password.",
          });
        } else {
          setPasswordMsg({ type: "err", text: error.message });
        }
      } else {
        setPasswordMsg({
          type: "ok",
          text: "Password created. You can now sign in with email and password.",
        });
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        setPasswordStep("request");
        setProfile((prev) => (prev ? { ...prev, hasPassword: true } : prev));
      }
    } catch {
      setPasswordMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPasswordSaving(true);
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New passwords do not match." });
      setPasswordSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "err",
        text: "Password must be at least 6 characters.",
      });
      setPasswordSaving(false);
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        nonce: otp.trim(),
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("nonce") ||
          msg.includes("otp") ||
          msg.includes("token")
        ) {
          setPasswordMsg({
            type: "err",
            text: "That code is invalid or expired. Send a new code.",
          });
          setPasswordStep("verify");
          setOtp("");
        } else if (msg.includes("recent")) {
          setPasswordMsg({
            type: "err",
            text: "Please sign in again to change your password.",
          });
        } else {
          setPasswordMsg({ type: "err", text: error.message });
        }
      } else {
        setPasswordMsg({ type: "ok", text: "Password updated." });
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordStep("request");
      }
    } catch {
      setPasswordMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Delete failed");
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      setDeleteMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Delete failed.",
      });
      setDeleting(false);
    }
  }

  const showPassword = profile?.hasPassword !== false;
  const canSendCode = !!profile?.email;

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">Security</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Update your password and manage account security.
        </p>
      </div>

      <div className="space-y-6">
        {/* Change Password — email OTP reauth first */}
        {showPassword && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">
              Change password
            </h2>

            {passwordStep === "request" && (
              <div className="space-y-4">
                <p className="text-body-sm text-muted-foreground">
                  We&apos;ll email a 6-digit code to{" "}
                  <strong className="text-foreground">
                    {profile?.email || "your email"}
                  </strong>{" "}
                  before you set a new password.
                </p>
                {passwordMsg && (
                  <p
                    className={`text-sm ${passwordMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
                  >
                    {passwordMsg.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || !canSendCode}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingCode ? "Sending…" : "Send verification code"}
                </button>
              </div>
            )}

            {passwordStep === "verify" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="reauth-otp"
                    className="text-sm font-medium text-foreground"
                  >
                    Verification code
                  </label>
                  <Input
                    id="reauth-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="max-w-xs tracking-[0.3em]"
                  />
                </div>
                {passwordMsg && (
                  <p
                    className={`text-sm ${passwordMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
                  >
                    {passwordMsg.text}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifying || otp.length < 6}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? "Verifying…" : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    {sendingCode ? "Sending…" : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPasswordFlow}
                    disabled={sendingCode}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {passwordStep === "set" && (
              <div className="space-y-4">
                <p className="text-body-sm text-muted-foreground">
                  Code verified. Set your new password.
                </p>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="new-password"
                    className="text-sm font-medium text-foreground"
                  >
                    New password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="confirm-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordMsg && (
                  <p
                    className={`text-sm ${passwordMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
                  >
                    {passwordMsg.text}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={
                      passwordSaving || !newPassword || !confirmPassword
                    }
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordSaving ? "Updating…" : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPasswordFlow}
                    disabled={passwordSaving}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!showPassword && profile && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">
              Create a password
            </h2>
            <div className="space-y-4">
              <p className="text-body-sm text-muted-foreground">
                You&apos;re signed in with Google. Create a password so you can
                also sign in with email.
              </p>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="create-password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Input
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirm-create-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm password
                </label>
                <Input
                  id="confirm-create-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordMsg && (
                <p
                  className={`text-sm ${passwordMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
                >
                  {passwordMsg.text}
                </p>
              )}
              <button
                type="button"
                onClick={handleCreatePassword}
                disabled={passwordSaving || !newPassword || !confirmPassword}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordSaving ? "Creating…" : "Create password"}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone — Delete Account */}
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
          <h2 className="mb-1 text-h4 font-medium text-destructive">
            Delete account
          </h2>
          <p className="mb-6 text-body-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>

          {deleteMsg && (
            <p
              className={`mb-4 text-sm ${deleteMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
            >
              {deleteMsg.text}
            </p>
          )}

          {deleteStep === 0 && (
            <button
              type="button"
              onClick={() => setDeleteStep(1)}
              className="rounded-lg border border-destructive/50 bg-card px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              Delete account
            </button>
          )}

          {deleteStep === 1 && (
            <div>
              <p className="mb-3 text-body-sm text-foreground">
                <strong>Warning:</strong> This will permanently delete your
                profile, all waitlists, subscribers, and updates.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep(2);
                    setDeleteEmail("");
                  }}
                  className="rounded-lg border border-destructive/50 bg-card px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div>
              <p className="mb-3 text-body-sm text-foreground">
                Type your email <strong>{profile?.email}</strong> to confirm
                deletion:
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  className="max-w-xs"
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteEmail !== profile?.email}
                  className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting…" : "Permanently delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  disabled={deleting}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
