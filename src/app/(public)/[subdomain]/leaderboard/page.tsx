import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: Promise<{ subdomain: string }> };

function anonymizeEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}••••@${domain}`;
  return `${local[0]}••••${local[local.length - 1]}@${domain}`;
}

function MilestoneBadges({
  referralCount,
  milestones,
}: {
  referralCount: number;
  milestones: { tier_referrals: number; reward_label: string }[];
}) {
  const reached = milestones.filter((m) => referralCount >= m.tier_referrals);
  if (reached.length === 0) return null;

  return (
    <div className="flex gap-2 mt-1">
      {reached.map((m) => (
        <span
          key={m.tier_referrals}
          className="inline-flex items-center rounded-md border border-dashed border-accent px-2 py-0.5 text-caption text-accent"
        >
          {m.reward_label}
        </span>
      ))}
    </div>
  );
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

  const [subscribersResult, milestonesResult] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id, email, position, referral_code, created_at")
      .eq("waitlist_id", waitlist.id)
      .order("created_at", { ascending: true }),
    waitlist.milestone_rewards_enabled
      ? supabase
          .from("milestone_rewards")
          .select("tier_referrals, reward_label")
          .eq("waitlist_id", waitlist.id)
          .order("tier_referrals", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const subscribers = subscribersResult.data || [];
  const milestones = milestonesResult.data || [];

  const subscriberIds = subscribers.map((s) => s.id);
  const { data: referralCounts } = await supabase
    .from("subscribers")
    .select("referrer_id")
    .in("referrer_id", subscriberIds);

  const countMap = new Map<string, number>();
  referralCounts?.forEach((r) => {
    countMap.set(r.referrer_id, (countMap.get(r.referrer_id) || 0) + 1);
  });

  const ranked = subscribers
    .map((s) => ({
      ...s,
      referral_count: countMap.get(s.id) || 0,
    }))
    .sort((a, b) => {
      if (b.referral_count !== a.referral_count)
        return b.referral_count - a.referral_count;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    })
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-[73px] max-w-4xl items-center justify-between px-4">
          <h1 className="text-h3 text-foreground">
            {waitlist.headline} — Leaderboard
          </h1>
          <Link
            href={`/${subdomain}`}
            className="text-body-sm text-accent hover:text-accent/80"
          >
            Back to waitlist
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {ranked.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-muted-foreground">
              No subscribers yet. Be the first to join!
            </p>
            <Link
              href={`/${subdomain}`}
              className="inline-block mt-4 text-body-sm text-accent hover:text-accent/80"
            >
              Join the waitlist
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {ranked.map((subscriber) => (
              <div
                key={subscriber.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-6 gap-2"
              >
                <div className="flex items-center gap-4">
                  <span className="text-body-sm text-muted-foreground w-8">
                    #{subscriber.rank}
                  </span>
                  <div>
                    <span className="text-body font-medium text-foreground">
                      {anonymizeEmail(subscriber.email)}
                    </span>
                    {milestones.length > 0 && (
                      <MilestoneBadges
                        referralCount={subscriber.referral_count}
                        milestones={milestones}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className="text-body-sm font-semibold text-foreground">
                    {subscriber.referral_count}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    referrals
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
