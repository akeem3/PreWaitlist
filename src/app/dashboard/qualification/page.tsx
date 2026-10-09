import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { resolveActiveWaitlistRow } from "../../../lib/active-waitlist";
import { getStoredWaitlistPref } from "../../../lib/waitlist-pref";
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

  // 4.4: shared resolution — ?wid (validated) else preference cookie else newest.
  const storedId = await getStoredWaitlistPref();
  const waitlist = await resolveActiveWaitlistRow<{
    id: string;
    subdomain: string;
  }>(supabase, user.id, wid, "id, subdomain", storedId);
  if (!waitlist) redirect("/onboarding/1");

  return (
    <QualificationClient
      subdomain={waitlist.subdomain}
      waitlistId={waitlist.id}
    />
  );
}
