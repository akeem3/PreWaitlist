import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { resolveActiveWaitlist } from "../../lib/active-waitlist";
import { getStoredWaitlistPref } from "../../lib/waitlist-pref";
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

  // First-paint agreement: seed the shell with the same resolution the page
  // uses (preference cookie > newest) so the switcher label is correct in the
  // server-rendered HTML — no dropdown flip after hydration. An explicit
  // ?wid still wins later via the shell's sync effect (layouts never see
  // searchParams).
  const storedId = await getStoredWaitlistPref();
  const defaultWaitlistId =
    resolveActiveWaitlist(waitlists ?? [], { storedId: storedId })?.id ?? "";

  return (
    <DashboardShell
      waitlists={(waitlists ?? []) as WaitlistRow[]}
      tier={profile?.tier ?? "free"}
      founderId={user.id}
      defaultWaitlistId={defaultWaitlistId}
    >
      {children}
    </DashboardShell>
  );
}
