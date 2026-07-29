"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Spinner } from "../../../../components/ui/spinner";
import { createClient } from "../../../../src/lib/supabase/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const supabase = createClient();

  const validateEmail = useCallback((value: string) => {
    if (!value) {
      setEmailError("Email address is required");
    } else if (!EMAIL_REGEX.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError(null);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    validateEmail(email);
    if (emailError) return;

    setLoading(true);

    document.cookie = "auth_redirect_to=/reset-password; path=/; max-age=300";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    );

    if (resetError) {
      if (resetError.message.includes("rate limit")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
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
          Reset your password
        </h1>
        <p className="mb-8 text-center text-body-lg text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>

        {submitted ? (
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-center text-body-sm text-[var(--color-foreground)]">
              Check your email for a password reset link.
            </p>
            <Link
              href="/signin"
              className="text-body-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                setEmailTouched(true);
                validateEmail(email);
              }}
              error={emailTouched ? (emailError ?? undefined) : undefined}
              required
            />

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
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}

        <Link
          href="/signin"
          className="mt-5 block text-center text-body-sm text-muted-foreground hover:text-[var(--color-foreground)]"
        >
          Remember your password?{" "}
          <span className="font-medium text-[var(--color-accent)] hover:underline">
            Sign in
          </span>
        </Link>
      </div>
    </div>
  );
}
