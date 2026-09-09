import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import SettingsClient from "./client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select(
      "id, subdomain, sender_name, cold_threshold, sending_domain, product_name, logo_url"
    )
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier, paddle_subscription_id")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      waitlistId={waitlist.id}
      waitlistName={waitlist.product_name}
      logoUrl={waitlist.logo_url}
      senderName={waitlist.sender_name}
      coldThreshold={waitlist.cold_threshold ?? 40}
      sendingDomain={waitlist.sending_domain}
      tier={profile?.tier ?? "free"}
      paddleSubscriptionId={profile?.paddle_subscription_id}
    />
  );
}
