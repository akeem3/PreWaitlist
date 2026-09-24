"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnboardingForm } from "../context";
import { useOnboardingUpgrade } from "../onboarding-client-layout";
import QuestionEditor, {
  makeQuestion,
  sanitizeQuestions,
  validateQuestions,
  type Question,
} from "../../../../components/onboarding/question-editor";

export default function OnboardingStep4a() {
  const router = useRouter();
  const form = useOnboardingForm();
  const upgrade = useOnboardingUpgrade();
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (form.questions.length > 0) {
      const filtered = form.questions.filter((q) => q.text.trim().length > 0);
      return filtered.length > 0 ? filtered : [makeQuestion()];
    }
    return [makeQuestion()];
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

  const hasAtLeastOneQuestion = questions.some((q) => q.text.trim().length > 0);

  const handleQuestionsChange = useCallback(
    (next: Question[]) => {
      setQuestions(next);
      if (error) setError(null);
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      const validationError = validateQuestions(questions);
      if (validationError) {
        setError(validationError);
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

        const validQuestions = sanitizeQuestions(questions);

        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            waitlist_id: waitlistId,
            questions: validQuestions,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Failed to save questions");
        }

        form.updateField("questions", validQuestions);
        router.push("/onboarding/5");
      } catch (err) {
        setIsSubmitting(false);
        form.setLoading(false);
        setError(
          err instanceof Error ? err.message : "Failed to save questions"
        );
      }
    },
    [isSubmitting, form, questions, router]
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

      <QuestionEditor
        questions={questions}
        onChange={handleQuestionsChange}
        tier={form.tier}
        onUpgrade={() => upgrade?.triggerUpgrade("qual_question")}
        disabled={isSubmitting}
      />

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
