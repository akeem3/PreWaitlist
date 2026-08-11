"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingForm, hasStaleDraft } from "../context";
import { createClient } from "../../../../src/lib/supabase/client";

type SlugStatus = "idle" | "checking" | "available" | "unavailable" | "error";

function deriveSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

function generateFallbackSlug(): string {
  return crypto.randomUUID().slice(0, 8);
}

export default function OnboardingStep1() {
  const router = useRouter();
  const form = useOnboardingForm();
  const supabase = createClient();

  const [headline, setHeadline] = useState(form.headline);
  const [subheadline, setSubheadline] = useState(form.subheadline);
  const [slugInput, setSlugInput] = useState(form.slug);
  const [slug, setSlug] = useState(form.slug);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // Compute resume prompt state during initial render
  const [resumeState, setResumeState] = useState(() => {
    if (hasStaleDraft()) {
      try {
        const raw = localStorage.getItem("prewaitlist_onboarding");
        if (raw) {
          const parsed = JSON.parse(raw);
          const name = parsed.headline || parsed.slug || "";
          return { show: true, staleName: name };
        }
      } catch {
        // Ignore
      }
    }
    return { show: false, staleName: "" };
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auth check: if logged in with existing waitlist, redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // User is authenticated — check if they have a waitlist
      try {
        const res = await fetch("/api/waitlist");
        if (res.ok) {
          // Has a waitlist → already set up, go to dashboard
          router.replace("/dashboard");
        }
        // 404 → no waitlist, let them start fresh
      } catch {
        // API error → let them continue
      }
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    form.updateField("headline", headline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headline]);

  useEffect(() => {
    form.updateField("subheadline", subheadline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subheadline]);

  useEffect(() => {
    form.updateField("slug", slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const checkSlug = useCallback(async (candidate: string) => {
    if (!candidate) {
      setSlugStatus("idle");
      setSlugError(null);
      return;
    }

    setSlugStatus("checking");
    setSlugError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        `/api/waitlist/check-slug?slug=${encodeURIComponent(candidate)}`,
        { signal: controller.signal }
      );
      const data = await res.json();

      if (controller.signal.aborted) return;

      if (data.available) {
        setSlugStatus("available");
        setSlugError(null);
      } else {
        setSlugStatus("unavailable");
        setSlugError("Already taken");
      }
    } catch {
      if (!controller.signal.aborted) {
        setSlugStatus("error");
        setSlugError("Could not check availability");
      }
    }
  }, []);

  const handleSlugChange = useCallback(
    (value: string) => {
      const derived = deriveSlug(value);
      setSlugInput(value);
      setSlug(derived);
      setUsedFallback(false);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!derived) {
        setSlugStatus("idle");
        setSlugError(null);
        return;
      }

      setSlugStatus("checking");
      debounceRef.current = setTimeout(() => {
        checkSlug(derived);
      }, 400);
    },
    [checkSlug]
  );

  const handleNameLater = useCallback(() => {
    const fallback = generateFallbackSlug();
    setSlugInput("");
    setSlug(fallback);
    setUsedFallback(true);
    setSlugStatus("idle");
    setSlugError(null);
    form.updateField("slug", fallback);
  }, [form]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!slug || slugStatus === "checking") return;

      form.setLoading(true);
      setSubmitError(null);

      try {
        // Store in context/localStorage only — no API call yet
        form.updateField("slug", slug);
        form.updateField("headline", headline);
        form.updateField("subheadline", subheadline);
        router.push("/onboarding/2");
      } catch {
        setSubmitError("Something went wrong. Please try again.");
        form.setLoading(false);
      }
    },
    [slug, slugStatus, headline, subheadline, form, router]
  );

  const isSubmitting = form.loading;
  const isValid =
    slug && slugStatus !== "checking" && slugStatus !== "unavailable";

  const handleResume = useCallback(() => {
    setResumeState((s) => ({ ...s, show: false }));
    // Session flag is already set by LocalOnboardingProvider on mount
  }, []);

  const handleStartFresh = useCallback(() => {
    setResumeState((s) => ({ ...s, show: false }));
    if ("clearDraft" in form) {
      form.clearDraft();
    }
    // Reset local state
    setHeadline("");
    setSubheadline("");
    setSlugInput("");
    setSlug("");
    setSlugStatus("idle");
    setSlugError(null);
    setUsedFallback(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Resume prompt — shown when stale draft detected on cold landing */}
      {resumeState.show && (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-medium text-foreground">
            {resumeState.staleName
              ? `You have an in-progress setup for "${resumeState.staleName}"`
              : "You have an in-progress setup"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Would you like to continue where you left off?
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleResume}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleStartFresh}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-2">
        <p className="text-xs font-medium text-accent">Step 1 of 5</p>
        <p className="text-sm text-muted-foreground">Name your waitlist</p>
      </div>

      <h1 className="mb-1 text-h2">What are you building?</h1>
      <p className="mb-8 text-body-lg text-muted-foreground">
        Your page goes live as you type.
      </p>

      {/* Field 1: Headline */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Headline
        </label>
        <input
          type="text"
          placeholder="e.g Buildly"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Field 2: Sub-headline */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Sub-headline
        </label>
        <textarea
          placeholder="The Smarter way to manage Projects"
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full resize-none items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Field 3: Tagline (slug) */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          tagline
        </label>
        <input
          type="text"
          placeholder={
            headline ? deriveSlug(headline) || "my-product" : "buildly"
          }
          value={slugInput}
          onChange={(e) => handleSlugChange(e.target.value)}
          disabled={isSubmitting || usedFallback}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        {/* URL preview with availability */}
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Your Page:</span>
          {slug && (
            <span className="font-medium text-accent">
              {slug}.prewaitlist.com
            </span>
          )}
          {slugStatus === "available" && (
            <span className="text-accent">available</span>
          )}
          {slugStatus === "checking" && (
            <span className="text-muted-foreground">checking…</span>
          )}
          {slugError && <span className="text-destructive">{slugError}</span>}
        </div>
      </div>

      {/* Submit button + I'll name it later */}
      <div className="sticky bottom-0 flex flex-col items-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        {submitError && (
          <p className="mb-3 text-sm text-destructive">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex h-14.75 w-114.5 items-center justify-center rounded-md bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span>Next →</span>
          )}
        </button>
        <button
          type="button"
          onClick={handleNameLater}
          disabled={isSubmitting}
          className="mt-3 text-sm underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-50 text-muted-foreground"
        >
          I&apos;ll name it later
        </button>
      </div>
    </form>
  );
}
