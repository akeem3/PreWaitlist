"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnboardingForm } from "../context";

type Choice = "yes" | "no" | null;

function ShieldIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 3L5 8V15C5 21.6 9.7 27.7 16 29C22.3 27.7 27 21.6 27 15V8L16 3Z"
        fill="#0F7A5E"
        fillOpacity="0.12"
      />
      <path
        d="M16 3L5 8V15C5 21.6 9.7 27.7 16 29C22.3 27.7 27 21.6 27 15V8L16 3Z"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 16L15 19L21 13"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SimpleIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="11" stroke="#C3C2C2" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="1.5" fill="#C3C2C2" />
      <circle cx="16" cy="14" r="1.5" fill="#C3C2C2" />
      <circle cx="20" cy="14" r="1.5" fill="#C3C2C2" />
      <circle cx="12" cy="19" r="1.5" fill="#C3C2C2" />
      <circle cx="16" cy="19" r="1.5" fill="#C3C2C2" />
      <circle cx="20" cy="19" r="1.5" fill="#C3C2C2" />
    </svg>
  );
}

export default function OnboardingStep4() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [selected, setSelected] = useState<Choice>(null);
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selected || isSubmitting) return;

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.waitlistId,
            qualification_enabled: selected === "yes",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(
            error.error || "Failed to save qualification decision"
          );
        }

        form.updateField("qualificationEnabled", selected === "yes");

        if (selected === "yes") {
          router.push("/onboarding/4a");
        } else {
          router.push("/onboarding/5");
        }
      } catch (err) {
        console.error("Qualification decision error:", err);
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [selected, isSubmitting, form, router]
  );

  const handleSelect = useCallback((choice: Choice) => {
    setSelected(choice);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      {/* Page header */}
      <div className="mb-2 w-full text-center">
        <p className="text-xs font-medium text-accent">Step 4 of 5</p>
        <p className="text-sm text-muted-foreground">Qualification decision</p>
      </div>

      <h1 className="mb-8 w-full text-center text-h2">
        Want to add qualification questions?
      </h1>

      {/* Two cards side by side */}
      <div className="mb-8 flex w-full flex-col gap-4 md:flex-row md:gap-6">
        {/* Yes card */}
        <button
          type="button"
          onClick={() => handleSelect("yes")}
          disabled={isSubmitting}
          className={`flex flex-1 items-start gap-4 rounded-lg border bg-card p-6 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            selected === "yes"
              ? "border-2 border-accent"
              : "border border-border"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            <ShieldIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Yes, add questions
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add 1-5 questions to learn about your signups.
            </p>
          </div>
        </button>

        {/* No card */}
        <button
          type="button"
          onClick={() => handleSelect("no")}
          disabled={isSubmitting}
          className={`flex flex-1 items-start gap-4 rounded-lg border bg-card p-6 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            selected === "no"
              ? "border-2 border-accent"
              : "border border-border"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            <SimpleIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No, keep it simple
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Just email. Add questions later from settings.
            </p>
          </div>
        </button>
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 flex w-full flex-col items-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={!selected || isSubmitting}
          className="inline-flex h-14.75 w-114.5 items-center justify-center rounded-(--radius-md) bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span>Next →</span>
          )}
        </button>

        <Link
          href="/onboarding/3"
          className="mt-4 inline-flex items-center gap-1 text-body-sm text-muted-foreground transition-colors duration-normal hover:text-foreground"
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
