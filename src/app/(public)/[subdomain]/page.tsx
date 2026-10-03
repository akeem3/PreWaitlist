import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { WaitlistPageContent } from "../../../../components/public/waitlist-page-content";
import { EmailCaptureForm } from "../../../../components/public/email-capture-form";
import { LatestUpdateCard } from "../../../../components/public/updates-feed";

type Props = { params: Promise<{ subdomain: string }> };

const WAITLIST_SELECT = `
      id, subdomain, template, headline, subheadline, cta_text,
      logo_url, product_name, brand_color, qualification_enabled, milestone_rewards_enabled,
      signup_counter_enabled, signup_counter_threshold, is_archived, phone_mode,
      founder_profiles!inner ( tier )
    `;

// Single cached fetch shared by generateMetadata and the page (React cache dedupes per request)
const getWaitlist = cache(async (subdomain: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("waitlists")
    .select(WAITLIST_SELECT)
    .eq("subdomain", subdomain)
    .single();
  return { waitlist: data, supabase };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const { waitlist } = await getWaitlist(subdomain);

  if (!waitlist || waitlist.is_archived) {
    return {};
  }

  const title =
    waitlist.headline?.trim() ||
    waitlist.product_name?.trim() ||
    `${subdomain}.prewaitlist.com`;
  const description = waitlist.subheadline?.trim() || undefined;
  const url = `https://${subdomain}.prewaitlist.com`;
  // REQ-6.8.6: share cards carry the suffix the step-3 preview promises;
  // the document <title> stays the plain headline.
  const ogTitle = `${title} — Join the waitlist`;

  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title: ogTitle,
      ...(description ? { description } : {}),
      url,
      siteName: "PreWaitlist",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      ...(description ? { description } : {}),
    },
  };
}

export default async function PublicSubdomainPage({ params }: Props) {
  const { subdomain } = await params;
  const { waitlist, supabase } = await getWaitlist(subdomain);

  if (!waitlist) {
    notFound();
  }

  if (waitlist.is_archived) {
    redirect(`/${subdomain}/gone`);
  }

  const founderProfile = Array.isArray(waitlist.founder_profiles)
    ? waitlist.founder_profiles[0]
    : waitlist.founder_profiles;
  const tier = founderProfile?.tier || "free";

  // Subscribers table has no public SELECT — count via server-only admin path (14.0 AC8)
  const admin = createAdminClient();

  const [milestonesResult, questionsResult, countResult, latestUpdateResult] =
    await Promise.all([
      waitlist.milestone_rewards_enabled
        ? supabase
            .from("milestone_rewards")
            .select("tier_referrals, reward_label")
            .eq("waitlist_id", waitlist.id)
            .order("tier_referrals", { ascending: true })
        : Promise.resolve({ data: [] }),
      waitlist.qualification_enabled
        ? supabase
            .from("qualification_questions")
            .select("id, question_text, question_type, sort_order, options")
            .eq("waitlist_id", waitlist.id)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [] }),
      waitlist.signup_counter_enabled
        ? admin
            .from("subscribers")
            .select("id", { count: "exact", head: true })
            .eq("waitlist_id", waitlist.id)
        : Promise.resolve({ count: 0 }),
      supabase
        .from("founder_updates")
        .select("id, body, created_at")
        .eq("waitlist_id", waitlist.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const milestoneRewards = (milestonesResult.data || []).map((r) => ({
    threshold: r.tier_referrals,
    label: r.reward_label,
  }));

  // 14.1 AC6: pass full question shape { id, text, type, options } — not { text, required }
  const questions = (questionsResult.data || []).map((q) => ({
    id: q.id,
    text: q.question_text,
    type: (q.question_type as "free_text" | "multiple_choice") || "free_text",
    options: (q.options as string[] | null) ?? null,
  }));

  const signupCount = countResult.count ?? 0;
  const signupCounterVisible =
    waitlist.signup_counter_enabled &&
    signupCount >= (waitlist.signup_counter_threshold || 10);

  const latestUpdate = latestUpdateResult.data;

  return (
    <WaitlistPageContent
      template={waitlist.template as "minimal" | "bold" | "dark"}
      headline={waitlist.headline}
      subheadline={waitlist.subheadline}
      logoUrl={waitlist.logo_url}
      productName={waitlist.product_name}
      ctaText={waitlist.cta_text}
      brandColor={waitlist.brand_color}
      tier={tier}
      signupCounter={signupCount}
      signupCounterVisible={signupCounterVisible}
      milestoneRewards={milestoneRewards}
      emailCaptureForm={
        <Suspense>
          <EmailCaptureForm
            waitlistId={waitlist.id}
            subdomain={waitlist.subdomain}
            ctaText={waitlist.cta_text || "Join Waitlist"}
            brandColor={waitlist.brand_color}
            template={waitlist.template as "minimal" | "bold" | "dark"}
            tier={tier}
            questions={questions}
            qualificationEnabled={waitlist.qualification_enabled}
            subscriberCount={signupCount}
            phoneMode={
              waitlist.phone_mode === "optional" ||
              waitlist.phone_mode === "required"
                ? waitlist.phone_mode
                : "off"
            }
          />
        </Suspense>
      }
      latestUpdateSlot={
        latestUpdate ? (
          <LatestUpdateCard
            update={latestUpdate}
            template={waitlist.template as "minimal" | "bold" | "dark"}
          />
        ) : undefined
      }
    />
  );
}
