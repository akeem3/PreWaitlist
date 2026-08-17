import Image from "next/image";
import { PoweredByFooter } from "../share/powered-by-footer";

interface Question {
  id: string;
  text: string;
  type: "free_text";
}

interface WaitlistPageContentProps {
  template: "minimal" | "bold" | "dark";
  headline: string | null;
  subheadline: string | null;
  logoUrl: string | null;
  ctaText: string | null;
  brandColor: string;
  tier: "free" | "pro" | "growth";
  signupCounter: number;
  signupCounterVisible: boolean;
  milestoneRewards: { threshold: number; label: string }[];
  qualificationEnabled: boolean;
  questions: Question[];
  emailCaptureForm: React.ReactNode;
}

function TemplateContent({
  template,
  headline,
  subheadline,
  logoUrl,
  brandColor,
  signupCounter,
  signupCounterVisible,
  milestoneRewards,
  emailCaptureForm,
}: Omit<
  WaitlistPageContentProps,
  "tier" | "ctaText" | "qualificationEnabled" | "questions"
>) {
  const isDark = template === "dark";
  const isBold = template === "bold";

  const headingSize = isBold ? "text-3xl font-bold" : "text-2xl font-semibold";
  const subheadlineSize = isBold ? "text-base" : "text-sm";

  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
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

      <h1
        className={`${headingSize} ${
          isDark ? "text-dark-template-foreground" : "text-foreground"
        }`}
      >
        {headline || "Your Headline"}
      </h1>

      <p
        className={`${subheadlineSize} max-w-md ${
          isDark ? "text-dark-template-muted" : "text-muted-foreground"
        }`}
      >
        {subheadline || "Your subheadline goes here"}
      </p>

      <div className="w-full max-w-md mt-2">{emailCaptureForm}</div>

      {signupCounterVisible && (
        <div
          className={`text-sm font-medium ${
            isDark ? "text-dark-template-muted" : "text-muted-foreground"
          }`}
        >
          <span
            className={`font-semibold ${
              isDark ? "text-dark-template-foreground" : "text-foreground"
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
                  isDark ? "text-dark-template-foreground" : "text-foreground"
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

export function WaitlistPageContent({
  template,
  tier,
  emailCaptureForm,
  ...contentProps
}: WaitlistPageContentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12 md:px-8">
      <div className="w-full max-w-lg">
        <TemplateContent
          template={template}
          emailCaptureForm={emailCaptureForm}
          {...contentProps}
        />
      </div>
      <div className="w-full max-w-lg">
        {tier === "free" && (
          <PoweredByFooter
            template={template}
            brandColor={contentProps.brandColor}
          />
        )}
      </div>
    </main>
  );
}
