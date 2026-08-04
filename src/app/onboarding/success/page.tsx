"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOnboardingForm } from "../context";
import MetaPreview from "../../../../components/onboarding/meta-preview";

export default function OnboardingSuccess() {
  const form = useOnboardingForm();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveUrl = form.slug
    ? `${form.slug}.prewaitlist.com`
    : "your-waitlist.prewaitlist.com";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${liveUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ url: `https://${liveUrl}` });
    } catch {
      // User cancelled
    }
  }

  return (
    <div className="-mt-14 flex min-h-dvh flex-col items-center overflow-hidden px-6 pb-8 pt-14 text-center">
      {/* Green checkmark */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M8 16L14 22L24 10"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="mb-2 text-h1">Your waitlist is live!</h1>

      {/* URL + copy link pill */}
      <div className="mb-4 flex items-center gap-3">
        <span className="font-medium text-foreground">{liveUrl}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          {copied ? "Copied!" : "copy link"}
        </button>
      </div>

      {/* Share card */}
      <div className="mb-4 w-full max-w-lg rounded-xl border border-border p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Share it now while the momentum is fresh
        </p>

        {/* Meta Preview */}
        <div className="mb-4">
          <MetaPreview
            headline={form.headline}
            subheadline={form.subheadline}
            ctaText={form.ctaText}
            slug={form.slug}
          />
        </div>

        {/* Share + Copy buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-lg bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-lg border border-foreground py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Copy link
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-4 w-full max-w-lg border-t border-border" />

      {/* What will happen next */}
      <div className="mb-4 w-full max-w-lg">
        <p className="mb-3 text-center text-sm font-medium text-foreground">
          What will happen next?
        </p>
        <ol className="list-inside list-decimal space-y-1.5 text-center text-sm text-muted-foreground">
          <li>
            Share the link — your first signups will come in the next 24 hours
          </li>
          <li>
            Your dashboard tracks who signs up, their warmth, and referral
            quality
          </li>
          <li>
            Come back before launch to see who&apos;s still paying attention
          </li>
        </ol>
      </div>

      {/* Dashboard link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm !font-semibold text-accent transition-colors hover:text-accent-hover"
      >
        Or, go to my dashboard
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8H13M13 8L9 4M13 8L9 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
