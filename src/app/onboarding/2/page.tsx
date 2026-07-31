"use client";

import { useCallback, useState } from "react";
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
    description: "Clean and simple. Let your product speak for itself.",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Make a statement with strong typography and presence.",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Sleek and modern. Perfect for developer tools.",
  },
];

function MiniPreview({ template }: { template: Template }) {
  if (template === "minimal") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 bg-white p-2">
        <div className="h-2 w-12 rounded bg-muted" />
        <div className="h-1.5 w-8 rounded bg-muted-foreground/30" />
        <div className="mt-1 h-3 w-10 rounded bg-accent" />
      </div>
    );
  }

  if (template === "bold") {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 bg-white p-2">
        <div className="h-3 w-14 rounded-sm bg-foreground" />
        <div className="h-1.5 w-10 rounded bg-muted-foreground/30" />
        <div className="mt-1 h-3.5 w-12 rounded bg-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 bg-[#1C1917] p-2">
      <div className="h-2 w-12 rounded bg-white/90" />
      <div className="h-1.5 w-8 rounded bg-white/40" />
      <div className="mt-1 h-3 w-10 rounded bg-accent" />
    </div>
  );
}

export default function OnboardingStep2() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [selected, setSelected] = useState<Template>(form.template);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <h1 className="mb-1 text-h2">How should it look?</h1>
      <p className="mb-8 text-body-lg text-muted-foreground">
        Pick a starting point. You can customise everything later.
      </p>

      <div className="flex flex-col gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelect(template.id)}
            disabled={isSubmitting}
            className={`flex w-full items-center rounded-[var(--radius-lg)] border bg-card p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected === template.id
                ? "border-2 border-accent"
                : "border border-border"
            }`}
            style={{ height: 123 }}
          >
            <div
              className="mr-4 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border"
              style={{ width: 137, height: 95 }}
            >
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

      <div className="sticky bottom-0 mt-8 flex justify-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={!selected || isSubmitting}
          className="inline-flex h-[59px] w-[458px] items-center justify-center rounded-[var(--radius-md)] bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span>Next →</span>
          )}
        </button>
      </div>
    </form>
  );
}
