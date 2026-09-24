"use client";

import { useCallback } from "react";
import { getTierLimits, type Tier } from "@/lib/tier-gating";

export interface Question {
  id?: string;
  text: string;
  type: "free_text" | "multiple_choice";
  options?: string[] | null;
}

export function makeQuestion(): Question {
  return { text: "", type: "free_text", options: null };
}

/**
 * Drop questions with empty text and trim MC options. Mirrors the pre-14.2
 * submit-time sanitation in onboarding step 4a — single shared implementation.
 */
export function sanitizeQuestions(questions: Question[]): Question[] {
  return questions
    .filter((q) => q.text.trim().length > 0)
    .map((q) => {
      if (q.type === "multiple_choice") {
        const options = (q.options || [])
          .map((o) => o.trim())
          .filter((o) => o.length > 0);
        return { ...q, options };
      }
      return { ...q, options: null };
    });
}

/**
 * Validate before save. Returns an existing user-facing error message, or
 * null when the list is valid.
 */
export function validateQuestions(questions: Question[]): string | null {
  const hasAtLeastOneQuestion = questions.some((q) => q.text.trim().length > 0);
  if (!hasAtLeastOneQuestion) {
    return "Add at least one question before continuing.";
  }
  const sanitized = sanitizeQuestions(questions);
  if (
    sanitized.some(
      (q) => q.type === "multiple_choice" && (q.options || []).length < 2
    )
  ) {
    return "Multiple choice questions need at least 2 options.";
  }
  return null;
}

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  tier: string;
  onUpgrade: () => void;
  disabled?: boolean;
}

function normalizeTier(tier: string): Tier {
  return tier === "pro" ? "pro" : "free";
}

export default function QuestionEditor({
  questions,
  onChange,
  tier,
  onUpgrade,
  disabled = false,
}: QuestionEditorProps) {
  const maxQuestions = getTierLimits(normalizeTier(tier)).maxQuestions;
  const atCap = questions.length >= maxQuestions;

  const update = useCallback(
    (next: Question[]) => {
      onChange(next);
    },
    [onChange]
  );

  const handleAddQuestion = useCallback(() => {
    if (atCap) return;
    update([...questions, makeQuestion()]);
  }, [atCap, questions, update]);

  const handleRemoveQuestion = useCallback(
    (index: number) => {
      const next = questions.filter((_, i) => i !== index);
      update(next.length > 0 ? next : [makeQuestion()]);
    },
    [questions, update]
  );

  const handleUpdateQuestion = useCallback(
    (index: number, value: string) => {
      update(
        questions.map((q, i) => (i === index ? { ...q, text: value } : q))
      );
    },
    [questions, update]
  );

  const handleSetType = useCallback(
    (index: number, type: "free_text" | "multiple_choice") => {
      update(
        questions.map((q, i) => {
          if (i !== index) return q;
          if (type === "multiple_choice") {
            const existing =
              Array.isArray(q.options) && q.options.length >= 2
                ? q.options
                : ["", ""];
            return { ...q, type, options: existing };
          }
          return { ...q, type, options: null };
        })
      );
    },
    [questions, update]
  );

  const handleUpdateOption = useCallback(
    (questionIndex: number, optionIndex: number, value: string) => {
      update(
        questions.map((q, i) => {
          if (i !== questionIndex || !Array.isArray(q.options)) return q;
          const options = [...q.options];
          options[optionIndex] = value;
          return { ...q, options };
        })
      );
    },
    [questions, update]
  );

  const handleAddOption = useCallback(
    (questionIndex: number) => {
      update(
        questions.map((q, i) => {
          if (i !== questionIndex) return q;
          const options = Array.isArray(q.options) ? [...q.options] : [];
          options.push("");
          return { ...q, options };
        })
      );
    },
    [questions, update]
  );

  const handleRemoveOption = useCallback(
    (questionIndex: number, optionIndex: number) => {
      update(
        questions.map((q, i) => {
          if (i !== questionIndex || !Array.isArray(q.options)) return q;
          return {
            ...q,
            options: q.options.filter((_, oi) => oi !== optionIndex),
          };
        })
      );
    },
    [questions, update]
  );

  const tierBadgeLabel =
    tier === "pro" ? "PRO — 5 questions max" : "FREE — 2 questions max";

  return (
    <>
      <div className="mb-6">
        <span className="inline-flex items-center rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          {tierBadgeLabel}
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
                  onClick={() => handleRemoveQuestion(index)}
                  disabled={disabled}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove question ${index + 1}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder='e.g. "What are you currently using?"'
              value={question.text}
              onChange={(e) => handleUpdateQuestion(index, e.target.value)}
              disabled={disabled}
              className="flex h-10 w-full rounded-[var(--input-radius)] border border-border bg-card px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            />

            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label={`Question ${index + 1} type`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={question.type === "free_text"}
                onClick={() => handleSetType(index, "free_text")}
                disabled={disabled}
                className={`flex-1 rounded-[var(--input-radius)] border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  question.type === "free_text"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-accent/40"
                }`}
              >
                Free text
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={question.type === "multiple_choice"}
                onClick={() => handleSetType(index, "multiple_choice")}
                disabled={disabled}
                className={`flex-1 rounded-[var(--input-radius)] border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  question.type === "multiple_choice"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-accent/40"
                }`}
              >
                Multiple choice
              </button>
            </div>

            {question.type === "multiple_choice" && (
              <div className="flex flex-col gap-2">
                {(question.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) =>
                        handleUpdateOption(index, optionIndex, e.target.value)
                      }
                      disabled={disabled}
                      aria-label={`Option ${optionIndex + 1} for question ${index + 1}`}
                      className="flex h-10 w-full rounded-[var(--input-radius)] border border-border bg-card px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {(question.options || []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index, optionIndex)}
                        disabled={disabled}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove option ${optionIndex + 1}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddOption(index)}
                  disabled={disabled || (question.options || []).length >= 10}
                  className="flex items-center justify-center gap-1.5 rounded-[var(--input-radius)] border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add option
                </button>
              </div>
            )}

            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>
        ))}

        {!atCap ? (
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={disabled}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add new question
          </button>
        ) : (
          <button
            type="button"
            onClick={onUpgrade}
            disabled={disabled}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent bg-accent/5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upgrade to add more questions
          </button>
        )}
      </div>
    </>
  );
}
