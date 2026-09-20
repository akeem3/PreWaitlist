import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, resend_domain_id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist?.resend_domain_id) {
    return NextResponse.json(
      { error: "No domain registered" },
      { status: 400 }
    );
  }

  try {
    // Trigger verification check
    const verifyResult = await resend.domains.verify(waitlist.resend_domain_id);
    if (verifyResult.error) {
      return NextResponse.json(
        { error: verifyResult.error.message },
        { status: 400 }
      );
    }

    // Fetch updated domain status
    const getResult = await resend.domains.get(waitlist.resend_domain_id);
    if (getResult.error) {
      return NextResponse.json(
        { error: getResult.error.message },
        { status: 400 }
      );
    }

    const domainData = getResult.data;

    // If verified, update sending_domain
    if (domainData.status === "verified") {
      await supabase
        .from("waitlists")
        .update({ sending_domain: domainData.name })
        .eq("id", waitlist.id);
    }

    return NextResponse.json({
      id: domainData.id,
      name: domainData.name,
      status: domainData.status,
    });
  } catch (err) {
    console.error("[domains] verify failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
