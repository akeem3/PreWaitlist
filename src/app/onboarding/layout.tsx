"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

function getCurrentStep(pathname: string): number {
  return STEP_ROUTES[pathname] ?? 1;
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);
  const backHref = BACK_HREF[pathname];

  return (
    <div className="grid min-h-screen grid-cols-1 border-0 md:grid-cols-[566px_1fr]">
      {/* Left pane — form content */}
      <div className="flex flex-col border-r border-[#CCC9C3]">
        {/* Progress bar — 5 dots */}
        <nav
          className="flex items-center gap-4 px-14 pt-14"
          aria-label="Onboarding progress"
        >
          {STEPS.map((step) => (
            <Link
              key={step.num}
              href={step.href}
              aria-label={`Step ${step.num}: ${step.label}`}
              aria-current={step.num === currentStep ? "step" : undefined}
              className="flex items-center justify-center"
            >
              <span
                className="block rounded-full transition-colors duration-normal"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor:
                    step.num === currentStep ? "#0F7A5E" : "#C3C2C2",
                }}
              />
            </Link>
          ))}
        </nav>

        {/* Back link */}
        {backHref && (
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
        )}

        {/* Step content */}
        <div className="flex flex-1 flex-col px-14 pb-14">{children}</div>
      </div>

      {/* Right pane — live preview */}
      <div className="hidden bg-background md:block">
        <div className="sticky top-0 flex h-screen items-center justify-center p-8">
          <div className="w-full max-w-2xl text-center text-muted-foreground text-body-sm">
            {/* Story 1.6 will render LivePreview here */}
          </div>
        </div>
      </div>
    </div>
  );
}
