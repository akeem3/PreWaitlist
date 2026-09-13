import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import BroadcastClient from "./client";

export default async function BroadcastPage() {
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

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, product_name, headline, subdomain, sender_name")
    .eq("founder_id", user.id)
    .single();

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
