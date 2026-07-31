"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboardingForm } from "../context";

type Template = "minimal" | "bold" | "dark";

interface TemplateOption {
  id: Template;
  name: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean • white bg",
  },
  {
    id: "bold",
    name: "Bold",
    description: "High contrast",
  },
  {
    id: "dark",
    name: "Dark",
    description: "High contrast",
  },
];

function MiniPreview({ template }: { template: Template }) {
  if (template === "minimal") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-card p-2">
        <div className="h-2 w-12 rounded bg-muted" />
        <div className="h-1.5 w-8 rounded bg-muted-foreground/30" />
        <div className="mt-1 h-3 w-10 rounded border border-border bg-transparent" />
      </div>
    );
  }

  if (template === "bold") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card p-2">
        <div className="h-3 w-16 rounded-sm bg-foreground" />
        <div className="mt-0.5 h-1.5 w-10 rounded bg-muted-foreground/30" />
        <div className="mt-1 h-3.5 w-12 rounded bg-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-dark-template-bg p-2">
      <div className="h-2 w-12 rounded bg-dark-template-text" />
      <div className="h-1.5 w-8 rounded bg-dark-template-muted" />
      <div className="mt-1 h-3 w-10 rounded bg-accent" />
    </div>
  );
}

export default function OnboardingStep2() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [selected, setSelected] = useState<Template>(form.template);
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
            template: selected,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save template");
        }

        form.updateField("template", selected);
        router.push("/onboarding/3");
      } catch {
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [selected, isSubmitting, form, router]
  );

  const handleSelect = useCallback(
    (template: Template) => {
      setSelected(template);
      form.updateField("template", template);
    },
    [form]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="mb-2">
        <p className="text-xs font-medium text-accent">Step 2 of 5</p>
        <p className="text-sm text-muted-foreground">Choose a template</p>
      </div>

      <h1 className="mb-8 text-h2">How should your page look?</h1>

      <div className="flex flex-col gap-[30px]">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelect(template.id)}
            disabled={isSubmitting}
            className={`flex h-[123px] w-full items-center rounded-[23px] border bg-card p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected === template.id
                ? "border-2 border-accent"
                : "border border-border"
            }`}
          >
            <div className="mr-4 h-[95px] w-[137px] shrink-0 overflow-hidden rounded-[16px] border border-border">
              <MiniPreview template={template.id} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-foreground">
                {template.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="sticky bottom-0 mt-8 flex flex-col items-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
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
          href="/onboarding/1"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline-block"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </Link>
      </div>
    </form>
  );
}
