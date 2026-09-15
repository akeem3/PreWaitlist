"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnboardingForm } from "../context";

interface Question {
  text: string;
  required: boolean;
}

function get_max_questions(tier: string): number {
  switch (tier) {
    case "pro":
      return 5;
    default:
      return 2;
  }
}

export default function OnboardingStep4a() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (form.questions.length > 0) {
      const filtered = form.questions.filter((q) => q.text.trim().length > 0);
      return filtered.length > 0 ? filtered : [{ text: "", required: false }];
    }
    return [{ text: "", required: false }];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    form.updateField("questions", questions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const max_questions = get_max_questions(form.tier);
  const at_cap = questions.length >= max_questions;
  const hasAtLeastOneQuestion = questions.some((q) => q.text.trim().length > 0);

  const handle_add_question = useCallback(() => {
    if (at_cap) return;
    setQuestions((prev) => [...prev, { text: "", required: false }]);
  }, [at_cap]);

  const handle_remove_question = useCallback((index: number) => {
    setQuestions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ text: "", required: false }];
    });
  }, []);

  const handle_update_question = useCallback(
    (index: number, value: string) => {
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === index ? { text: value, required: q.required } : q
        )
      );
      if (error) setError(null);
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (!hasAtLeastOneQuestion) {
        setError("Add at least one question before continuing.");
        return;
      }

      setIsSubmitting(true);
      form.setLoading(true);
      setError(null);

      try {
        const waitlistId = form.waitlistId;
        if (!waitlistId) {
          router.replace("/onboarding/1");
          return;
        }

        const validQuestions = questions.filter(
          (q) => q.text.trim().length > 0
        );

        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            waitlist_id: waitlistId,
            questions: validQuestions,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save questions");
        }

        form.updateField("questions", validQuestions);
        router.push("/onboarding/5");
      } catch {
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [isSubmitting, form, questions, router, hasAtLeastOneQuestion]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="mb-2">
        <p className="text-xs font-medium text-accent">Step 4 of 5</p>
        <p className="text-sm text-muted-foreground">Qualification questions</p>
      </div>

      <h1 className="mb-2 text-h2">Qualify your leads</h1>
      <p className="mb-6 text-body text-muted-foreground">
        Ask questions to understand who&apos;s serious about your product.
      </p>

      <div className="mb-6">
        <span className="inline-flex items-center rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          FREE — 2 questions max
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        {questions.map((question, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Question {index + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handle_remove_question(index)}
                  disabled={isSubmitting}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove question ${index + 1}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder='e.g. "What are you currently using?"'
              value={question.text}
              onChange={(e) => handle_update_question(index, e.target.value)}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-[var(--input-radius)] border border-border bg-card px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>
        ))}

        {questions.length < max_questions ? (
          <button
            type="button"
            onClick={handle_add_question}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add new question
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/dashboard?upgrade=true")}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent bg-accent/5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upgrade to add more questions
          </button>
        )}
      </div>

      <div className="sticky bottom-0 flex w-full flex-col gap-4 bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !hasAtLeastOneQuestion}
          className="inline-flex h-14.75 w-full items-center justify-center rounded-[13px] bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50 md:w-114.5"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span>Next →</span>
          )}
        </button>

        <Link
          href="/onboarding/4"
          className="inline-flex items-center justify-center gap-1 text-body-sm text-muted-foreground transition-colors duration-normal hover:text-foreground"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>
      </div>
    </form>
  );
}
