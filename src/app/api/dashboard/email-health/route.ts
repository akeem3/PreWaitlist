import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const QUOTA_ERROR_NAMES = [
  "daily_quota_exceeded",
  "monthly_quota_exceeded",
  "rate_limit_exceeded",
];

/**
 * 3.1d: reliable leg of the founder quota warning. Returns whether any of
 * the founder's waitlists logged quota-classified email failures
 * (`failed` / `delivery_delayed` with a quota `error_name` in event_data)
 * in the last 24h. The `QuotaWarningBanner` polls this on mount.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: lists } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id);
  const ids = ((lists ?? []) as { id: string }[]).map((l) => l.id);

  if (ids.length === 0) {
    return NextResponse.json({
      quotaHit: false,
      kind: null,
      failedCount24h: 0,
      lastFailureAt: null,
    });
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("email_events")
    .select("event_data, created_at")
    .in("waitlist_id", ids)
    .in("event_type", ["failed", "delivery_delayed"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  const quota = (
    (rows ?? []) as {
      event_data?: { error_name?: string } | null;
      created_at: string;
    }[]
  ).filter((r) => QUOTA_ERROR_NAMES.includes(r.event_data?.error_name ?? ""));

  if (quota.length === 0) {
    return NextResponse.json({
      quotaHit: false,
      kind: null,
      failedCount24h: 0,
      lastFailureAt: null,
    });
  }

  const kind = quota.some(
    (r) => r.event_data?.error_name === "monthly_quota_exceeded"
  )
    ? "monthly"
    : "daily";

  return NextResponse.json({
    quotaHit: true,
    kind,
    failedCount24h: quota.length,
    lastFailureAt: quota[0].created_at,
  });
}
