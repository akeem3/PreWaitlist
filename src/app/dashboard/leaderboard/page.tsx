import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import LeaderboardClient from "./client";

interface PageProps {
  searchParams: Promise<{ wid?: string }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { wid } = await searchParams;

  let wlQuery = supabase.from("waitlists").select("id");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.single();
  if (!waitlist) redirect("/onboarding/1");

  // Try with display_name; fall back without it if column doesn't exist yet
  type SubRow = {
    id: string;
    email: string;
    referral_code: string;
    created_at: string;
    milestones_earned: unknown;
    display_name?: string;
  };

  let selectResult = await supabase
    .from("subscribers")
    .select(
      "id, email, referral_code, created_at, milestones_earned, display_name"
    )
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  if (
    selectResult.error?.code === "PGRST204" &&
    selectResult.error?.message?.includes("display_name")
  ) {
    selectResult = (await supabase
      .from("subscribers")
      .select("id, email, referral_code, created_at, milestones_earned")
      .eq("waitlist_id", waitlist.id)
      .order("created_at", { ascending: true })) as typeof selectResult;
  }

  const rows = (selectResult.data || []) as SubRow[];

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

  // Fetch milestone rewards for progress display
  const { data: milestoneRewards } = await supabase
    .from("milestone_rewards")
    .select("tier_referrals, reward_label")
    .eq("waitlist_id", waitlist.id)
    .order("tier_referrals", { ascending: true });

  // Compute quality scores
  const totalReferrals = rows.reduce(
    (sum, s) => sum + (referralCounts.get(s.id) || 0),
    0
  );

  // Rank: referral_count DESC, created_at ASC (earlier = higher)
  const ranked = rows
    .map((s) => {
      const referral_count = referralCounts.get(s.id) || 0;
      const earned =
        (s.milestones_earned as { threshold: number; label: string }[]) || [];
      const nextTier =
        milestoneRewards?.find(
          (t) =>
            !earned.some((e) => e.threshold === t.tier_referrals) &&
            t.tier_referrals > referral_count
        ) || null;

      return {
        id: s.id,
        email: s.email,
        display_name: s.display_name || null,
        referral_count,
        quality_score:
          totalReferrals > 0
            ? Math.round((referral_count / totalReferrals) * 100)
            : null,
        created_at: s.created_at,
        milestone_earned_count: earned.length,
        milestone_total: milestoneRewards?.length || 0,
        milestone_next: nextTier
          ? { threshold: nextTier.tier_referrals, label: nextTier.reward_label }
          : null,
      };
    })
    .sort((a, b) => {
      if (b.referral_count !== a.referral_count)
        return b.referral_count - a.referral_count;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    })
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return <LeaderboardClient rows={ranked} totalCount={ranked.length} />;
}
