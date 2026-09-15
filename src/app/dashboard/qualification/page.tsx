import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import QualificationClient from "./client";

interface PageProps {
  searchParams: Promise<{ wid?: string }>;
}

export default async function QualificationPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { wid } = await searchParams;

  let wlQuery = supabase.from("waitlists").select("id, subdomain");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.maybeSingle();
  if (!waitlist) redirect("/onboarding/1");

  return <QualificationClient subdomain={waitlist.subdomain} />;
}
