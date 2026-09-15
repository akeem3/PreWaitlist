import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import UpdatesClient from "./client";

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

  const { wid } = await searchParams;

  let wlQuery = supabase.from("waitlists").select("id");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.maybeSingle();

  if (!waitlist) {
    redirect("/onboarding/1");
  }

  const { data: updates } = await supabase
    .from("founder_updates")
    .select("id, body, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <UpdatesClient updates={updates ?? []} />;
}
