import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import DashboardShell from "./shell";

interface WaitlistRow {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
  subscriber_count: number | null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: waitlists, error: waitlistError } = await supabase
    .from("waitlists")
    .select(
      "id, subdomain, product_name, logo_url, is_archived, subscriber_count"
    )
    .eq("founder_id", user.id)
    .order("created_at", { ascending: true });

  // Only redirect to onboarding when the query succeeds AND user has zero waitlists.
  // On query errors, render the page — the shell will show an empty state and the
  // user can retry. Redirecting on errors creates infinite loops with OnboardingGuard.
  // (?plan=pro is branched in the auth callback — layouts never receive searchParams.)
  if (!waitlistError && (!waitlists || waitlists.length === 0)) {
    redirect("/onboarding/1");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      waitlists={(waitlists ?? []) as WaitlistRow[]}
      tier={profile?.tier ?? "free"}
      founderId={user.id}
    >
      {children}
    </DashboardShell>
  );
}
