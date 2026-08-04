"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { PasswordInput } from "../../../../components/ui/password-input";
import { Spinner } from "../../../../components/ui/spinner";
import { createClient } from "../../../../src/lib/supabase/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBMIT_ATTEMPTS = 5;
const SUBMIT_COOLDOWN_MS = 60_000;

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const submitAttempts = useRef(0);
  const lastSubmitTime = useRef(0);
  const router = useRouter();
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

    const now = Date.now();
    if (submitAttempts.current >= MAX_SUBMIT_ATTEMPTS) {
      const elapsed = now - lastSubmitTime.current;
      if (elapsed < SUBMIT_COOLDOWN_MS) {
        const remaining = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000);
        setError(`Too many attempts. Please try again in ${remaining}s`);
        return;
      }
      submitAttempts.current = 0;
    }

    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    submitAttempts.current++;
    lastSubmitTime.current = Date.now();

    if (signInError) {
      if (signInError.message.includes("rate limit")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
      setLoading(false);
      return;
    }

    const { data: waitlist } = await supabase
      .from("waitlists")
      .select("id")
      .eq("founder_id", data.user.id)
      .single();

    if (waitlist) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding/1");
    }
  }

  async function handleGoogleOAuth() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--color-background)] px-4 pt-[8vh]">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mb-8 block">
          <Image
            src="/main-logo.svg"
            alt="PreWaitlist"
            width={160}
            height={52}
            className="mx-auto"
            priority
          />
        </Link>
        <h1 className="mb-8 text-center text-h2-semibold text-[var(--color-foreground)]">
          Sign in
        </h1>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="mb-4 w-full border border-[var(--color-border)] bg-white text-foreground hover:bg-gray-50"
          onClick={handleGoogleOAuth}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4435"
            />
          </svg>
          Continue With Google
        </Button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-body-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Email"
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

          <div>
            <PasswordInput
              label="Password"
              placeholder="Password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-1.5 text-right">
              <Link
                href="/forgot-password"
                className="inline-block text-body-sm text-muted-foreground hover:text-[var(--color-foreground)]"
              >
                Forgot password?
              </Link>
            </div>
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <Link
          href="/signup"
          className="mt-5 block text-center text-body-sm text-muted-foreground hover:text-[var(--color-foreground)]"
        >
          Don&apos;t have an account?{" "}
          <span className="font-medium text-[var(--color-accent)] hover:underline">
            Sign up
          </span>
        </Link>
      </div>
    </div>
  );
}
