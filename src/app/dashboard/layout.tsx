import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import DashboardShell from "./shell";

interface WaitlistRow {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
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
    .select("id, subdomain, product_name, logo_url, is_archived")
    .eq("founder_id", user.id)
    .order("created_at", { ascending: true });

  if (waitlistError) {
    redirect("/onboarding/1");
  }

  if (!waitlists || waitlists.length === 0) {
    redirect("/onboarding/1");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      waitlists={waitlists as WaitlistRow[]}
      tier={profile?.tier ?? "free"}
    >
      {children}
    </DashboardShell>
  );
}
