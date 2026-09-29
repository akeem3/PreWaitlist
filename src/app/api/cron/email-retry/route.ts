import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { drainEmailRetryQueue } from "@/lib/retry-queue";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await drainEmailRetryQueue(createAdminClient());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Email retry cron job failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
