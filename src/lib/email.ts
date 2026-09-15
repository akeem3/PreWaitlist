import { resend } from "@/lib/resend";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateUnsubscribeUrl } from "@/lib/unsubscribe";

type Stream = "transactional" | "broadcast";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  stream: Stream;
  senderName?: string | null;
  productName?: string | null;
  headline?: string | null;
  sendingDomain?: string | null;
  idempotencyKey?: string;
  subscriberId?: string;
  businessAddress?: string | null;
}

const DEFAULT_SENDER_NAME = "PreWaitlist";
const DEFAULT_ADDRESS =
  "PreWaitlist Inc., 548 Market St, Suite 35000, San Francisco, CA 94104";

/**
 * AC1-AC4: Resolve the from-address based on stream, sender name, and verified domain.
 *
 * Resolution chain: senderName → productName → headline → "PreWaitlist"
 * Domain: verified custom domain (if set) | notifications@ (transactional) | updates@ (broadcast)
 */
export function resolveFromAddress(
  senderName: string | null | undefined,
  productName: string | null | undefined,
  headline: string | null | undefined,
  stream: Stream,
  sendingDomain?: string | null
): string {
  const name =
    senderName?.trim() ||
    productName?.trim() ||
    headline?.trim() ||
    DEFAULT_SENDER_NAME;

  if (sendingDomain) {
    const prefix = stream === "transactional" ? "notifications" : "updates";
    return `${name} <${prefix}@${sendingDomain}>`;
  }

  const email =
    stream === "transactional"
      ? "notifications@prewaitlist.com"
      : "updates@prewaitlist.com";

  return `${name} <${email}>`;
}

/**
 * Check if a subscriber has unsubscribed.
 */
export async function isUnsubscribed(
  supabase: SupabaseClient,
  subscriberId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("subscribers")
    .select("unsubscribed_at")
    .eq("id", subscriberId)
    .single();
  return !!data?.unsubscribed_at;
}

/**
 * Build the email footer with physical address only (no unsubscribe link for transactional emails).
 */
export function buildEmailFooter(businessAddress?: string | null): string {
  const address = businessAddress?.trim() || DEFAULT_ADDRESS;

  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
      ${address}
    </p>
  `;
}

/**
 * Build the email footer with unsubscribe link (for broadcast emails).
 */
export function buildBroadcastEmailFooter(
  subscriberId: string,
  businessAddress?: string | null
): string {
  const address = businessAddress?.trim() || DEFAULT_ADDRESS;
  const unsubscribeUrl = generateUnsubscribeUrl(subscriberId);

  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px; text-align: center;">
      ${address}
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
      <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
    </p>
  `;
}

/**
 * AC5: Send a transactional email via Resend's Emails API (single send).
 * AC6: Error handling — returns { ok, error } instead of throwing.
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
}> {
  const from = resolveFromAddress(
    params.senderName,
    params.productName,
    params.headline,
    params.stream,
    params.sendingDomain
  );

  try {
    const sendParams: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      text?: string;
    } = {
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    };

    if (params.text) {
      sendParams.text = params.text;
    }

    const result = await resend.emails.send(
      sendParams,
      params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}
    );

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
