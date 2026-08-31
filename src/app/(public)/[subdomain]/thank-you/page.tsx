import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PoweredByFooter } from "../../../../../components/share/powered-by-footer";
import { ReferralLink } from "../../../../../components/share/referral-link";
import { ShareButtons } from "../../../../../components/share/share-buttons";

type Props = {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ subscriber_id?: string; referral_code?: string }>;
};

export default async function ThankYouPage({ params, searchParams }: Props) {
  const { subdomain } = await params;
  const { subscriber_id, referral_code } = await searchParams;

  if (!subscriber_id || !referral_code) {
    notFound();
  }

  const supabase = await createClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select(
      `
      id, email, position, referral_code, referrer_id,
      waitlists!inner (
        id, subdomain, headline,
        founder_profiles!inner ( tier )
      )
    `
    )
    .eq("id", subscriber_id)
    .eq("referral_code", referral_code)
    .single();

  if (!subscriber) notFound();

  const waitlist = subscriber.waitlists as unknown as {
    id: string;
    subdomain: string;
    headline: string;
    founder_profiles: { tier: string }[];
  };
  const founderProfile = Array.isArray(waitlist.founder_profiles)
    ? waitlist.founder_profiles[0]
    : waitlist.founder_profiles;
  const tier = founderProfile?.tier || "free";

  const headersList = await headers();
  const host = headersList.get("host") || `${subdomain}.prewaitlist.com`;
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const referralLink = `${protocol}://${host}?ref=${referral_code}`;

  let referrerEmail: string | null = null;
  if (subscriber.referrer_id) {
    const { data: referrer } = await supabase
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

        <input
          type="text"
          placeholder="What should we call you? (optional)"
          className="mt-8 h-[52px] w-full rounded-[12px] border border-border bg-card px-4 text-body text-center placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <p className="text-body-sm text-muted-foreground mt-8 text-center">
          Refer 3 friends for early access — share your link:
        </p>

        <ReferralLink url={referralLink} className="mt-3 w-full" />

        <ShareButtons url={referralLink} className="mt-4 w-full" />

        <a
          href={`/${subdomain}/leaderboard`}
          className="text-body-lg font-semibold text-accent mt-8 hover:underline"
        >
          See where you rank →
        </a>
      </div>

      {tier === "free" && (
        <div className="mt-auto w-full max-w-[400px] pt-8">
          <PoweredByFooter template="minimal" />
        </div>
      )}
    </div>
  );
}
