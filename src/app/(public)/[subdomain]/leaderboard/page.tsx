import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PoweredByFooter } from "../../../../../components/share/powered-by-footer";
import { LeaderboardClient } from "./leaderboard-client";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ subscriber_id?: string }>;
};

function maskName(email: string): string {
  const local = email.split("@")[0];
  if (local.length <= 3) return local;
  return `${local[0]}•••${local[local.length - 1]}`;
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const { subscriber_id: currentSubscriberId } = await searchParams;
  const supabase = await createClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select(
      `
      id, headline, template, milestone_rewards_enabled,
      founder_profiles!inner ( tier )
    `
    )
    .eq("subdomain", subdomain)
    .single();

  if (!waitlist) notFound();

  const founderProfile = Array.isArray(waitlist.founder_profiles)
    ? waitlist.founder_profiles[0]
    : waitlist.founder_profiles;
  const tier = founderProfile?.tier || "free";

  // Try with display_name; fall back without it if column doesn't exist yet
  type SubscriberRow = {
    id: string;
    email: string;
    referral_code: string;
    referrer_id: string | null;
    qual_answers: Record<string, string> | null;
    created_at: string;
    display_name?: string;
  };

  let selectResult = await supabase
    .from("subscribers")
    .select(
      "id, email, referral_code, referrer_id, qual_answers, created_at, display_name"
    )
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  if (
    selectResult.error?.code === "PGRST204" &&
    selectResult.error?.message?.includes("display_name")
  ) {
    selectResult = (await supabase
      .from("subscribers")
      .select("id, email, referral_code, referrer_id, qual_answers, created_at")
      .eq("waitlist_id", waitlist.id)
      .order("created_at", { ascending: true })) as typeof selectResult;
  }

  const rows = (selectResult.data || []) as SubscriberRow[];

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

  // Sort and rank — secondary sort by signup date ascending (earlier = higher)
  const ranked = rows
    .map((s) => {
      const isCurrent = currentSubscriberId && s.id === currentSubscriberId;
      let name: string;
      if (s.display_name?.trim()) {
        name = s.display_name.trim();
      } else if (isCurrent) {
        // Show full email prefix for current subscriber's own row
        name = s.email.split("@")[0];
      } else {
        name = maskName(s.email);
      }
      return {
        id: s.id,
        name,
        referral_count: referralCounts.get(s.id) || 0,
        qualified_count: qualifiedCounts.get(s.id) || 0,
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
          rows={ranked.map((r) => ({
            id: r.id,
            name: r.name,
            referral_count: r.referral_count,
            qualified_count: r.qualified_count,
            rank: r.rank,
          }))}
          totalCount={ranked.length}
          subdomain={subdomain}
          currentSubscriberId={currentSubscriberId}
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
        {tier === "free" && (
          <PoweredByFooter
            template={
              (waitlist.template as "minimal" | "bold" | "dark") ?? "minimal"
            }
            standalone
          />
        )}
      </div>
    </main>
  );
}
