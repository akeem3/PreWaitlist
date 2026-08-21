import Image from "next/image";

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
}: WaitlistTemplateContentProps) {
  const isDark = template === "dark";
  const isBold = template === "bold";

  const headingClass = isBold ? "text-h2" : "text-h3";
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
          width={isBold ? 144 : 120}
          height={isBold ? 48 : 40}
          unoptimized
          className="object-contain"
          style={{ height: isBold ? 48 : 40 }}
        />
      )}

      <h1 className={`${headingClass} ${headingColor}`}>
        {headline || "Your Headline"}
      </h1>

      <p className={`${subheadlineSize} max-w-md ${subheadlineColor}`}>
        {subheadline || "Your subheadline goes here"}
      </p>

      <div className="w-full max-w-md mt-2">{emailCaptureForm}</div>

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
                className={`text-[10px] mt-0.5 ${
                  isDark ? "text-dark-template-muted" : "text-muted-foreground"
                }`}
              >
                Refer friends
              </div>
              <div
                className="text-[11px] font-medium mt-1"
                style={{ color: brandColor }}
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
