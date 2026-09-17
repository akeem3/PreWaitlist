"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { LocalOnboardingProvider, useOnboardingForm } from "./context";
import { FlushGate } from "../../components/auth/flush-gate";

const LivePreview = dynamic(
  () =>
    import("../../../components/onboarding/live-preview").then(
      (mod) => mod.LivePreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    ),
  }
);

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

const TWO_PANE_ROUTES = [
  "/onboarding/1",
  "/onboarding/2",
  "/onboarding/3",
  "/onboarding/4a",
];

// Phase B routes — authenticated, API is authoritative
const AUTHED_ROUTES = ["/onboarding/4", "/onboarding/4a", "/onboarding/5"];

function getCurrentStep(pathname: string): number {
  return STEP_ROUTES[pathname] ?? 1;
}

function ProgressDots({
  currentStep,
  showDots,
  centered = false,
  className,
}: {
  currentStep: number;
  showDots: boolean;
  centered?: boolean;
  className?: string;
}) {
  if (!showDots) return null;

  return (
    <nav
      className={`relative flex items-center px-14 pt-14 pb-6 ${centered ? "justify-center" : ""} ${className ?? ""}`}
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
              step.num <= currentStep ? "bg-accent" : "bg-dot-inactive"
            }`}
          />
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11"
            aria-label={`Step ${step.num}: ${step.label}`}
          />
        </span>
      ))}
    </nav>
  );
}

function TwoPaneLayout({
  children,
  currentStep,
  showQuestions,
}: {
  children: React.ReactNode;
  currentStep: number;
  showQuestions?: boolean;
}) {
  const form = useOnboardingForm();

  return (
    <div className="grid min-h-screen grid-cols-1 border-0 md:grid-cols-[566px_1fr]">
      {/* Left pane — form content */}
      <div className="flex flex-col border-r border-border">
        <ProgressDots currentStep={currentStep} showDots={true} />
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
              productName={form.productName}
              ctaText={form.ctaText}
              milestoneRewards={form.milestoneRewards}
              signupCounterEnabled={form.signupCounterEnabled}
              signupCounterThreshold={form.signupCounterThreshold}
              questions={form.questions}
              showQuestions={showQuestions}
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
}: {
  children: React.ReactNode;
  currentStep: number;
  showDots: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-2xl px-6 py-6">
        <ProgressDots currentStep={currentStep} showDots={showDots} centered />
        <div className="flex flex-col">{children}</div>
      </div>
    </div>
  );
}

function OnboardingLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);
  const isTwoPane = TWO_PANE_ROUTES.includes(pathname);
  const isSuccess = pathname === "/onboarding/success";

  if (isTwoPane) {
    return (
      <TwoPaneLayout
        currentStep={currentStep}
        showQuestions={pathname === "/onboarding/4a"}
      >
        {children}
      </TwoPaneLayout>
    );
  }

  return (
    <CenteredLayout currentStep={currentStep} showDots={!isSuccess}>
      {children}
    </CenteredLayout>
  );
}

export function OnboardingClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthed = AUTHED_ROUTES.includes(pathname);

  return (
    <LocalOnboardingProvider>
      {isAuthed ? (
        <FlushGate>
          <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
        </FlushGate>
      ) : (
        <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
      )}
    </LocalOnboardingProvider>
  );
}
