import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../../lib/supabase/server";
import { ONBOARDING_PROGRESS_COOKIE } from "@/lib/onboarding-progress-core";

export async function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users pass through — updateSession (supabase/middleware)
  // redirects Phase-B routes (/onboarding/4, /4a, /5, /success) to
  // /onboarding/signup, so by the time this guard runs for those routes a
  // user is guaranteed.
  if (!user) {
    return <>{children}</>;
  }

  // Check tier: free users with an existing waitlist cannot enter onboarding
  // UNLESS they have an in-progress draft (cookie set by
  // LocalOnboardingProvider) — that is mid-flow resume, not a re-run
  // (QA Batch 2 TC-ONB-14a).
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  const tier = profile?.tier ?? "free";

  if (tier === "free") {
    const { count } = await supabase
      .from("waitlists")
      .select("id", { count: "exact", head: true })
      .eq("founder_id", user.id);

    if ((count ?? 0) > 0) {
      const cookieStore = await cookies();
      const hasDraft =
        cookieStore.get(ONBOARDING_PROGRESS_COOKIE)?.value === "1";
      if (!hasDraft) {
        redirect("/dashboard");
      }
    }
  }

  return <>{children}</>;
}
