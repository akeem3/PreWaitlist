"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "../ui/spinner";

interface Question {
  text: string;
  required: boolean;
}

interface EmailCaptureFormProps {
  waitlistId: string;
  subdomain: string;
  ctaText: string;
  brandColor: string;
  template: "minimal" | "bold" | "dark";
  tier: "free" | "pro";
  questions: Question[];
  qualificationEnabled: boolean;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const MAX_QUESTIONS: Record<string, number> = {
  free: 2,
  pro: 5,
};

export function EmailCaptureForm({
  waitlistId,
  subdomain,
  ctaText,
  brandColor,
  template,
  tier,
  questions,
  qualificationEnabled,
}: EmailCaptureFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const isDark = template === "dark";
  const isBold = template === "bold";

  const visibleQuestions = qualificationEnabled
    ? questions
        .filter((q) => q.text.trim().length > 0)
        .slice(0, MAX_QUESTIONS[tier] || 2)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError(null);
    setApiError(null);
    setConsentError(false);

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!consent) {
      setConsentError(true);
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        waitlist_id: waitlistId,
        email: email.trim().toLowerCase(),
        consent: true,
      };

      if (referralCode) {
        body.referral_code = referralCode;
      }

      const filledAnswers = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v.trim().length > 0)
      );
      if (Object.keys(filledAnswers).length > 0) {
        body.qual_answers = filledAnswers;
      }

      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 409) {
        setApiError("This email is already on the waitlist");
        return;
      }

      if (!res.ok) {
        setApiError("Something went wrong. Please try again.");
        return;
      }

      router.push(
        `/${subdomain}/thank-you?subscriber_id=${data.id}&referral_code=${data.referral_code}`
      );
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasQuestions = visibleQuestions.length > 0;

  // Template-specific styling to match onboarding preview exactly
  const inputHeight = "h-10";
  const inputBorder = isBold
    ? "border-2 border-foreground"
    : isDark
      ? "border border-dark-template-border"
      : "border border-border";
  const inputBg = isDark ? "bg-dark-template-input" : "bg-card";
  const inputText = isDark ? "text-dark-template-text" : "text-foreground";
  const inputPlaceholder = isDark
    ? "placeholder:text-dark-template-muted"
    : "placeholder:text-muted-foreground";
  const textSize = isBold ? "text-base" : "text-sm";
  const btnHeight = "h-10";
  const btnPadding = isBold ? "px-7" : "px-4";
  const btnText = isBold ? "text-base font-semibold" : "text-sm font-medium";

  const consentLabel = isDark
    ? "text-dark-template-secondary"
    : "text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mt-2">
      {hasQuestions ? (
        <>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (apiError) setApiError(null);
              if (emailError) setEmailError(null);
            }}
            disabled={loading}
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={!!emailError}
            className={`${inputHeight} w-full rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50`}
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-destructive" role="alert">
              {emailError}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {visibleQuestions.map((q, i) => (
              <div key={i} className="relative">
                <input
                  type="text"
                  placeholder={
                    q.text.trim().endsWith("?")
                      ? q.text.trim()
                      : `${q.text.trim()}?`
                  }
                  value={answers[q.text] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.text]: e.target.value,
                    }))
                  }
                  disabled={loading}
                  aria-label={q.text}
                  className={`${inputHeight} w-full rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 pr-16`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-status-warm pointer-events-none">
                  (optional)
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setConsentError(false);
                }}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-border accent-accent"
              />
              <span className={`text-xs ${consentLabel}`}>
                I agree to receive email updates about this product. You can
                unsubscribe at any time.
              </span>
            </label>
            {consentError && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                You must agree to receive emails to join the waitlist.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: brandColor }}
            className={`inline-flex items-center justify-center ${btnHeight} w-full ${btnPadding} rounded-[var(--button-radius)] ${btnText} text-white transition-colors mt-4 disabled:pointer-events-none disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Joining...
              </span>
            ) : (
              ctaText || "Join Waitlist"
            )}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            No spam. Unsubscribe anytime.
          </p>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (apiError) setApiError(null);
                if (emailError) setEmailError(null);
              }}
              disabled={loading}
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={!!emailError}
              className={`${inputHeight} flex-1 min-w-0 rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50`}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: brandColor }}
              className={`inline-flex items-center justify-center ${btnHeight} ${btnPadding} rounded-[var(--button-radius)] ${btnText} text-white transition-colors whitespace-nowrap disabled:pointer-events-none disabled:opacity-50`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Joining...
                </span>
              ) : (
                ctaText || "Join Waitlist"
              )}
            </button>
          </div>

          <div className="mt-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setConsentError(false);
                }}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-border accent-accent"
              />
              <span className={`text-xs ${consentLabel}`}>
                I agree to receive email updates about this product. You can
                unsubscribe at any time.
              </span>
            </label>
            {consentError && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                You must agree to receive emails to join the waitlist.
              </p>
            )}
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            No spam. Unsubscribe anytime.
          </p>
        </>
      )}

      {apiError && (
        <p className="text-xs text-destructive mt-2" role="alert">
          {apiError}
        </p>
      )}
    </form>
  );
}
