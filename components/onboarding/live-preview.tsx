"use client";

import { useEffect, useDeferredValue, useRef, useState } from "react";
import { cn } from "../lib/cn";
import {
  WaitlistBrand,
  WaitlistTemplateContent,
} from "../share/waitlist-template-content";
import { PoweredByFooter } from "../share/powered-by-footer";
import { ConsentLine, TrustLine } from "../public/consent-line";
import { LatestUpdateCard } from "../public/updates-feed";
import { type PhoneMode } from "../../src/lib/phone";

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

// 18.2 AC1: static sample update for the preview — no fetch (W8 copy: approved
// by founder 2026-09-30, reused from the existing LatestUpdateCard test line).
// Deterministic created_at → "January 1, 2026" (updates-feed.tsx date format).
const PREVIEW_UPDATE = {
  id: "preview-update",
  body: "We just launched our beta!",
  created_at: "2026-01-01T00:00:00.000Z",
};

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
  phoneMode?: PhoneMode;
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
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState(0);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    const updateAvailable = () => {
      // Mirrors the frame classes: max-h calc(100vh-6rem), header h-9 + border-b,
      // inner pt-2 pb-6, frame border-y. offsetHeight is 0 without layout, so
      // fall back to the h-9 class height.
      const headerH = headerRef.current?.offsetHeight || 36;
      const chrome = headerH + 8 + 24 + 3;
      setAvailable(Math.max(240, window.innerHeight - 96 - chrome));
    };
    updateAvailable();
    window.addEventListener("resize", updateAvailable);
    return () => window.removeEventListener("resize", updateAvailable);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = (fallback?: number) => {
      const h = el.scrollHeight || fallback || 0;
      if (h > 0) setNatural((prev) => (prev === h ? prev : h));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    // Phase 3 fit: observe the UNSCALED content only — our own scale/height
    // writes never touch its layout box, so this cannot feedback-loop.
    const ro = new ResizeObserver((entries) => {
      measure(entries[0]?.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Phase 3 fit algorithm: grow with content first; when the content is
  // taller than the available pane, uniformly scale down (top-center origin;
  // the frame background paints the side gutters) with a 0.6 clamp, and
  // scroll only below the clamp. Computed values need runtime numbers, so
  // they are inline styles (same exception as dynamic brandColor).
  const scaled = natural > 0 && available > 0 && natural > available;
  const scale = scaled ? Math.max(available / natural, 0.6) : 1;
  const wrapperHeight = scaled
    ? Math.min(natural * scale, available)
    : undefined;
  const needsScroll = scaled && natural * scale > available + 1;

  return (
    <div
      className={cn(
        "w-full flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden rounded-(--radius-lg) shadow-(--shadow-float) border border-border",
        isDark ? "bg-dark-template-bg" : "bg-background"
      )}
    >
      <div
        ref={headerRef}
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
      <div className="flex flex-col px-6 pt-2 pb-6 min-h-0 flex-1 overflow-hidden">
        <div
          data-testid="preview-scaler"
          style={
            wrapperHeight !== undefined
              ? {
                  height: wrapperHeight,
                  overflowY: needsScroll ? "auto" : "hidden",
                }
              : undefined
          }
        >
          <div
            ref={contentRef}
            data-testid="preview-content"
            style={
              scale < 1
                ? {
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                  }
                : undefined
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewConsent({
  isDark,
  className,
}: {
  isDark: boolean;
  className?: string;
}) {
  // W3: approved click-through sentence — shared source, no checkbox (AC4)
  return <ConsentLine isDark={isDark} className={className} />;
}

function PreviewPhoneGroup({ template }: { template: Template }) {
  const isBold = template === "bold";
  const isDark = template === "dark";

  const inputHeight = "h-11";
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
  const focusClasses =
    "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent";

  // Same grouped control as email-capture-form.tsx — readOnly, no list attr
  // so the preview stays inert (plan Phase 4).
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex w-full gap-2">
        <input
          type="text"
          value="+1"
          readOnly
          aria-label="Country code"
          className={cn(
            inputHeight,
            "w-[4.75rem] shrink-0 rounded-[var(--input-radius)]",
            inputBorder,
            inputBg,
            inputText,
            "px-3",
            textSize,
            inputPlaceholder,
            focusClasses
          )}
        />
        <input
          type="tel"
          placeholder="Phone number"
          readOnly
          className={cn(
            inputHeight,
            "min-w-0 flex-1 rounded-[var(--input-radius)]",
            inputBorder,
            inputBg,
            inputText,
            "px-[var(--input-padding-x)] py-[var(--input-padding-y)]",
            textSize,
            inputPlaceholder,
            focusClasses
          )}
        />
      </div>
    </div>
  );
}

function PreviewEmailForm({
  template,
  ctaText,
  brandColor,
  phoneMode = "off",
}: {
  template: Template;
  ctaText: string;
  brandColor: string;
  phoneMode?: PhoneMode;
}) {
  const isBold = template === "bold";
  const isDark = template === "dark";

  const inputHeight = "h-11";
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
  const btnHeight = "h-11";
  const btnPadding = isBold ? "px-7" : "px-4";
  const btnText = isBold ? "text-base font-semibold" : "text-sm font-semibold";

  // D4: always stacked full-width — live and preview share one shape.
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
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
      {phoneMode !== "off" && <PreviewPhoneGroup template={template} />}
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
      {/* Swap (founder, 2026-09-30, amended): button → consent → trust —
          mirrors email-capture-form.tsx */}
      <PreviewConsent isDark={isDark} />
      <TrustLine isDark={isDark} className="mt-0" />
    </div>
  );
}

function PreviewQuestionForm({
  template,
  ctaText,
  brandColor,
  questions,
  phoneMode = "off",
}: {
  template: Template;
  ctaText: string;
  brandColor: string;
  questions?: Question[];
  phoneMode?: PhoneMode;
}) {
  const isBold = template === "bold";
  const isDark = template === "dark";

  const inputHeight = "h-11";
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
  const btnHeight = "h-11";
  const btnPadding = isBold ? "px-7" : "px-4";
  const btnText = isBold ? "text-base font-semibold" : "text-sm font-semibold";
  // Qualification fields are muted on every template so the email field
  // keeps the shine (mirrors email-capture-form.tsx). Dark needs the input
  // surface token — bg was invisible against the page (founder, 2026-09-30).
  const qualBorder = isDark
    ? "border border-dark-template-border"
    : "border border-border";
  const qualBg = isDark ? "bg-dark-template-input" : "bg-muted";
  const qualLabel = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";

  const questionSlots =
    questions && questions.length > 0
      ? questions
      : [{ text: "", type: "free_text" as const, options: null }];

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
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
      {phoneMode !== "off" && <PreviewPhoneGroup template={template} />}
      {questionSlots.map((q, i) => (
        <div key={q.id || i} className="flex flex-col gap-1.5">
          {q.type === "multiple_choice" && q.options?.length ? (
            <>
              <span
                className={cn(
                  "flex w-full items-center justify-between gap-2 text-sm font-medium",
                  qualLabel
                )}
              >
                <span className="min-w-0 truncate">
                  {q.text
                    ? q.text.trim().endsWith("?")
                      ? q.text.trim()
                      : `${q.text.trim()}?`
                    : "What are you currently using?"}
                </span>
                <span className="shrink-0 text-xs font-normal text-warning">
                  (optional)
                </span>
              </span>
              <div
                className={cn(
                  "flex h-11 w-full items-center justify-between gap-2 rounded-[var(--input-radius)] px-[var(--input-padding-x)]",
                  qualBorder,
                  qualBg
                )}
              >
                <span
                  className={cn(
                    `min-w-0 flex-1 truncate ${textSize}`,
                    isDark
                      ? "text-dark-template-muted/70"
                      : "text-muted-foreground/70"
                  )}
                >
                  Select an option
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                  className={cn("shrink-0", qualLabel)}
                >
                  <path
                    d="M3.5 5.25L7 8.75L10.5 5.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </>
          ) : (
            <div
              className={cn(
                "flex h-11 items-center justify-between gap-2 rounded-[var(--input-radius)] px-[var(--input-padding-x)]",
                qualBorder,
                qualBg
              )}
            >
              <span
                className={cn(
                  `truncate ${textSize} font-normal`,
                  isDark
                    ? "text-dark-template-muted/70"
                    : "text-muted-foreground/70"
                )}
              >
                {q.text
                  ? q.text.trim().endsWith("?")
                    ? q.text.trim()
                    : `${q.text.trim()}?`
                  : "What are you currently using?"}
              </span>
              <span className="shrink-0 text-xs font-normal text-warning">
                (optional)
              </span>
            </div>
          )}
        </div>
      ))}
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
      <PreviewConsent isDark={isDark} />
      <TrustLine isDark={isDark} className="mt-0" />
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
  phoneMode = "off",
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
  const deferredPhoneMode = useDeferredValue(phoneMode);

  const isMobile = viewMode === "mobile";

  const emailCaptureForm = deferredShowQuestions ? (
    <PreviewQuestionForm
      template={deferredTemplate}
      ctaText={deferredCtaText}
      brandColor={deferredBrandColor}
      questions={deferredQuestions}
      phoneMode={deferredPhoneMode}
    />
  ) : (
    <PreviewEmailForm
      template={deferredTemplate}
      ctaText={deferredCtaText}
      brandColor={deferredBrandColor}
      phoneMode={deferredPhoneMode}
    />
  );

  // Phase 3 density step: when many modules are on, tighten section gaps so
  // the fit-mechanism's required scale stays legible. Static module count —
  // not scale-driven — so it cannot feedback into the fit loop.
  const moduleCount =
    (deferredLogoUrl || deferredProductName ? 1 : 0) +
    (deferredSignupCounter ? 1 : 0) +
    (deferredRewards.length > 0 ? 1 : 0) +
    1 + // preview update card (always shown)
    (deferredShowQuestions ? (deferredQuestions?.length ?? 0) : 0);
  const compact = moduleCount >= 6;

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
                {(deferredLogoUrl || deferredProductName) && (
                  <div className="pt-6">
                    <WaitlistBrand
                      logoUrl={deferredLogoUrl}
                      productName={deferredProductName}
                      isDark={deferredTemplate === "dark"}
                      isLive={false}
                    />
                  </div>
                )}
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
                  latestUpdateSlot={
                    <LatestUpdateCard
                      update={PREVIEW_UPDATE}
                      template={deferredTemplate}
                    />
                  }
                  variant="preview"
                  compact={compact}
                />
              </div>
              {tier === "free" && (
                <PoweredByFooter template={deferredTemplate} standalone />
              )}
            </div>
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}
