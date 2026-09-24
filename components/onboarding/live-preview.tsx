"use client";

import { useDeferredValue, useState } from "react";
import { cn } from "../lib/cn";
import { WaitlistTemplateContent } from "../share/waitlist-template-content";
import { PoweredByFooter } from "../share/powered-by-footer";

type Template = "minimal" | "bold" | "dark";
type ViewMode = "desktop" | "mobile";
type Tier = "free" | "pro";

interface MilestoneReward {
  threshold: number;
  label: string;
}

interface Question {
  id?: string;
  text: string;
  type: "free_text" | "multiple_choice";
  options?: string[] | null;
}

interface LivePreviewProps {
  template: Template;
  headline: string;
  subheadline: string;
  brandColor: string;
  logoUrl: string | null;
  productName?: string;
  ctaText: string;
  milestoneRewards: MilestoneReward[];
  signupCounterEnabled?: boolean;
  signupCounterThreshold?: number;
  questions?: Question[];
  showQuestions?: boolean;
  tier?: Tier;
  slug?: string;
  isMobile?: boolean;
}

function BrowserFrame({
  children,
  slug,
  template,
}: {
  children: React.ReactNode;
  slug?: string;
  template?: Template;
}) {
  const isDark = template === "dark";

  return (
    <div
      className={cn(
        "w-full flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden rounded-(--radius-lg) shadow-(--shadow-float) border border-border",
        isDark ? "bg-dark-template-bg" : "bg-card"
      )}
    >
      <div
        className={cn(
          "flex h-9 shrink-0 items-center border-b px-3 gap-1.5",
          isDark
            ? "bg-dark-template-bg border-dark-template-border"
            : "bg-card border-border"
        )}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-dot-inactive" />
        <span className="h-2.5 w-2.5 rounded-full bg-dot-inactive" />
        <span className="h-2.5 w-2.5 rounded-full bg-dot-inactive" />
        {slug && (
          <span className="flex-1 text-center text-xs text-muted-foreground">
            {slug}.prewaitlist.com
          </span>
        )}
      </div>
      <div className="flex flex-col px-6 pt-2 pb-6 min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function PreviewEmailForm({
  template,
  ctaText,
  brandColor,
  isMobile,
}: {
  template: Template;
  ctaText: string;
  brandColor: string;
  isMobile: boolean;
}) {
  const isBold = template === "bold";
  const isDark = template === "dark";

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
    <div
      className={cn(
        "flex gap-2 w-full max-w-md",
        isMobile ? "flex-col" : "flex-row"
      )}
    >
      <input
        type="email"
        placeholder="Email address"
        readOnly
        className={cn(
          inputHeight,
          "flex-1 min-w-0 rounded-[var(--input-radius)]",
          inputBorder,
          inputBg,
          inputText,
          "px-[var(--input-padding-x)] py-[var(--input-padding-y)]",
          textSize,
          inputPlaceholder,
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent",
          isMobile && "w-full flex-none"
        )}
      />
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center",
          btnHeight,
          btnPadding,
          "rounded-[var(--button-radius)]",
          btnText,
          "text-white transition-colors whitespace-nowrap",
          "bg-[var(--brand-color)]",
          isMobile && "w-full"
        )}
        style={{ "--brand-color": brandColor } as React.CSSProperties}
      >
        {ctaText || "Join Waitlist"}
      </button>
    </div>
  );
}

