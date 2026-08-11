import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, headline, subdomain, template, status, logo_url")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const liveUrl = `${waitlist.subdomain}.prewaitlist.com`;

  return (
    <DashboardClient
      liveUrl={liveUrl}
      waitlistName={waitlist.headline}
      logoUrl={waitlist.logo_url}
    />
  );
}
