import { NextResponse, type NextRequest } from "next/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { createClient } from "@/lib/supabase/server";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

type Props = { params: Promise<{ transactionId: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { transactionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("paddle_customer_id, paddle_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.paddle_customer_id && !profile?.paddle_subscription_id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  let tx: Awaited<ReturnType<typeof paddle.transactions.get>>;
  try {
    tx = await paddle.transactions.get(transactionId);
  } catch (err) {
    console.error("Paddle transaction lookup failed:", err);
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Ownership: the transaction must belong to this founder's customer or
  // subscription — never serve another customer's invoice PDF.
  const owned =
    (!!profile.paddle_customer_id &&
      tx.customerId === profile.paddle_customer_id) ||
    (!!profile.paddle_subscription_id &&
      tx.subscriptionId === profile.paddle_subscription_id);

  if (!owned) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  try {
    const pdf = await paddle.transactions.getInvoicePDF(transactionId);
    return NextResponse.redirect(pdf.url);
  } catch (err) {
    console.error("Paddle invoice PDF fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to load invoice" },
      { status: 502 }
    );
  }
}
