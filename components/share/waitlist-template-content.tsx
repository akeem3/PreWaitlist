import Image from "next/image";
import { cn } from "../lib/cn";

type Template = "minimal" | "bold" | "dark";

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
}

export function WaitlistTemplateContent({
  template,
  headline,
  subheadline,
  brandColor,
  logoUrl,
  productName,
  signupCounter,
  signupCounterVisible,
  milestoneRewards,
  emailCaptureForm,
  latestUpdateSlot,
}: WaitlistTemplateContentProps) {
  const isDark = template === "dark";
  const isBold = template === "bold";

  const headingClass = "text-4xl font-semibold";
  const headingColor = isDark ? "text-dark-template-text" : "text-foreground";
  const subheadlineSize = isBold ? "text-base" : "text-sm";
  const subheadlineColor = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";
  const sectionPadding = isBold ? "pt-3 pb-6" : "pt-2 pb-4";

  return (
    <div className={`flex flex-col ${sectionPadding}`}>
      {(logoUrl || productName) && (
        <div className="flex items-center gap-2 mb-1">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt="Logo"
              width={28}
              height={28}
              unoptimized
              className={cn("h-7 w-7 rounded-md object-contain")}
            />
          )}
          {productName && (
            <span
              className={`text-sm font-medium ${
                isDark ? "text-dark-template-muted" : "text-muted-foreground"
              }`}
            >
              {productName}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-3">
        <h1 className={`${headingClass} ${headingColor}`}>
          {headline || "Your Headline"}
        </h1>

        <p
          className={`${subheadlineSize} font-medium max-w-md ${subheadlineColor}`}
        >
          {subheadline || "Your subheadline goes here"}
        </p>

        {signupCounterVisible && signupCounter !== undefined && (
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
              isDark
                ? "bg-dark-template-input text-dark-template-muted"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`font-semibold ${
                isDark ? "text-dark-template-text" : "text-foreground"
              }`}
            >
              {signupCounter.toLocaleString()}
            </span>
            <span>people on the waitlist</span>
          </div>
        )}

        {latestUpdateSlot && (
          <div className="w-full max-w-md mt-1">{latestUpdateSlot}</div>
        )}

        <div className="w-full max-w-md mt-1">{emailCaptureForm}</div>

        {milestoneRewards.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap mt-2 w-full max-w-md">
            {milestoneRewards.map((r) => (
              <div
                key={r.threshold}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-center",
                  isDark
                    ? "border-dark-template-border bg-dark-template-input"
                    : isBold
                      ? "border-foreground bg-muted"
                      : "border-border bg-muted"
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
                  style={{ "--brand-color": brandColor } as React.CSSProperties}
                >
                  {r.label || "Unlock reward"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`mt-auto pt-4 text-center ${
          isDark ? "text-dark-template-muted" : "text-muted-foreground"
        }`}
      >
        <p className="text-xs font-medium mb-2">How it works</p>
        <div
          className={`flex flex-col sm:flex-row gap-2 sm:gap-5 justify-center ${
            isDark ? "text-dark-template-muted" : "text-muted-foreground"
          }`}
        >
          <span className="text-xs">
            <span className="font-semibold">1.</span> Enter your email
          </span>
          <span className="text-xs">
            <span className="font-semibold">2.</span> Get your position
          </span>
          <span className="text-xs">
            <span className="font-semibold">3.</span> Refer friends to move up
          </span>
        </div>
      </div>
    </div>
  );
}
