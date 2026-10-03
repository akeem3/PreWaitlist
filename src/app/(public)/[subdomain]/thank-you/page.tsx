import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { PoweredByFooter } from "../../../../../components/share/powered-by-footer";
import { ReferralLink } from "../../../../../components/share/referral-link";
import { ShareButtons } from "../../../../../components/share/share-buttons";
import { ThankYouNameInput } from "../../../../../components/public/thank-you-name-input";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ subscriber_id?: string; referral_code?: string }>;
};

// Title reuses the on-page heading (founder decision 2026-10-03). Recovery
// state keeps the root title rather than exposing "Invalid link" in tabs.
export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { subscriber_id, referral_code } = await searchParams;
  if (!subscriber_id || !referral_code) return {};

  const admin = createAdminClient();
  const { data } = await admin
    .from("subscribers")
    .select("waitlists!inner ( headline )")
    .eq("id", subscriber_id)
    .eq("referral_code", referral_code)
    .single();

  const waitlists = (data?.waitlists ?? null) as unknown as {
    headline: string;
  } | null;
  const headline = waitlists?.headline?.trim();
  if (!headline) return {};

  return { title: `${headline} — You're in.` };
}

/**
 * 4.6 recovery UI: stale/incomplete thank-you links render a way back
 * instead of a bare 404. Copy reuses existing strings only ("Invalid
 * link", the generic error line, and the leaderboard page's back link).
 */
function recoveryCard(subdomain: string) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
      <div className="flex w-full max-w-[400px] flex-col items-center text-center">
        <h1 className="text-h2 text-foreground">Invalid link</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Something went wrong. Please try again.
        </p>
        <a
          href={`/${subdomain}`}
          className="text-body-lg font-semibold text-accent mt-8 hover:underline"
        >
          ← Back to waitlist
        </a>
      </div>
    </div>
  );
}

export default async function ThankYouPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const { subscriber_id, referral_code } = await searchParams;

  if (!subscriber_id || !referral_code) {
    return recoveryCard(subdomain);
  }

  const admin = createAdminClient();

  const { data: subscriber } = await admin
    .from("subscribers")
    .select(
      `
      id, email, position, referral_code, referrer_id,
      waitlists!inner (
        id, subdomain, headline, template, brand_color, logo_url, cta_text,
        milestone_rewards_enabled, is_archived,
        founder_profiles!inner ( tier )
      )
    `
    )
    .eq("id", subscriber_id)
    .eq("referral_code", referral_code)
    .single();

  if (!subscriber) {
    return recoveryCard(subdomain);
  }

  const waitlist = subscriber.waitlists as unknown as {
    id: string;
    subdomain: string;
    headline: string;
    template: string;
    brand_color: string;
    logo_url: string | null;
    cta_text: string;
    milestone_rewards_enabled: boolean;
    is_archived: boolean;
    founder_profiles: { tier: string }[];
  };
  const founderProfile = Array.isArray(waitlist.founder_profiles)
    ? waitlist.founder_profiles[0]
    : waitlist.founder_profiles;
  const tier = founderProfile?.tier || "free";

  // 4.3: archived waitlists hide the public surface (matches the main page).
  if (waitlist.is_archived) {
    redirect(`/${subdomain}/gone`);
  }

  const { data: milestoneRewardsData } = waitlist.milestone_rewards_enabled
    ? await admin
        .from("milestone_rewards")
        .select("tier_referrals, reward_label")
        .eq("waitlist_id", waitlist.id)
        .order("tier_referrals", { ascending: true })
    : { data: [] };

  const milestoneRewards = (milestoneRewardsData || []).map((r) => ({
    threshold: r.tier_referrals,
    label: r.reward_label,
  }));

  const headersList = await headers();
  const host = headersList.get("host") || `${subdomain}.prewaitlist.com`;
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const referralLink = `${protocol}://${host}?ref=${referral_code}`;

  let referrerEmail: string | null = null;
  if (subscriber.referrer_id) {
    const { data: referrer } = await admin
      .from("subscribers")
      .select("email")
      .eq("id", subscriber.referrer_id)
      .single();
    referrerEmail = referrer?.email || null;
  }

  const isReferred = !!subscriber.referrer_id && !!referrerEmail;
  const referrerName = referrerEmail
    ? referrerEmail.split("@")[0].charAt(0).toUpperCase() +
      referrerEmail.split("@")[0].slice(1)
    : null;

  const { count: referralCount } = await admin
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", subscriber.id);

  // Progress targets the NEXT unearned tier — never a tier the subscriber has
  // already passed (count 12 vs. first tier 3 rendered "12 of 3").
  const nextTier = milestoneRewards.find(
    (r) => r.threshold > (referralCount ?? 0)
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <svg
            className="h-8 w-8 text-accent-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="text-h2 text-foreground">You&apos;re in.</h1>

        <ThankYouNameInput
          subscriberId={subscriber.id}
          referralCode={referral_code}
        />

        <p className="text-body text-muted-foreground mt-2">
          You&apos;re{" "}
          <span className="font-semibold text-accent">
            #{subscriber.position}
          </span>{" "}
          on the waitlist
        </p>

        {isReferred && referrerName && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-body-sm text-accent">
            Referred by <span className="font-semibold">{referrerName}</span>
          </span>
        )}

        {milestoneRewards.length > 0 ? (
          <div className="mt-8 w-full text-center">
            {nextTier && (
              <p className="text-body-sm text-muted-foreground mb-3">
                {`You've referred ${referralCount ?? 0} of ${nextTier.threshold} friends toward: ${nextTier.label}`}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {milestoneRewards.map((r) => (
                <div
                  key={r.threshold}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  {r.threshold} → {r.label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground mt-8 text-center">
            Share your link to move up the waitlist:
          </p>
        )}

        <ReferralLink url={referralLink} className="mt-3 w-full" />

        <ShareButtons url={referralLink} className="mt-4 w-full" />

        <a
          href={`/${subdomain}/leaderboard?subscriber_id=${subscriber.id}`}
          className="text-body-lg font-semibold text-accent mt-8 hover:underline"
        >
          See where you rank →
        </a>
      </div>

      {tier === "free" && (
        <div className="mt-auto w-full max-w-[400px] pt-8">
          <PoweredByFooter
            template={waitlist.template as "minimal" | "bold" | "dark"}
            standalone
          />
        </div>
      )}
    </div>
  );
}
