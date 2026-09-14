import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import QualificationClient from "./client";

export default async function QualificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, subdomain")
    .eq("founder_id", user.id)
    .single();
  if (!waitlist) redirect("/onboarding/1");

  return <QualificationClient subdomain={waitlist.subdomain} />;
}
