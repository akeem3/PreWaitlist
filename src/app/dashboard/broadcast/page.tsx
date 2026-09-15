import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import BroadcastClient from "./client";

interface PageProps {
  searchParams: Promise<{ wid?: string }>;
}

export default async function BroadcastPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.tier ?? "free";

  if (tier !== "pro") {
    redirect("/dashboard");
  }

  const { wid } = await searchParams;

  let wlQuery = supabase
    .from("waitlists")
    .select("id, product_name, headline, subdomain, sender_name");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.single();

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { count: subscriberCount } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("waitlist_id", waitlist.id);

  return (
    <BroadcastClient
      waitlistId={waitlist.id}
      productName={waitlist.product_name}
      headline={waitlist.headline}
      subdomain={waitlist.subdomain}
      senderName={waitlist.sender_name}
      subscriberCount={subscriberCount ?? 0}
    />
  );
}
