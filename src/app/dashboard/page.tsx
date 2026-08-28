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

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, position, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("position", { ascending: true });

  const subscriberIds = subscribers?.map((s) => s.id) || [];

  const referralCounts = new Map<string, number>();
  if (subscriberIds.length > 0) {
    const { data: referralRows } = await supabase
      .from("subscribers")
      .select("referrer_id")
      .in("referrer_id", subscriberIds);

    referralRows?.forEach((r) => {
      if (r.referrer_id) {
        referralCounts.set(
          r.referrer_id,
          (referralCounts.get(r.referrer_id) || 0) + 1
        );
      }
    });
  }

  const subscribersWithCounts =
    subscribers?.map((s) => ({
      ...s,
      referral_count: referralCounts.get(s.id) || 0,
    })) || [];

  return (
    <DashboardClient
      liveUrl={liveUrl}
      waitlistName={waitlist.headline}
      logoUrl={waitlist.logo_url}
      subscribers={subscribersWithCounts}
    />
  );
}
