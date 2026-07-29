"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { PasswordInput } from "../../../../components/ui/password-input";
import { Spinner } from "../../../../components/ui/spinner";
import { createClient } from "../../../../src/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const passwordValid = password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      if (updateError.message.includes("rate limit")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--color-background)] px-4 pt-[8vh]">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mb-8 block">
          <Image
            src="/main-logo.svg"
            alt="MyWaitlist"
            width={160}
            height={52}
            className="mx-auto"
            priority
          />
        </Link>
        <h1 className="mb-2 text-center text-h2-semibold text-[var(--color-foreground)]">
          Set new password
        </h1>
        <p className="mb-8 text-center text-body-lg text-muted-foreground">
          Enter your new password below.
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10">
              <svg
                className="h-6 w-6 text-[var(--color-accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-center text-body-sm text-[var(--color-foreground)]">
              Your password has been updated.
            </p>
            <Link
              href="/signin"
              className="text-body-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Sign in with new password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <PasswordInput
                label="New Password"
                placeholder="••••••••"
                name="password"
                autoComplete="new-password"
                showStrength
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password.length > 0 && (
                <p
                  className={`mt-1 text-xs ${passwordValid ? "text-[var(--color-accent)]" : "text-muted-foreground"}`}
                >
                  {passwordValid
                    ? "\u2713 At least 8 characters"
                    : "At least 8 characters"}
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs text-error" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-1 w-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
              disabled={loading}
            >
              {loading && <Spinner className="text-white" />}
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}

        <Link
          href="/signin"
          className="mt-5 block text-center text-body-sm text-muted-foreground hover:text-[var(--color-foreground)]"
        >
          <span className="font-medium text-[var(--color-accent)] hover:underline">
            Back to sign in
          </span>
        </Link>
      </div>
    </div>
  );
}
