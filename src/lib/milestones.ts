import { createClient } from "@/lib/supabase/server";
import { sendEmail, buildEmailFooter } from "@/lib/email";

interface MilestoneTier {
  threshold: number;
  label: string;
  earned_at: string;
}

function buildMilestoneEmailHTML(
  tier: { tier_referrals: number; reward_label: string },
  referralCount: number,
  waitlist: {
    product_name: string | null;
    headline: string | null;
    business_address?: string | null;
  } | null
): string {
  const name = waitlist?.product_name || waitlist?.headline || "the waitlist";
  const footerHtml = buildEmailFooter(waitlist?.business_address);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Congratulations!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 40px;">
                <h1 style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 30px; font-weight: bold; color: #1a1a1a;">Congratulations!</h1>
                <p style="margin: 0 0 16px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #4b5563;">
                  You've referred ${referralCount} friends to <strong>${name}</strong> and earned: <strong style="color: #0F7A5E;">${tier.reward_label}</strong>
                </p>
                <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; color: #4b5563;">
                  Keep sharing to unlock more rewards!
                </p>
              </td>
            </tr>
          </table>
          <div style="line-height: 32px; height: 32px;">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 0 40px;" align="center">
                ${footerHtml}
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function checkAndFulfillMilestones(
  subscriberId: string,
  waitlistId: string,
  referralCount: number
) {
  try {
    const supabase = await createClient();

    const { data: tiers } = await supabase
      .from("milestone_rewards")
      .select("tier_referrals, reward_label")
      .eq("waitlist_id", waitlistId)
      .order("tier_referrals", { ascending: true });

    if (!tiers || tiers.length === 0) return;

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("email, milestones_earned, milestones_notified, position")
      .eq("id", subscriberId)
      .single();

    if (!subscriber) return;

    const earned: MilestoneTier[] =
      (subscriber.milestones_earned as MilestoneTier[]) || [];
    const notified: number[] =
      (subscriber.milestones_notified as number[]) || [];

    const newEarned: MilestoneTier[] = [...earned];
    const newNotified: number[] = [...notified];
    const emailsToSend: {
      tier: { tier_referrals: number; reward_label: string };
      waitlist: {
        product_name: string | null;
        headline: string | null;
        sender_name: string | null;
        sending_domain: string | null;
      } | null;
    }[] = [];
    let positionUpdate: { position?: number } = {};

    for (const tier of tiers) {
      const threshold = tier.tier_referrals;

      if (newEarned.some((e) => e.threshold === threshold)) continue;
      if (referralCount < threshold) continue;

      newEarned.push({
        threshold,
        label: tier.reward_label,
        earned_at: new Date().toISOString(),
      });

      if (!newNotified.includes(threshold)) {
        newNotified.push(threshold);

        const { data: waitlist } = await supabase
          .from("waitlists")
          .select(
            "product_name, headline, sender_name, sending_domain, business_address"
          )
          .eq("id", waitlistId)
          .single();

        emailsToSend.push({
          tier: { tier_referrals: threshold, reward_label: tier.reward_label },
          waitlist,
        });

        if (tier.reward_label.toLowerCase().includes("skip the line")) {
          positionUpdate = { position: 1 };
        }
      }
    }

    if (newEarned.length === earned.length) return;

    await supabase
      .from("subscribers")
      .update({
        milestones_earned: newEarned,
        milestones_notified: newNotified,
        ...positionUpdate,
      })
      .eq("id", subscriberId);

    for (const email of emailsToSend) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject: `Congratulations! You earned: ${email.tier.reward_label}`,
          html: buildMilestoneEmailHTML(
            email.tier,
            referralCount,
            email.waitlist
          ),
          stream: "transactional",
          senderName: email.waitlist?.sender_name,
          productName: email.waitlist?.product_name,
          headline: email.waitlist?.headline,
          sendingDomain: email.waitlist?.sending_domain,
        });
      } catch (err) {
        console.error(
          `Milestone email failed for subscriber ${subscriberId}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error(
      `checkAndFulfillMilestones failed for subscriber ${subscriberId}:`,
      err
    );
  }
}
