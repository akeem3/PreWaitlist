import { WaitlistTemplateContent } from "../share/waitlist-template-content";
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

export function WaitlistPageContent({
  template,
  tier,
  brandColor,
  emailCaptureForm,
  signupCounter,
  signupCounterVisible,
  milestoneRewards,
  headline,
  subheadline,
  logoUrl,
}: WaitlistPageContentProps) {
  const isDark = template === "dark";

  return (
    <main
      className={`flex min-h-screen flex-col items-center px-4 py-12 md:px-8 ${
        isDark ? "bg-dark-template-bg" : "bg-background"
      }`}
    >
      <div className="w-full max-w-lg">
        <WaitlistTemplateContent
          template={template}
          headline={headline ?? ""}
          subheadline={subheadline ?? ""}
          brandColor={brandColor}
          logoUrl={logoUrl}
          signupCounter={signupCounter}
          signupCounterVisible={signupCounterVisible}
          milestoneRewards={milestoneRewards}
          emailCaptureForm={emailCaptureForm}
        />
      </div>
      <div className="w-full max-w-lg">
        {tier === "free" && (
          <PoweredByFooter template={template} brandColor={brandColor} />
        )}
      </div>
    </main>
  );
}
