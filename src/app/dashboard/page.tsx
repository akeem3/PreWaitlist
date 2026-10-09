import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { resolveActiveWaitlistRow } from "../../lib/active-waitlist";
import { getStoredWaitlistPref } from "../../lib/waitlist-pref";
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

  // 4.4: shared resolution — ?wid (validated) else preference cookie (the
  // switcher's last selection) else newest. Previously this page ordered ASC
  // and took [0], i.e. the OLDEST list.
  const storedId = await getStoredWaitlistPref();
  const waitlist = await resolveActiveWaitlistRow<{
    id: string;
    headline: string;
    subdomain: string;
    template: string;
    product_name: string | null;
    cold_threshold: number | null;
  }>(
    supabase,
    user.id,
    wid,
    "id, headline, subdomain, template, product_name, cold_threshold",
    storedId
  );

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? "";
  const liveUrl = `${waitlist.subdomain}.prewaitlist.com`;

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, position, referral_code, warmth_score, created_at")
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
      subdomain={waitlist.subdomain}
      subscribers={subscribersWithQuality}
      founderEmail={user.email}
      displayName={displayName}
      stats={stats}
      coldThreshold={waitlist.cold_threshold ?? 40}
      waitlistId={waitlist.id}
    />
  );
}
