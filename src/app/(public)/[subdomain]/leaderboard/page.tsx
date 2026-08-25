import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PoweredByFooter } from "../../../../../components/share/powered-by-footer";
import { LeaderboardClient } from "./leaderboard-client";

type Props = { params: Promise<{ subdomain: string }> };

function maskName(email: string): string {
  const local = email.split("@")[0];
  if (local.length <= 3) return local;
  return `${local[0]}•••${local[local.length - 1]}`;
}

export default async function LeaderboardPage({ params }: Props) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, headline, milestone_rewards_enabled")
    .eq("subdomain", subdomain)
    .single();

  if (!waitlist) notFound();

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, referral_code, referrer_id, qual_answers, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  const rows = subscribers || [];

  // Count referrals per subscriber
  const referralCounts = new Map<string, number>();
  const qualifiedCounts = new Map<string, number>();

  rows.forEach((s) => {
    if (s.referrer_id) {
      referralCounts.set(
        s.referrer_id,
        (referralCounts.get(s.referrer_id) || 0) + 1
      );
      // Count qualified referrals (qual_answers is non-null, non-empty)
      if (
        s.qual_answers &&
        typeof s.qual_answers === "object" &&
        Object.keys(s.qual_answers).length > 0
      ) {
        qualifiedCounts.set(
          s.referrer_id,
          (qualifiedCounts.get(s.referrer_id) || 0) + 1
        );
      }
    }
  });

  // Sort and rank
  const ranked = rows
    .map((s) => ({
      id: s.id,
      name: maskName(s.email),
      referral_count: referralCounts.get(s.id) || 0,
      qualified_count: qualifiedCounts.get(s.id) || 0,
    }))
    .sort((a, b) => {
      if (b.referral_count !== a.referral_count)
        return b.referral_count - a.referral_count;
      return 0;
    })
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
        {/* Header */}
        <h1 className="text-h2 text-foreground text-center">Leaderboard</h1>
        <p className="text-body-lg text-muted-foreground text-center mt-2">
          Top referrals for your waitlist
        </p>

        {/* Leaderboard table */}
        <LeaderboardClient
          rows={ranked}
          totalCount={ranked.length}
          subdomain={subdomain}
        />

        {/* Back link */}
        <div className="mt-10 flex justify-center">
          <Link
            href={`/${subdomain}`}
            className="inline-flex items-center gap-2 text-body-lg font-semibold text-accent hover:text-accent/80"
          >
            ← Back to waitlist
          </Link>
        </div>
      </div>

      {/* Footer — sticks to bottom when content is short */}
      <div>
        <PoweredByFooter template="minimal" />
      </div>
    </main>
  );
}
