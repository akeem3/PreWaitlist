import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import DashboardClient from "./client";

interface PageProps {
  searchParams: Promise<{ wid?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { wid } = await searchParams;

  let waitlistQuery = supabase
    .from("waitlists")
    .select("id, headline, subdomain, template, product_name, cold_threshold")
    .eq("founder_id", user.id)
    .order("created_at", { ascending: true });

  if (wid) {
    waitlistQuery = waitlistQuery.eq("id", wid);
  }

  const { data: waitlists, error: waitlistError } = await waitlistQuery;

  if (waitlistError) {
    redirect("/onboarding/1");
  }

  if (!waitlists || waitlists.length === 0) {
    redirect("/onboarding/1");
  }

  const waitlist = waitlists![0];

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  const tier = profile?.tier ?? "free";
  const liveUrl = `${waitlist.subdomain}.prewaitlist.com`;

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select(
      "id, email, position, referral_code, warmth_score, qual_answers, created_at"
    )
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

  const { data: bouncedRows } = await supabase
    .from("bounced_emails")
    .select("email")
    .eq("waitlist_id", waitlist.id);

  const bouncedEmails = new Set(bouncedRows?.map((r) => r.email) || []);

  const subscribersWithCountsAndBounce = subscribersWithCounts.map((s) => ({
    ...s,
    is_bounced: bouncedEmails.has(s.email),
  }));

  const totalReferrals = subscribersWithCountsAndBounce.reduce(
    (sum, s) => sum + s.referral_count,
    0
  );
  const subscribersWithQuality = subscribersWithCountsAndBounce.map((s) => ({
    ...s,
    quality_score:
      totalReferrals > 0
        ? Math.round((s.referral_count / totalReferrals) * 100)
        : null,
  }));

  const today = new Date().toISOString().split("T")[0];
  const stats = {
    totalSignups: subscribersWithQuality.length,
    referralPercentage:
      subscribersWithQuality.length > 0
        ? Math.round(
            (subscribersWithQuality.filter((s) => s.referral_count > 0).length /
              subscribersWithQuality.length) *
              100
          )
        : null,
    todaySignups:
      subscribersWithQuality.filter((s) => s.created_at.startsWith(today))
        .length || 0,
  };

  return (
    <DashboardClient
      liveUrl={liveUrl}
      tier={tier}
      subdomain={waitlist.subdomain}
      subscribers={subscribersWithQuality}
      stats={stats}
      coldThreshold={waitlist.cold_threshold ?? 40}
      waitlistId={waitlist.id}
    />
  );
}
