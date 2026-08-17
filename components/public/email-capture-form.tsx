"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
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
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const isDark = template === "dark";
  const isBold = template === "bold";

  const visibleQuestions = qualificationEnabled
    ? questions.slice(0, MAX_QUESTIONS[tier] || 2)
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
      const qualAnswers = Object.fromEntries(
        Object.entries(answers).filter(([, value]) => value.trim() !== "")
      );

      const body: Record<string, unknown> = {
        waitlist_id: waitlistId,
        email: email.trim().toLowerCase(),
      };

      if (referrerId) {
        body.referrer_id = referrerId;
      }

      if (Object.keys(qualAnswers).length > 0) {
        body.qual_answers = qualAnswers;
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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mt-2">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (apiError) setApiError(null);
          }}
          error={emailError || undefined}
          disabled={loading}
          autoComplete="email"
          className={`flex-1 min-w-0 ${
            isDark
              ? "border-dark-template-border bg-dark-template-input text-dark-template-foreground"
              : isBold
                ? "border-foreground"
                : "border-border bg-card text-foreground"
          }`}
        />
        <Button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: brandColor }}
          className="text-white whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              Joining...
            </span>
          ) : (
            ctaText || "Join Waitlist"
          )}
        </Button>
      </div>

      {apiError && (
        <p className="text-xs text-error mt-2" role="alert">
          {apiError}
        </p>
      )}

      {visibleQuestions.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {visibleQuestions.map((q) => (
            <div key={q.id}>
              <label className="text-sm font-medium text-foreground">
                {q.text}
                <span className="text-caption text-muted-foreground ml-1">
                  (optional)
                </span>
              </label>
              <Input
                type="text"
                placeholder={q.text}
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
                disabled={loading}
                className={
                  isDark
                    ? "border-dark-template-border bg-dark-template-input text-dark-template-foreground"
                    : isBold
                      ? "border-foreground"
                      : "border-border bg-card text-foreground"
                }
              />
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
