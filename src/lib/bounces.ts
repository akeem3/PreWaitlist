import { SupabaseClient } from "@supabase/supabase-js";

export async function isEmailBounced(
  supabase: SupabaseClient,
  waitlistId: string,
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from("bounced_emails")
    .select("id, bounce_type, created_at")
    .eq("waitlist_id", waitlistId)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;

  // Hard bounces: always suppressed
  if (data.bounce_type === "hard") return true;

  // Soft bounces: suppressed for 24 hours
  const bounceTime = new Date(data.created_at).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (Date.now() - bounceTime < twentyFourHours) return true;

  // Soft bounce older than 24h: allow retry, delete the record
  await supabase.from("bounced_emails").delete().eq("id", data.id);
  return false;
}
