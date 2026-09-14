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
    .select("id, sender_name, cold_threshold, sending_domain")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      waitlistId={waitlist.id}
      senderName={waitlist.sender_name}
      coldThreshold={waitlist.cold_threshold ?? 40}
      sendingDomain={waitlist.sending_domain}
      tier={profile?.tier ?? "free"}
    />
  );
}
