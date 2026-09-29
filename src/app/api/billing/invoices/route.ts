import { NextResponse } from "next/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { createClient } from "@/lib/supabase/server";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: string | null;
  currency: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("paddle_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.paddle_subscription_id) {
    return NextResponse.json({ invoices: [] });
  }

  try {
    const collection = paddle.transactions.list({
      subscriptionId: [profile.paddle_subscription_id],
      status: ["paid", "completed"],
      perPage: 20,
      orderBy: "billed_at[DESC]",
    });

    const invoices: InvoiceSummary[] = [];

    for await (const tx of collection) {
      if (invoices.length >= 20) break;
      invoices.push({
        id: tx.id,
        invoiceNumber: tx.invoiceNumber ?? tx.id,
        date: tx.billedAt ?? tx.createdAt,
        amount: tx.details?.totals?.grandTotal ?? null,
        currency: tx.details?.totals?.currencyCode ?? tx.currencyCode,
      });
    }

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("Failed to list Paddle invoices:", err);
    return NextResponse.json(
      { error: "Failed to load invoices" },
      { status: 502 }
    );
  }
}
