import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import DashboardShell from "./shell";

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

  const { data: waitlists } = await supabase
    .from("waitlists")
    .select("id, subdomain, product_name, logo_url, is_archived")
    .eq("founder_id", user.id);

  const waitlist = waitlists?.[0] ?? null;

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell
      waitlistName={waitlist.product_name}
      logoUrl={waitlist.logo_url}
      tier={profile?.tier ?? "free"}
      isArchived={waitlist.is_archived ?? false}
      waitlistId={waitlist.id}
    >
      {children}
    </DashboardShell>
  );
}
