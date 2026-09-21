"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnboardingForm } from "../context";
import { useOnboardingUpgrade } from "../onboarding-client-layout";
import { isPro as checkIsPro } from "../../../lib/tier-gating";
import { Input } from "../../../../components/ui/input";
import {
  EmailTokenEditor,
  type EmailTokenEditorHandle,
} from "../../../../components/onboarding/email-token-editor";
import { VariablePicker } from "../../../../components/onboarding/variable-picker";

export default function OnboardingStep5() {
  const router = useRouter();
  const form = useOnboardingForm();
  const upgrade = useOnboardingUpgrade();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const subjectEditorRef = useRef<EmailTokenEditorHandle>(null);
  const bodyEditorRef = useRef<EmailTokenEditorHandle>(null);

  const isPro = checkIsPro(form.tier);

  useEffect(() => {
    form.setLoading(false);

    // Scaffold empty email fields with sensible defaults so founders
    // don't start from a blank page. If fields are already filled
    // (e.g. they navigated back), leave them alone.
    if (!form.emailSenderName && form.headline) {
      form.updateField("emailSenderName", form.headline);
    }
    if (!form.emailSubject) {
      form.updateField(
        "emailSubject",
        "You're {{position}} in line for {{product_name}}"
      );
    }
    if (!form.emailBody) {
      form.updateField(
        "emailBody",
        "Hi {{first_name}},\n\nWelcome to {{product_name}}. You're on the list!\n\nYour position is #{{position}}. Share your referral link to move up:\n\n{{referral_link}}\n\nThe earlier you sign up, the higher your position."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLaunch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        // FlushGate already resolved server state — waitlistId is guaranteed
        const waitlistId = form.waitlistId;
        if (!waitlistId) {
          router.replace("/onboarding/1");
          return;
        }

        if (!form.slug) {
          const fallback = crypto.randomUUID().slice(0, 8);
          form.updateField("slug", fallback);
        }

        const slug = form.slug || crypto.randomUUID().slice(0, 8);

        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            waitlist_id: waitlistId,
            subdomain: slug,
            email_sender_name: form.emailSenderName,
            email_subject: form.emailSubject,
            email_body: form.emailBody,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to launch waitlist");
        }

        router.push("/onboarding/success");
      } catch {
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [isSubmitting, form, router]
  );

  return (
    <form onSubmit={handleLaunch} className="flex flex-col">
      {/* Page header */}
      <div className="mb-1 text-center">
        <p className="text-xs font-medium text-accent">Step 5 of 5</p>
        <p className="text-sm text-muted-foreground">
          Set up your confirmation email
        </p>
      </div>

      <h1 className="mb-1 text-center text-h2">
        Your subscribers get a confirmation email
      </h1>
      <p className="mb-4 text-center text-body text-muted-foreground">
        it includes their position and referral link automatically
      </p>

      {/* Free tier — comparison card + email mock */}
      {!isPro && (
        <div className="mb-4 flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              What your subscribers receive
            </h3>

            {/* Email mock */}
            <div className="rounded-lg border border-border bg-background p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">From:</span>{" "}
                  {form.headline || "Your Product"} via PreWaitlist
                </p>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-2xs text-muted-foreground">
                  auto-sent
                </span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Subject:</span>{" "}
                  You&apos;re #1 in line for {form.headline || "your product"}
                </p>
              </div>
              <div className="space-y-1 border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">Hi there,</p>
                <p className="text-xs text-muted-foreground">
                  Welcome to <strong>{form.headline || "your product"}</strong>.
                  You&apos;re on the list!
                </p>
                <p className="text-xs text-muted-foreground">
                  Your position is #1. Share your referral link to move up:
                </p>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5">
                  <span className="flex-1 truncate font-mono text-2xs text-muted-foreground">
                    {form.slug
                      ? `${form.slug}.prewaitlist.com/?ref=abc123`
                      : "your-page.prewaitlist.com/?ref=abc123"}
                  </span>
                </div>
                <p className="text-2xs text-muted-foreground">
                  The earlier you sign up, the higher your position.
                </p>
              </div>
            </div>

            {/* Upgrade button — inside card, below email mock */}
            <button
              type="button"
              onClick={() => upgrade?.triggerUpgrade("email_customisation")}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent bg-accent/5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span>Upgrade to customise emails</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Comparison: Free vs Pro */}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  Free
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Confirmation email
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Position tracking
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Referral links
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pro
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Custom sender name
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Custom subject + body
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro tier — editable email fields */}
      {isPro && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-accent"
              >
                <path
                  d="M2 4L8 8.5L14 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="1"
                  y="3"
                  width="14"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Customise your confirmation email
              </h3>
              <p className="text-xs text-muted-foreground">
                Personalise what your subscribers receive after signing up
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Sender Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sender name
              </label>
              <Input
                placeholder="Your Company"
                value={form.emailSenderName}
                onChange={(e) =>
                  form.updateField("emailSenderName", e.target.value)
                }
                disabled={isSubmitting}
                className="h-11 rounded-xl border-border/60 bg-background px-4 text-sm focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email subject
                </label>
                <VariablePicker
                  onSelect={(id) => {
                    const tag = `{{${id}}}`;
                    subjectEditorRef.current?.insertText(tag);
                  }}
                  disabled={isSubmitting}
                />
              </div>
              <EmailTokenEditor
                ref={subjectEditorRef}
                value={form.emailSubject}
                onChange={(val) => form.updateField("emailSubject", val)}
                placeholder="Welcome to the waitlist!"
                singleLine
                disabled={isSubmitting}
                className="h-11"
              />
            </div>

            {/* Message Body */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message body
                </label>
                <VariablePicker
                  onSelect={(id) => {
                    const tag = `{{${id}}}`;
                    bodyEditorRef.current?.insertText(tag);
                  }}
                  disabled={isSubmitting}
                />
              </div>
              <EmailTokenEditor
                ref={bodyEditorRef}
                value={form.emailBody}
                onChange={(val) => form.updateField("emailBody", val)}
                placeholder="Thanks for signing up! We'll let you know when we launch."
                disabled={isSubmitting}
                rows={6}
              />
            </div>
          </div>
        </div>
      )}

      {/* Launch button */}
      <div className="sticky bottom-0 flex w-full flex-col gap-3 bg-background pb-10 pt-3 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14.75 w-full items-center justify-center gap-2 rounded-(--radius-md) bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <span>Launch my waitlist</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
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
