import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

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
      redirect("/dashboard");
    }
  }

  return <>{children}</>;
}
