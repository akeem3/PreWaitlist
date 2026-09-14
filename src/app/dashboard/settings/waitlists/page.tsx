import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import WaitlistListClient from "./client";

export default async function WaitlistListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: waitlists } = await supabase
    .from("waitlists")
    .select("id, headline, subdomain, is_archived, product_name")
    .eq("founder_id", user.id)
    .order("created_at", { ascending: true });

  // Fetch subscriber counts for each waitlist
  const waitlistIds = waitlists?.map((w) => w.id) || [];
  const subscriberCounts = new Map<string, number>();

  if (waitlistIds.length > 0) {
    const { data: counts } = await supabase
      .from("subscribers")
      .select("waitlist_id")
      .in("waitlist_id", waitlistIds);

    counts?.forEach((row) => {
      subscriberCounts.set(
        row.waitlist_id,
        (subscriberCounts.get(row.waitlist_id) || 0) + 1
      );
    });
  }

  const waitlistsWithCounts =
    waitlists?.map((w) => ({
      ...w,
      subscriberCount: subscriberCounts.get(w.id) || 0,
    })) || [];

  return <WaitlistListClient waitlists={waitlistsWithCounts} />;
}