function PreviewQuestionForm({
  template,
  ctaText,
  brandColor,
  questions,
}: {
  template: Template;
  ctaText: string;
  brandColor: string;
  questions?: Question[];
}) {
  const isBold = template === "bold";
  const isDark = template === "dark";

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
  const cardBorder = isBold
    ? "border-2 border-foreground"
    : isDark
      ? "border border-dark-template-border"
      : "border border-border";
  const cardText = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";
  const cardGap = isBold ? "gap-2.5" : "gap-2";

  const questionSlots =
    questions && questions.length > 0
      ? questions
      : [{ text: "", type: "free_text" as const, options: null }];

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <input
        type="email"
        placeholder="Email address"
        readOnly
        className={cn(
          inputHeight,
          "w-full rounded-[var(--input-radius)]",
          inputBorder,
          inputBg,
          inputText,
          "px-[var(--input-padding-x)] py-[var(--input-padding-y)]",
          textSize,
          inputPlaceholder,
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        )}
      />
      <div className={cn("flex flex-col", cardGap)}>
        {questionSlots.map((q, i) => (
          <div
            key={q.id || i}
            className={cn(
              "flex flex-col gap-1.5 rounded-[var(--radius-md)]",
              cardBorder,
              "px-3.5 py-2.5",
              textSize,
              cardText
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span>
                {q.text
                  ? q.text.trim().endsWith("?")
                    ? q.text.trim()
                    : `${q.text.trim()}?`
                  : "What are you currently using?"}
              </span>
              <span className={cn("text-xs shrink-0", cardText)}>
                (optional)
              </span>
            </span>
            {q.type === "multiple_choice" && q.options?.length ? (
              <div className="flex flex-col gap-1">
                {q.options.map((opt) => (
                  <span
                    key={opt}
                    className={cn(
                      "text-xs flex items-center gap-1.5",
                      cardText
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full border",
                        cardBorder
                      )}
                    />
                    {opt}
                  </span>
                ))}
              </div>
            ) : (
              <span
                className={cn(
                  "block h-8 rounded-[var(--input-radius)]",
                  cardBorder
                )}
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center",
          btnHeight,
          "w-full",
          btnPadding,
          "rounded-[var(--button-radius)]",
          btnText,
          "text-white transition-colors",
          "bg-[var(--brand-color)]"
        )}
        style={{ "--brand-color": brandColor } as React.CSSProperties}
      >
        {ctaText || "Join Waitlist"}
      </button>
    </div>
  );
}

export function LivePreview({
  template,
  headline,
  subheadline,
  brandColor,
  logoUrl,
  productName,
  ctaText,
  milestoneRewards,
  signupCounterEnabled,
  signupCounterThreshold = 0,
  questions,
  showQuestions,
  tier = "free",
  slug,
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const deferredTemplate = useDeferredValue(template);
  const deferredHeadline = useDeferredValue(headline);
  const deferredSubheadline = useDeferredValue(subheadline);
  const deferredBrandColor = useDeferredValue(brandColor);
  const deferredLogoUrl = useDeferredValue(logoUrl);
  const deferredProductName = useDeferredValue(productName);
  const deferredCtaText = useDeferredValue(ctaText);
  const deferredRewards = useDeferredValue(milestoneRewards);
  const deferredSignupCounter = useDeferredValue(signupCounterEnabled);
  const deferredSlug = useDeferredValue(slug);
  const deferredQuestions = useDeferredValue(questions);
  const deferredShowQuestions = useDeferredValue(showQuestions);

  const isMobile = viewMode === "mobile";

  const emailCaptureForm = deferredShowQuestions ? (
    <PreviewQuestionForm
      template={deferredTemplate}
      ctaText={deferredCtaText}
      brandColor={deferredBrandColor}
      questions={deferredQuestions}
    />
  ) : (
    <PreviewEmailForm
      template={deferredTemplate}
      ctaText={deferredCtaText}
      brandColor={deferredBrandColor}
      isMobile={isMobile}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex justify-end gap-1"
        style={
          {
            "--brand-color": deferredBrandColor || "var(--color-accent)",
          } as React.CSSProperties
        }
      >
        <button
          type="button"
          onClick={() => setViewMode("desktop")}
          className={cn(
            "rounded-(--radius-md) px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
            !isMobile
              ? "bg-[var(--brand-color)] text-white"
              : "border border-border bg-card text-foreground"
          )}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewMode("mobile")}
          className={cn(
            "rounded-(--radius-md) px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors",
            isMobile
              ? "bg-[var(--brand-color)] text-white"
              : "border border-border bg-card text-foreground"
          )}
        >
          Mobile
        </button>
      </div>
      <div
        className={cn("flex", isMobile ? "justify-center" : "justify-stretch")}
      >
        <div
          className={cn("w-full", isMobile ? "max-w-[375px]" : "max-w-[787px]")}
        >
          <BrowserFrame slug={deferredSlug} template={deferredTemplate}>
            <div className="flex flex-col min-h-full">
              <div className="flex-1">
                <WaitlistTemplateContent
                  template={deferredTemplate}
                  headline={deferredHeadline}
                  subheadline={deferredSubheadline}
                  brandColor={deferredBrandColor}
                  logoUrl={deferredLogoUrl}
                  productName={deferredProductName}
                  signupCounter={
                    signupCounterEnabled ? signupCounterThreshold : 0
                  }
                  signupCounterVisible={!!deferredSignupCounter}
                  milestoneRewards={deferredRewards}
                  emailCaptureForm={emailCaptureForm}
                />
              </div>
              {tier === "free" && (
                <PoweredByFooter template={deferredTemplate} />
              )}
            </div>
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}
