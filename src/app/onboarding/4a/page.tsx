"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnboardingForm } from "../context";
import { Input } from "../../../../components/ui/input";

interface Question {
  text: string;
  required: boolean;
}

function get_max_questions(tier: string): number {
  switch (tier) {
    case "pro":
      return 5;
    case "growth":
      return Infinity;
    default:
      return 2;
  }
}

export default function OnboardingStep4a() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [questions, setQuestions] = useState<Question[]>(
    form.questions.length > 0
      ? form.questions
      : [
          { text: "", required: false },
          { text: "", required: false },
        ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.waitlistId) {
      router.replace("/onboarding/1");
    }
  }, [form.waitlistId, router]);

  useEffect(() => {
    form.updateField("questions", questions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const max_questions = get_max_questions(form.tier);
  const at_cap = questions.length >= max_questions;

  const handle_add_question = useCallback(() => {
    if (at_cap) {
      router.push("/dashboard?upgrade=true");
      return;
    }
    setQuestions((prev) => [...prev, { text: "", required: false }]);
  }, [at_cap, router]);

  const handle_update_question = useCallback(
    (index: number, field: keyof Question, value: string | boolean) => {
      setQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
      );
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.waitlistId,
            questions: questions,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save questions");
        }

        form.updateField("questions", questions);
        router.push("/onboarding/5");
      } catch {
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [isSubmitting, form, questions, router]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Page header */}
      <div className="mb-2">
        <p className="text-xs font-medium text-accent">Step 4 of 5</p>
        <p className="text-sm text-muted-foreground">Name your waitlist</p>
      </div>

      <h1 className="mb-2 text-h2">What are you building?</h1>
      <p className="mb-6 text-body text-muted-foreground">
        Your page goes live as you type.
      </p>

      {/* Tier badge */}
      <div className="mb-6">
        <span className="inline-flex items-center rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          FREE — 2 questions max
        </span>
      </div>

      {/* Questions list */}
      <div className="mb-6 flex flex-col gap-4">
        {questions.map((question, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <span className="text-sm font-medium text-foreground">
              Question {index + 1}
            </span>
            <Input
              placeholder="Type your question..."
              value={question.text}
              onChange={(e) =>
                handle_update_question(index, "text", e.target.value)
              }
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2">
              <select
                value={question.required ? "required" : "optional"}
                onChange={(e) =>
                  handle_update_question(
                    index,
                    "required",
                    e.target.value === "required"
                  )
                }
                disabled={isSubmitting}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="optional">Multiple Choice</option>
                <option value="required">Free Text</option>
              </select>
            </div>
          </div>
        ))}

        {/* Add question button — always clickable, triggers upgrade flow at cap */}
        <button
          type="button"
          onClick={handle_add_question}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add new question — Upgrade to Pro for up to 5 →
        </button>
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 flex w-full flex-col gap-4 bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14.75 w-full items-center justify-center rounded--md bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50 md:w-114.5"
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
