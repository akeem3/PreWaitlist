import { createClient } from "../../lib/supabase/server";
import { OnboardingGuard } from "../../components/auth/onboarding-guard";
import { OnboardingClientLayout } from "./onboarding-client-layout";

async function resolveTier(): Promise<"free" | "pro"> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();
  return (profile?.tier as "free" | "pro") ?? "free";
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tier = await resolveTier();

  return (
    <OnboardingGuard>
      <OnboardingClientLayout tier={tier}>{children}</OnboardingClientLayout>
    </OnboardingGuard>
  );
}
