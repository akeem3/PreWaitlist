"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "../ui/spinner";

interface Question {
  id: string;
  text: string;
  type: "free_text";
}

interface EmailCaptureFormProps {
  waitlistId: string;
  subdomain: string;
  ctaText: string;
  brandColor: string;
  template: "minimal" | "bold" | "dark";
  tier: "free" | "pro" | "growth";
  questions: Question[];
  qualificationEnabled: boolean;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const MAX_QUESTIONS: Record<string, number> = {
  free: 2,
  pro: 5,
  growth: Infinity,
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
  const referrerId = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        waitlist_id: waitlistId,
        email: email.trim().toLowerCase(),
      };

      if (referrerId) {
        body.referrer_id = referrerId;
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
  const inputHeight = isBold ? "h-11" : "h-10";
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
  const btnHeight = isBold ? "h-11" : "h-10";
  const btnPadding = isBold ? "px-7" : "px-4";
  const btnText = isBold ? "text-base font-semibold" : "text-sm font-medium";
  const cardBorder = isBold
    ? "border-2 border-foreground"
    : isDark
      ? "border border-dark-template-border"
      : "border border-border";
  const cardText = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";
  const cardGap = isBold ? "gap-2.5" : "gap-2";

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
            aria-invalid={!!emailError}
            className={`${inputHeight} w-full rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none focus-visible:border-[var(--input-border-color-focus)] disabled:cursor-not-allowed disabled:opacity-50`}
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-destructive" role="alert">
              {emailError}
            </p>
          )}

          <div className={`flex flex-col ${cardGap} mt-4`}>
            {visibleQuestions.map((q) => (
              <div
                key={q.id}
                className={`flex justify-between items-center rounded-[var(--radius-md)] ${cardBorder} px-3.5 py-2.5 ${textSize} ${cardText}`}
              >
                <span>
                  {q.text.trim().endsWith("?")
                    ? q.text.trim()
                    : `${q.text.trim()}?`}
                </span>
                <span className={`text-xs ${cardText}`}>(optional)</span>
              </div>
            ))}
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
        </>
      ) : (
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
            aria-invalid={!!emailError}
            className={`${inputHeight} flex-1 min-w-0 rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none focus-visible:border-[var(--input-border-color-focus)] disabled:cursor-not-allowed disabled:opacity-50`}
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
      )}

      {apiError && (
        <p className="text-xs text-destructive mt-2" role="alert">
          {apiError}
        </p>
      )}
    </form>
  );
}
