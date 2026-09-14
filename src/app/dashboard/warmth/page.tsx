import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import WarmthClient from "./client";

export default async function WarmthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, product_name, logo_url")
    .eq("founder_id", user.id)
    .single();
  if (!waitlist) redirect("/onboarding/1");

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const tier = profile?.tier ?? "free";

  if (tier !== "pro") {
    return (
      <WarmthClient
        subscribers={[]}
        summary={{ hot: 0, warm: 0, cold: 0, unscored: 0, total: 0 }}
        waitlistName={waitlist.product_name}
        logoUrl={waitlist.logo_url}
        tier={tier}
      />
    );
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, warmth_score, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  const rows = subscribers || [];

  // Batch referral count query
  const subscriberIds = rows.map((s) => s.id);
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

  // Batch last engagement query
  const lastEngagement = new Map<string, string>();
  if (subscriberIds.length > 0) {
    const { data: events } = await supabase
      .from("email_events")
      .select("subscriber_id, created_at")
      .in("subscriber_id", subscriberIds);

    events?.forEach((e) => {
      if (e.subscriber_id) {
        const existing = lastEngagement.get(e.subscriber_id);
        if (!existing || e.created_at > existing) {
          lastEngagement.set(e.subscriber_id, e.created_at);
        }
      }
    });
  }

  // Compute warmth summary
  const summary = { hot: 0, warm: 0, cold: 0, unscored: 0, total: rows.length };
  rows.forEach((s) => {
    if (s.warmth_score === "hot") summary.hot++;
    else if (s.warmth_score === "warm") summary.warm++;
    else if (s.warmth_score === "cold") summary.cold++;
    else summary.unscored++;
  });

  const enriched = rows.map((s) => ({
    id: s.id,
    email: s.email,
    warmth_score: s.warmth_score,
    referral_count: referralCounts.get(s.id) || 0,
    last_engagement: lastEngagement.get(s.id) || null,
    created_at: s.created_at,
  }));

  return (
    <WarmthClient
      subscribers={enriched}
      summary={summary}
      waitlistName={waitlist.product_name}
      logoUrl={waitlist.logo_url}
      tier={tier}
    />
  );
}
