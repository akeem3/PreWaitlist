import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import WaitlistSettingsClient from "./client";

export default async function WaitlistSettingsPage({
  params,
}: {
  params: Promise<{ waitlistId: string }>;
}) {
  const { waitlistId } = await params;
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
      "id, headline, subheadline, cta_text, logo_url, brand_color, template, sender_name, cold_threshold, is_archived, business_address, product_name"
    )
    .eq("id", waitlistId)
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  return (
    <WaitlistSettingsClient
      waitlist={{
        ...waitlist,
        tier: profile?.tier ?? "free",
      }}
    />
  );
}
