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
  signupCounter,
  signupCounterVisible,
  milestoneRewards,
  emailCaptureForm,
  latestUpdateSlot,
}: WaitlistTemplateContentProps) {
  const isDark = template === "dark";
  const isBold = template === "bold";

  const headingClass = "text-4xl";
  const headingColor = isDark ? "text-dark-template-text" : "text-foreground";
  const subheadlineSize = isBold ? "text-base" : "text-sm";
  const subheadlineColor = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";
  const sectionPadding = isBold ? "py-10" : "py-8";

  return (
    <div
      className={`flex flex-col items-center text-center gap-4 ${sectionPadding}`}
    >
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="Logo"
          width={144}
          height={48}
          unoptimized
          className={cn("max-w-[144px] max-h-[48px] object-contain")}
        />
      )}

      <h1 className={`${headingClass} ${headingColor}`}>
        {headline || "Your Headline"}
      </h1>

      <p className={`${subheadlineSize} max-w-md ${subheadlineColor}`}>
        {subheadline || "Your subheadline goes here"}
      </p>

      {signupCounterVisible && signupCounter !== undefined && (
        <div
          className={`text-sm font-medium ${
            isDark ? "text-dark-template-muted" : "text-muted-foreground"
          }`}
        >
          <span
            className={`font-semibold ${
              isDark ? "text-dark-template-text" : "text-foreground"
            }`}
          >
            {signupCounter.toLocaleString()}
          </span>{" "}
          people in line
        </div>
      )}

      {latestUpdateSlot && (
        <div className="w-full max-w-md mt-2">{latestUpdateSlot}</div>
      )}

      <div className="w-full max-w-md mt-2">{emailCaptureForm}</div>

      <p
        className={`text-xs font-medium mt-6 w-full max-w-md text-left ${
          isDark ? "text-dark-template-text" : "text-foreground"
        }`}
      >
        How it works
      </p>
      <div
        className={`flex flex-col sm:flex-row gap-4 sm:gap-8 mt-6 w-full max-w-md text-left ${
          isDark ? "text-dark-template-muted" : "text-muted-foreground"
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`text-sm font-semibold ${
              isDark ? "text-dark-template-text" : "text-foreground"
            }`}
          >
            1.
          </span>
          <span className="text-sm">Enter your email</span>
        </div>
        <div className="flex items-start gap-2">
          <span
            className={`text-sm font-semibold ${
              isDark ? "text-dark-template-text" : "text-foreground"
            }`}
          >
            2.
          </span>
          <span className="text-sm">Get your position</span>
        </div>
        <div className="flex items-start gap-2">
          <span
            className={`text-sm font-semibold ${
              isDark ? "text-dark-template-text" : "text-foreground"
            }`}
          >
            3.
          </span>
          <span className="text-sm">Refer friends to move up</span>
        </div>
      </div>

      {milestoneRewards.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap mt-4 w-full max-w-md">
          {milestoneRewards.map((r) => (
            <div
              key={r.threshold}
              className={`flex-1 min-w-[80px] max-w-[110px] p-2.5 rounded-md border text-center ${
                isDark
                  ? "border-dark-template-border bg-dark-template-input"
                  : isBold
                    ? "border-foreground bg-muted"
                    : "border-border bg-muted"
              }`}
            >
              <div
                className={`text-sm font-semibold ${
                  isDark ? "text-dark-template-text" : "text-foreground"
                }`}
              >
                {r.threshold}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  isDark ? "text-dark-template-muted" : "text-muted-foreground"
                }`}
              >
                Refer friends
              </div>
              <div
                className="text-2xs font-medium mt-1 text-[var(--brand-color)]"
                style={{ "--brand-color": brandColor } as React.CSSProperties}
              >
                {r.label || "Unlock reward"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
