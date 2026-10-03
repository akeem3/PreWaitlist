import {
  WaitlistBrand,
  WaitlistTemplateContent,
} from "../share/waitlist-template-content";
import { PoweredByFooter } from "../share/powered-by-footer";

interface WaitlistPageContentProps {
  template: "minimal" | "bold" | "dark";
  headline: string | null;
  subheadline: string | null;
  logoUrl: string | null;
  productName?: string;
  ctaText: string | null;
  brandColor: string;
  tier: "free" | "pro";
  signupCounter: number;
  signupCounterVisible: boolean;
  milestoneRewards: { threshold: number; label: string }[];
  emailCaptureForm: React.ReactNode;
  latestUpdateSlot?: React.ReactNode;
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
  productName,
  latestUpdateSlot,
}: WaitlistPageContentProps) {
  const isDark = template === "dark";

  return (
    <main
      className={`flex min-h-screen flex-col items-center px-4 md:px-8 ${
        isDark ? "bg-dark-template-bg" : "bg-background"
      }`}
    >
      {/* Screen top-left brand lockup — sits above the centered column.
          Guide §3: no header section when neither logo nor name exists. */}
      {(logoUrl || productName) && (
        <div className="w-full pt-6">
          <WaitlistBrand
            logoUrl={logoUrl}
            productName={productName}
            isDark={isDark}
            isLive
          />
        </div>
      )}
      <div className="flex w-full max-w-2xl flex-1 flex-col justify-center">
        <WaitlistTemplateContent
          template={template}
          headline={headline ?? ""}
          subheadline={subheadline ?? ""}
          brandColor={brandColor}
          logoUrl={logoUrl}
          productName={productName}
          signupCounter={signupCounter}
          signupCounterVisible={signupCounterVisible}
          milestoneRewards={milestoneRewards}
          emailCaptureForm={emailCaptureForm}
          latestUpdateSlot={latestUpdateSlot}
          variant="live"
        />
      </div>
      <div className="w-full max-w-2xl">
        {tier === "free" && <PoweredByFooter template={template} standalone />}
      </div>
    </main>
  );
}
