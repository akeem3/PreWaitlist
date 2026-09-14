import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import SettingsHubClient from "./client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: waitlists } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id);

  const waitlistCount = waitlists?.length ?? 0;

  return <SettingsHubClient waitlistCount={waitlistCount} />;
}
