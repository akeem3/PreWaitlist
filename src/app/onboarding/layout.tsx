"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LivePreview } from "../../../components/onboarding/live-preview";
import { OnboardingFormProvider, useOnboardingForm } from "./context";

const STEPS = [
  { num: 1, label: "Name", href: "/onboarding/1" },
  { num: 2, label: "Template", href: "/onboarding/2" },
  { num: 3, label: "Customise", href: "/onboarding/3" },
  { num: 4, label: "Qualify", href: "/onboarding/4" },
  { num: 5, label: "Email", href: "/onboarding/5" },
];

const STEP_ROUTES: Record<string, number> = {
  "/onboarding/1": 1,
  "/onboarding/2": 2,
  "/onboarding/3": 3,
  "/onboarding/4": 4,
  "/onboarding/4a": 4,
  "/onboarding/5": 5,
};

const BACK_HREF: Record<string, string> = {
  "/onboarding/2": "/onboarding/1",
  "/onboarding/3": "/onboarding/2",
  "/onboarding/4": "/onboarding/3",
  "/onboarding/4a": "/onboarding/4",
  "/onboarding/5": "/onboarding/4",
};

const TWO_PANE_ROUTES = ["/onboarding/1", "/onboarding/2", "/onboarding/3"];

function getCurrentStep(pathname: string): number {
  return STEP_ROUTES[pathname] ?? 1;
}

function ProgressDots({
  currentStep,
  showDots,
}: {
  currentStep: number;
  showDots: boolean;
}) {
  if (!showDots) return null;

  return (
    <nav
      className="relative flex items-center px-14 pt-14 pb-6"
      aria-label="Onboarding progress"
    >
      {STEPS.map((step) => (
        <span
          key={step.num}
          aria-current={step.num === currentStep ? "step" : undefined}
          className="relative w-[16.7px]"
        >
          <span
            className={`absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-normal w-2.5 h-2.5 ${
              step.num <= currentStep ? "bg-accent" : "bg-muted-foreground"
            }`}
          />
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[44px] h-[44px]"
            aria-label={`Step ${step.num}: ${step.label}`}
          />
        </span>
      ))}
    </nav>
  );
}

function BackLink({ backHref }: { backHref: string | undefined }) {
  if (!backHref) return null;

  return (
    <div className="px-14 pt-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-body-sm text-muted-foreground transition-colors duration-normal hover:text-foreground"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </Link>
    </div>
  );
}

function TwoPaneLayout({
  children,
  currentStep,
  backHref,
}: {
  children: React.ReactNode;
  currentStep: number;
  backHref: string | undefined;
}) {
  const form = useOnboardingForm();

  return (
    <div className="grid min-h-screen grid-cols-1 border-0 md:grid-cols-[566px_1fr]">
      {/* Left pane — form content */}
      <div className="flex flex-col border-r border-[#CCC9C3]">
        <ProgressDots currentStep={currentStep} showDots={true} />
        <BackLink backHref={backHref} />
        <div className="flex flex-1 flex-col px-14 pb-14">{children}</div>
      </div>

      {/* Right pane — live preview */}
      <div className="hidden bg-background md:block">
        <div className="sticky top-0 flex h-screen items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <LivePreview
              template={form.template}
              headline={form.headline}
              subheadline={form.subheadline}
              brandColor={form.brandColor}
              logoUrl={form.logoUrl}
              ctaText={form.ctaText}
              milestoneRewards={form.milestoneRewards}
              tier={form.tier}
              slug={form.slug}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CenteredLayout({
  children,
  currentStep,
  showDots,
  backHref,
}: {
  children: React.ReactNode;
  currentStep: number;
  showDots: boolean;
  backHref: string | undefined;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-2xl px-6 py-14">
        <ProgressDots currentStep={currentStep} showDots={showDots} />
        <BackLink backHref={backHref} />
        <div className="flex flex-col">{children}</div>
      </div>
    </div>
  );
}

function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);
  const backHref = BACK_HREF[pathname];
  const isTwoPane = TWO_PANE_ROUTES.includes(pathname);
  const isSuccess = pathname === "/onboarding/success";

  if (isTwoPane) {
    return (
      <TwoPaneLayout currentStep={currentStep} backHref={backHref}>
        {children}
      </TwoPaneLayout>
    );
  }

  return (
    <CenteredLayout
      currentStep={currentStep}
      showDots={!isSuccess}
      backHref={backHref}
    >
      {children}
    </CenteredLayout>
  );
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingFormProvider>
      <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
    </OnboardingFormProvider>
  );
}
