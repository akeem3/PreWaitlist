import Image from "next/image";
import { cn } from "../lib/cn";

type Template = "minimal" | "bold" | "dark";
type Variant = "live" | "preview";

interface MilestoneReward {
  threshold: number;
  label: string;
}

interface WaitlistTemplateContentProps {
  template: Template;
  headline: string;
  subheadline: string;
  brandColor: string;
  logoUrl: string | null;
  productName?: string;
  signupCounter?: number;
  signupCounterVisible?: boolean;
  milestoneRewards: MilestoneReward[];
  emailCaptureForm: React.ReactNode;
  latestUpdateSlot?: React.ReactNode;
  variant?: Variant;
  /** Preview-only density step: tighten section gaps when many modules are on. */
  compact?: boolean;
}

const HOW_IT_WORKS_STEPS = [
  { n: 1, label: "Enter your email" },
  { n: 2, label: "Get your position" },
  { n: 3, label: "Refer friends to move up" },
] as const;

/**
 * Brand lockup — full-bleed top-left of the screen (live) or of the preview
 * frame (preview). Rendered by the page shell (waitlist-page-content) and by
 * LivePreview; never inside WaitlistTemplateContent's centered column.
 */
export function WaitlistBrand({
  logoUrl,
  productName,
  isDark,
  isLive,
}: {
  logoUrl: string | null;
  productName?: string;
  isDark: boolean;
  isLive: boolean;
}) {
  if (!logoUrl && !productName) return null;
  return (
    <div className="flex w-full items-center gap-2.5">
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="Logo"
          width={isLive ? 36 : 28}
          height={isLive ? 36 : 28}
          unoptimized
          className={cn(
            "object-contain",
            isLive ? "h-9 w-9 rounded-lg" : "h-7 w-7 rounded-md"
          )}
        />
      )}
      {productName && (
        <span
          className={`font-bold ${
            isLive ? "text-2xl" : "text-sm"
          } ${isDark ? "text-dark-template-text" : "text-foreground"}`}
        >
          {productName}
        </span>
      )}
    </div>
  );
}

export function WaitlistTemplateContent({
  template,
  headline,
  subheadline,
  brandColor,
  signupCounter,
  signupCounterVisible,
  milestoneRewards,
  emailCaptureForm,
  latestUpdateSlot,
  variant = "preview",
  compact = false,
}: WaitlistTemplateContentProps) {
  const isDark = template === "dark";
  const isBold = template === "bold";
  const isLive = variant === "live";

  const headingColor = isDark ? "text-dark-template-text" : "text-foreground";
  const bodyColor = isDark ? "text-dark-template-text" : "text-foreground";
  const dividerBorder = isDark
    ? "border-dark-template-border"
    : isBold
      ? "border-foreground"
      : "border-border";

  const stepCard = isDark
    ? "border-dark-template-border bg-dark-template-input text-dark-template-text"
    : isBold
      ? "border-2 border-foreground bg-muted text-foreground"
      : "border-border bg-card text-foreground";

  const chipSurface = isDark
    ? "border-dark-template-border bg-dark-template-input"
    : isBold
      ? "border-foreground bg-muted"
      : "border-border bg-muted";

  const brandVar = { "--brand-color": brandColor } as React.CSSProperties;

  return (
    <div
      className={`flex flex-col ${isLive ? "space-y-8 pt-6 pb-8" : compact ? "space-y-3 pt-3 pb-5" : "space-y-5 pt-4 pb-6"}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <h1
          className={`font-extrabold leading-tight tracking-tight max-w-xl text-balance ${isLive ? "text-5xl sm:text-6xl" : "text-4xl"} ${headingColor}`}
        >
          {headline || "Your Headline"}
        </h1>

        <p
          className={`font-medium leading-relaxed max-w-md ${isLive ? "text-lg" : "text-base"} ${bodyColor}`}
        >
          {subheadline || "Your subheadline goes here"}
        </p>

        {signupCounterVisible && signupCounter !== undefined && (
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
              isDark
                ? "border-dark-template-border bg-dark-template-input text-dark-template-muted"
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`font-bold ${isDark ? "text-dark-template-text" : "text-foreground"}`}
            >
              {signupCounter.toLocaleString()}
            </span>
            <span>people on the waitlist</span>
          </div>
        )}

        <div className="w-full max-w-md">{emailCaptureForm}</div>

        {milestoneRewards.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap w-full max-w-md">
            {milestoneRewards.map((r) => (
              <div
                key={r.threshold}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-center",
                  chipSurface
                )}
              >
                <span
                  className={`text-xs font-semibold ${
                    isDark ? "text-dark-template-text" : "text-foreground"
                  }`}
                >
                  Refer {r.threshold}
                </span>
                <span
                  className={`text-xs ${
                    isDark
                      ? "text-dark-template-muted"
                      : "text-muted-foreground"
                  }`}
                >
                  ·
                </span>
                <span
                  className="text-xs font-medium text-[var(--brand-color)]"
                  style={brandVar}
                >
                  {r.label || "Unlock reward"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`border-t text-center ${isLive ? "pt-8" : "pt-6"} ${dividerBorder}`}
      >
        <p className={`text-sm font-semibold ${headingColor}`}>How it works</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.n}
              className={`flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-2.5 text-center text-sm font-medium ${stepCard}`}
            >
              <span
                className="font-bold text-[var(--brand-color)]"
                style={brandVar}
              >
                {step.n}.
              </span>{" "}
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {latestUpdateSlot && (
        <div className="w-full max-w-md mx-auto">{latestUpdateSlot}</div>
      )}
    </div>
  );
}
