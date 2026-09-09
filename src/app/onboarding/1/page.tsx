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

const ADJECTIVES = [
  "brave",
  "swift",
  "bright",
  "calm",
  "eager",
  "fair",
  "grand",
  "keen",
  "noble",
  "proud",
  "quick",
  "sharp",
  "stark",
  "vivid",
  "warm",
  "bold",
  "cool",
  "deep",
  "fresh",
  "green",
];
const NOUNS = [
  "fox",
  "hawk",
  "oak",
  "pine",
  "star",
  "wave",
  "wind",
  "stone",
  "tree",
  "cloud",
  "river",
  "spring",
  "crest",
  "peak",
  "vale",
  "bay",
  "cove",
  "dune",
  "fern",
  "moss",
];

function generateFallbackSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const hex = crypto.randomUUID().slice(0, 4);
  return `${adj}-${noun}-${hex}`;
}

export default function OnboardingStep1() {
  const router = useRouter();
  const form = useOnboardingForm();
  const supabase = createClient();

  const [subheadline, setSubheadline] = useState(form.subheadline);
  const [slugInput, setSlugInput] = useState(form.slug);
  const [slug, setSlug] = useState(form.slug);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // Mount guard — slug preview reads localStorage, must wait for client hydration
  const [mounted, setMounted] = useState(false);

  // Resume prompt — hidden on server, populated from localStorage in useEffect
  const [resumeState, setResumeState] = useState<{
    show: boolean;
    staleName: string;
  }>({ show: false, staleName: "" });

  useEffect(() => {
    if (hasStaleDraft()) {
      try {
        const raw = localStorage.getItem("prewaitlist_onboarding");
        if (raw) {
          const parsed = JSON.parse(raw);
          const name = parsed.productName || parsed.slug || "";
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setResumeState({ show: true, staleName: name });
        }
      } catch {
        // Ignore
      }
    }
    setMounted(true);
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auth check: if logged in with completed onboarding, redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const res = await fetch("/api/waitlist");
        if (!res.ok) return;
        const data = await res.json();

        const hasSlug = Boolean(data.slug);
        const hasHeadline = Boolean(data.headline);
        const hasTemplate = Boolean(data.template);
        const hasBrandColor = Boolean(data.brandColor);

        if (hasSlug && hasHeadline && hasTemplate && hasBrandColor) {
          router.replace("/dashboard");
        }
      } catch {
        // API error — continue onboarding
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
    form.updateField("productName", "My Waitlist");
    form.updateField("headline", "My Waitlist");
    form.updateField("subheadline", "Join the waitlist");
    router.push("/onboarding/2");
  }, [form, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!slug || slugStatus === "checking") return;

      form.setLoading(true);
      setSubmitError(null);

      try {
        // Store in context/localStorage only — no API call yet
        form.updateField("slug", slug);
        form.updateField("subheadline", subheadline);
        router.push("/onboarding/2");
      } catch {
        setSubmitError("Something went wrong. Please try again.");
        form.setLoading(false);
      }
    },
    [slug, slugStatus, subheadline, form, router]
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
    form.updateField("headline", "");
    form.updateField("subheadline", "");
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

      <h1 className="mb-1 text-h2">What&apos;s your product called?</h1>
      <p className="mb-8 text-body-lg text-muted-foreground">
        Don&apos;t worry — you can change all of this later.
      </p>

      {/* Field 1: Product Name */}
      <div className="mb-3">
        <label
          htmlFor="productName"
          className="mb-1 block text-xs text-muted-foreground"
        >
          Product Name
        </label>
        <input
          id="productName"
          type="text"
          placeholder="e.g. Buildly"
          value={form.productName}
          onChange={(e) => form.updateField("productName", e.target.value)}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-10 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Field 2: Subheadline */}
      <div className="mb-3">
        <label
          htmlFor="subheadline"
          className="mb-1 block text-xs text-muted-foreground"
        >
          Subheadline
        </label>
        <input
          id="subheadline"
          type="text"
          placeholder="The Smarter way to manage Projects"
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-10 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Field 3: Subdomain (slug) */}
      <div className="mb-3">
        <label
          htmlFor="slug"
          className="mb-1 block text-xs text-muted-foreground"
        >
          Subdomain
        </label>
        <input
          id="slug"
          type="text"
          placeholder="my-product"
          value={slugInput}
          onChange={(e) => handleSlugChange(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-10 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        {/* URL preview with availability */}
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Your Page:</span>
          {mounted && slug && (
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
        {usedFallback && slug && (
          <p className="mt-1 text-xs text-muted-foreground">
            Your page will be at{" "}
            <span className="font-medium text-accent">
              {slug}.prewaitlist.com
            </span>{" "}
            — you can change this anytime in Settings.
          </p>
        )}
      </div>

      {/* Submit button + I'll name it later */}
      <div className="sticky bottom-0 flex flex-col items-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        {submitError && (
          <p className="mb-3 text-sm text-destructive">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
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
