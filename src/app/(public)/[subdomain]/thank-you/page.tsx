import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PoweredByFooter } from "../../../../../components/share/powered-by-footer";
import { ReferralLink } from "../../../../../components/share/referral-link";
import { ShareButtons } from "../../../../../components/share/share-buttons";
import { anonymizeEmail } from "@/lib/format";

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

  const referralLink = `https://${subdomain}.prewaitlist.com?ref=${referral_code}`;

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

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
      {isReferred && (
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <svg
              className="h-7 w-7 text-accent-foreground"
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
          <div className="text-center">
            <p className="text-body-lg font-semibold text-foreground">
              Referred by a friend
            </p>
            <p className="text-body-sm text-muted-foreground">
              {anonymizeEmail(referrerEmail!)} invited you to join
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[666px] rounded-xl bg-card p-10 shadow-[var(--shadow-float)]">
        <div className="mb-2 text-center">
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-body-sm font-medium text-accent">
            Refer a friend. Get rewarded.
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-h2 text-foreground">You&apos;re in the line!</h1>
          <p className="text-body text-muted-foreground mt-2">
            You&apos;re{" "}
            <span className="font-semibold text-foreground">
              #{subscriber.position}
            </span>{" "}
            in line. Share your unique link to move up.
          </p>
        </div>

        <div className="mt-6">
          <p className="text-caption text-muted-foreground mb-1.5 text-center">
            Your referral link
          </p>
          <ReferralLink url={referralLink} />
        </div>

        <div className="mt-6">
          <p className="text-caption text-muted-foreground mb-3 text-center font-semibold">
            Share your link
          </p>
          <ShareButtons url={referralLink} />
        </div>
      </div>

      {tier === "free" && (
        <div className="mt-8 w-full max-w-[666px]">
          <PoweredByFooter template="minimal" />
        </div>
      )}
    </div>
  );
}
