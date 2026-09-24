"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "../ui/spinner";
import { getTierLimits, type Tier } from "../../src/lib/tier-gating";

interface Question {
  id: string;
  text: string;
  type: "free_text" | "multiple_choice";
  options: string[] | null;
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
  subscriberCount?: number;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function EmailCaptureForm({
  waitlistId,
  subdomain,
  ctaText,
  brandColor,
  template,
  tier,
  questions,
  qualificationEnabled,
  subscriberCount = 0,
}: EmailCaptureFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const isDark = template === "dark";
  const isBold = template === "bold";

  // 500 cap logic — Free tier only
  const CAP_LIMIT = 500;
  const isFree = tier === "free";
  const capReached = isFree && subscriberCount >= CAP_LIMIT;
  const capWarningHigh = isFree && subscriberCount >= CAP_LIMIT * 0.96; // 480+
  const capWarningMedium = isFree && subscriberCount >= CAP_LIMIT * 0.8; // 400+

  const visibleQuestions = qualificationEnabled
    ? questions
        .filter((q) => q.text.trim().length > 0)
        .slice(0, getTierLimits(tier as Tier).maxQuestions)
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

  return (
    <div className="w-full max-w-md mt-2">
      {capReached ? (
        <div
          className={`rounded-[var(--input-radius)] border px-4 py-6 text-center ${
            isDark
              ? "border-dark-template-border bg-dark-template-input"
              : "border-border bg-card"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isDark ? "text-dark-template-text" : "text-foreground"
            }`}
          >
            This waitlist has reached its subscriber limit.
          </p>
          <p
            className={`mt-1 text-xs ${
              isDark ? "text-dark-template-muted" : "text-muted-foreground"
            }`}
          >
            Please check back later.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full">
          {capWarningHigh && (
            <div
              className={`mb-3 rounded-[var(--input-radius)] border px-3 py-2 text-xs ${
                isDark
                  ? "border-dark-template-border bg-dark-template-input text-dark-template-muted"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}
            >
              Almost full — {subscriberCount} of {CAP_LIMIT} spots claimed.
              Upgrade to Pro for unlimited signups.
            </div>
          )}
          {!capWarningHigh && capWarningMedium && (
            <div
              className={`mb-3 rounded-[var(--input-radius)] border px-3 py-2 text-xs ${
                isDark
                  ? "border-dark-template-border bg-dark-template-input text-dark-template-muted"
                  : "border-accent/30 bg-accent/5 text-accent"
              }`}
            >
              Filling up — {subscriberCount} of {CAP_LIMIT} spots claimed.
            </div>
          )}
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
                {visibleQuestions.map((q) => (
                  <div key={q.id} className="relative">
                    {q.type === "multiple_choice" && q.options?.length ? (
                      <fieldset className="rounded-[var(--input-radius)] border border-border bg-card px-3 py-2.5">
                        <legend className="sr-only">{q.text}</legend>
                        <p className="text-sm text-foreground mb-2">
                          {q.text.trim().endsWith("?")
                            ? q.text.trim()
                            : `${q.text.trim()}?`}
                          <span className="ml-1 text-muted-foreground">
                            (optional)
                          </span>
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {q.options.map((opt) => (
                            <label
                              key={opt}
                              className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: opt,
                                  }))
                                }
                                disabled={loading}
                                className="accent-[var(--brand-color)]"
                                style={
                                  {
                                    "--brand-color": brandColor,
                                  } as React.CSSProperties
                                }
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder={
                            q.text.trim().endsWith("?")
                              ? q.text.trim()
                              : `${q.text.trim()}?`
                          }
                          value={answers[q.id] || ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          disabled={loading}
                          aria-label={q.text}
                          className={`${inputHeight} w-full rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 pr-16`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          (optional)
                        </span>
                      </>
                    )}
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
      )}
    </div>
  );
}
