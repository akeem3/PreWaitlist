import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import QualificationClient from "./client";

export default async function QualificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, subdomain, product_name, logo_url")
    .eq("founder_id", user.id)
    .single();
  if (!waitlist) redirect("/onboarding/1");

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const tier = profile?.tier ?? "free";

  return (
    <QualificationClient
      subdomain={waitlist.subdomain}
      waitlistName={waitlist.product_name}
      logoUrl={waitlist.logo_url}
      tier={tier}
    />
  );
}
