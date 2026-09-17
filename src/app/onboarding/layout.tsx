import { OnboardingGuard } from "../../components/auth/onboarding-guard";
import { OnboardingClientLayout } from "./onboarding-client-layout";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <OnboardingClientLayout>{children}</OnboardingClientLayout>
    </OnboardingGuard>
  );
}
