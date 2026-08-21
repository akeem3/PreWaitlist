"use client";

import { useDeferredValue, useState } from "react";
import { WaitlistTemplateContent } from "../share/waitlist-template-content";
import { PoweredByFooter } from "../share/powered-by-footer";

type Template = "minimal" | "bold" | "dark";
type ViewMode = "desktop" | "mobile";
type Tier = "free" | "pro" | "growth";

interface MilestoneReward {
  threshold: number;
  label: string;
}

interface Question {
  text: string;
  required: boolean;
}

interface LivePreviewProps {
  template: Template;
  headline: string;
  subheadline: string;
  brandColor: string;
  logoUrl: string | null;
  ctaText: string;
  milestoneRewards: MilestoneReward[];
  signupCounterEnabled?: boolean;
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
      style={{
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-float)",
        border: "1px solid var(--color-border, #CCC9C3)",
        overflow: "hidden",
        width: "100%",
        background: isDark
          ? "var(--color-dark-template-bg, #1C1917)"
          : "var(--color-card, #fff)",
      }}
    >
      <div
        style={{
          height: 36,
          background: isDark
            ? "var(--color-dark-template-bg, #1C1917)"
            : "var(--color-card, #fff)",
          borderBottom: `1px solid ${isDark ? "var(--color-dark-template-border, #6B6459)" : "var(--color-border, #E5E5E5)"}`,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--color-border, #C3C2C2)",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--color-border, #C3C2C2)",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--color-border, #C3C2C2)",
          }}
        />
        {slug && (
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "var(--text-xs, 0.75rem)",
              color: "var(--color-muted-foreground, #6B6B6B)",
            }}
          >
            {slug}.prewaitlist.com
          </span>
        )}
      </div>
      <div
        style={{
          padding: "24px 32px",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
        }}
      >
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

  const inputHeight = isBold ? "h-11" : "h-10";
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
  const btnHeight = isBold ? "h-11" : "h-10";
  const btnPadding = isBold ? "px-7" : "px-4";
  const btnText = isBold ? "text-base font-semibold" : "text-sm font-medium";

  return (
    <div
      className={`flex gap-2 w-full max-w-md ${
        isMobile ? "flex-col" : "flex-row"
      }`}
    >
      <input
        type="email"
        placeholder="Email address"
        readOnly
        className={`${inputHeight} flex-1 min-w-0 rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none ${
          isMobile ? "w-full flex-none" : ""
        }`}
      />
      <button
        type="button"
        style={{ backgroundColor: brandColor }}
        className={`inline-flex items-center justify-center ${btnHeight} ${btnPadding} rounded-[var(--button-radius)] ${btnText} text-white transition-colors whitespace-nowrap ${
          isMobile ? "w-full" : ""
        }`}
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

  const inputHeight = isBold ? "h-11" : "h-10";
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
  const btnHeight = isBold ? "h-11" : "h-10";
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
      : [{ text: "", required: false }];

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <input
        type="email"
        placeholder="Email address"
        readOnly
        className={`${inputHeight} w-full rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} focus-visible:outline-none`}
      />
      <div className={`flex flex-col ${cardGap}`}>
        {questionSlots.map((q, i) => (
          <div
            key={i}
            className={`flex justify-between items-center rounded-[var(--radius-md)] ${cardBorder} px-3.5 py-2.5 ${textSize} ${cardText}`}
          >
            <span>
              {q.text
                ? q.text.trim().endsWith("?")
                  ? q.text.trim()
                  : `${q.text.trim()}?`
                : "Your question here"}
            </span>
            {!q.required && (
              <span className={`text-xs ${cardText}`}>(optional)</span>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        style={{ backgroundColor: brandColor }}
        className={`inline-flex items-center justify-center ${btnHeight} w-full ${btnPadding} rounded-[var(--button-radius)] ${btnText} text-white transition-colors`}
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
  ctaText,
  milestoneRewards,
  signupCounterEnabled,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("desktop")}
          style={{
            padding: "6px 12px",
            fontSize: "var(--text-xs, 0.75rem)",
            fontWeight: "500",
            border: !isMobile
              ? "none"
              : "1px solid var(--color-border, #E5E5E5)",
            borderRadius: "var(--radius-md, 0.5rem)",
            background: !isMobile
              ? deferredBrandColor || "#0C6350"
              : "var(--color-card, #fff)",
            color: !isMobile ? "#fff" : "var(--color-foreground, #333)",
            cursor: "pointer",
          }}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewMode("mobile")}
          style={{
            padding: "6px 12px",
            fontSize: "var(--text-xs, 0.75rem)",
            fontWeight: "500",
            border: isMobile
              ? "none"
              : "1px solid var(--color-border, #E5E5E5)",
            borderRadius: "var(--radius-md, 0.5rem)",
            background: isMobile
              ? deferredBrandColor || "#0C6350"
              : "var(--color-card, #fff)",
            color: isMobile ? "#fff" : "var(--color-foreground, #333)",
            cursor: "pointer",
          }}
        >
          Mobile
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: isMobile ? "center" : "stretch",
        }}
      >
        <div
          style={{
            width: isMobile ? 375 : "100%",
            maxWidth: isMobile ? 375 : 787,
          }}
        >
          <BrowserFrame slug={deferredSlug} template={deferredTemplate}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              <div style={{ flex: 1 }}>
                <WaitlistTemplateContent
                  template={deferredTemplate}
                  headline={deferredHeadline}
                  subheadline={deferredSubheadline}
                  brandColor={deferredBrandColor}
                  logoUrl={deferredLogoUrl}
                  signupCounter={1189}
                  signupCounterVisible={!!deferredSignupCounter}
                  milestoneRewards={deferredRewards}
                  emailCaptureForm={emailCaptureForm}
                />
              </div>
              {tier === "free" && (
                <PoweredByFooter
                  template={deferredTemplate}
                  brandColor={deferredBrandColor}
                />
              )}
            </div>
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}
