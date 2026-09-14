import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { anonymizeEmail } from "../../../lib/format";
import LeaderboardClient from "./client";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();
  if (!waitlist) redirect("/onboarding/1");

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, referral_code, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  const rows = subscribers || [];

  // Batch referral count query (same pattern as dashboard/page.tsx)
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

  // Compute quality scores
  const totalReferrals = rows.reduce(
    (sum, s) => sum + (referralCounts.get(s.id) || 0),
    0
  );

  // Rank: referral_count DESC, created_at ASC (earlier = higher)
  const ranked = rows
    .map((s) => {
      const referral_count = referralCounts.get(s.id) || 0;
      return {
        id: s.id,
        email: anonymizeEmail(s.email),
        referral_count,
        quality_score:
          totalReferrals > 0
            ? Math.round((referral_count / totalReferrals) * 100)
            : null,
        created_at: s.created_at,
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
