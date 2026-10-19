"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ONBOARDING_SERVER_DEFAULTS,
  useOnboardingForm,
  storedDraftHasProgress,
} from "../context";
import { createClient } from "../../../../src/lib/supabase/client";

export default function OnboardingSignup() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hydration gate (same pattern as Steps 1–3): SSR can never see
  // localStorage, so the preview card must paint ONBOARDING_SERVER_DEFAULTS
  // first and swap in the draft post-hydration — otherwise React throws a
  // mismatch ("Bat Is the Name" vs "Your Product") whenever a draft exists.
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // QA Batch 2 TC-ONB-14b: a no-draft visitor hard-landing here (bookmarked
  // /onboarding/4 while signed out) has nothing to "save" — the wall would
  // fabricate defaults and fake "Step 3 of 5". Send them to Step 1 instead.
  // The check must be "actual founder input", not "storage key exists": the
  // provider persists a defaults-only object for every visitor on mount, so
  // the raw key is always there by the time effects run (live-verified
  // 2026-10-19 — draft written at ~3ms, old check never fired).
  useEffect(() => {
    if (!storedDraftHasProgress()) {
      router.replace("/onboarding/1");
    }
  }, [router]);

  // Check if already logged in — skip to Step 4
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Already logged in — try flushing localStorage, then check server
        if ("flushToAPI" in form) {
          const waitlistId = await form.flushToAPI();
          if (waitlistId) {
            router.push("/onboarding/4");
            return;
          }
        }
        // No localStorage data — check if waitlist exists on server
        try {
          const res = await fetch("/api/waitlist");
          if (res.ok) {
            router.push("/onboarding/4");
          }
        } catch {
          // Stay on signup page
        }
      }
    }
    checkAuth();
  }, [supabase, form, router]);

  async function handleGoogleOAuth() {
    setError(null);
    setLoading(true);

    // Set cookie so callback knows where to redirect
    document.cookie = "auth_redirect_to=/onboarding/4; path=/; max-age=300";

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (oauthError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleEmailSignup() {
    setError(null);
    setLoading(true);

    // Set cookie so callback knows where to redirect
    document.cookie = "auth_redirect_to=/onboarding/4; path=/; max-age=300";

    // Redirect to signup page with next param so it can preserve the redirect
    router.push("/signup?next=/onboarding/4");
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Page header */}
      <div className="mb-2">
        <p className="text-xs font-medium text-accent">Step 3 of 5</p>
        <p className="text-sm text-muted-foreground">Save your progress</p>
      </div>

      <h1 className="mb-2 text-h2">Your waitlist is looking great</h1>
      <p className="mb-8 text-body text-muted-foreground">
        Create a free account to save your progress and continue to the final
        steps.
      </p>

      {/* Preview card */}
      <div className="mb-8 w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-accent"
            >
              <path
                d="M16.667 5L7.5 14.167L3.333 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">
              {mounted && form.headline ? form.headline : "Your Product"}
            </p>
            <p className="text-xs text-muted-foreground">
              {mounted && form.slug
                ? `${form.slug}.prewaitlist.com`
                : "your-page.prewaitlist.com"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Template:{" "}
          {mounted ? form.template : ONBOARDING_SERVER_DEFAULTS.template} •
          Brand color:{" "}
          {mounted ? form.brandColor : ONBOARDING_SERVER_DEFAULTS.brandColor}
        </p>
      </div>

      {/* Signup buttons */}
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={handleGoogleOAuth}
          disabled={loading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleEmailSignup}
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create account with email
        </button>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <p className="mt-6 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin?next=/onboarding/4"
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
