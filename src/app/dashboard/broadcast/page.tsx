import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import BroadcastClient from "./client";
import BroadcastFreeGate from "./free-gate";

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
    .maybeSingle();

  const tier = profile?.tier ?? "free";

  // Story 17.4 AC2 (Standing Decision B11): Free founders hitting this URL
  // directly get the upgrade path (modal open, trigger "broadcast" — same as
  // the sidebar lock path), not a silent redirect. Unauthenticated still
  // redirects to /signin above (AC1).
  if (tier !== "pro") {
    return <BroadcastFreeGate />;
  }

  const { wid } = await searchParams;

  let wlQuery = supabase
    .from("waitlists")
    .select(
      "id, product_name, headline, subdomain, sender_name, sending_domain"
    );
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.maybeSingle();

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  return (
    <BroadcastClient
      waitlistId={waitlist.id}
      productName={waitlist.product_name}
      headline={waitlist.headline}
      subdomain={waitlist.subdomain}
      senderName={waitlist.sender_name}
      sendingDomain={waitlist.sending_domain ?? null}
    />
  );
}
