import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import UpdatesClient from "./client";

export default async function UpdatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

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
