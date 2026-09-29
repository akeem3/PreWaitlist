import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { resolveActiveWaitlistRow } from "../../../lib/active-waitlist";
import UpdatesClient from "./client";
import UpdatesFreeGate from "./free-gate";

interface PageProps {
  searchParams: Promise<{ wid?: string }>;
}

export default async function UpdatesPage({ searchParams }: PageProps) {
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

  // 4.5: broadcast pattern — free founders get the upgrade path (modal +
  // trigger "updates"), not a silent redirect. Tier is checked before the
  // waitlist lookup (Free + bad wid → gate, not 404).
  if ((profile?.tier ?? "free") !== "pro") {
    return <UpdatesFreeGate />;
  }

  const { wid } = await searchParams;

  // 4.4: shared resolution — ?wid (validated) else newest.
  const waitlist = await resolveActiveWaitlistRow<{ id: string }>(
    supabase,
    user.id,
    wid
  );

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { data: updates } = await supabase
    .from("founder_updates")
    .select("id, body, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <UpdatesClient updates={updates ?? []} waitlistId={waitlist.id} />;
}
