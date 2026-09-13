import { resend } from "@/lib/resend";

type Stream = "transactional" | "broadcast";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  stream: Stream;
  senderName?: string | null;
  productName?: string | null;
  headline?: string | null;
  sendingDomain?: string | null;
  idempotencyKey?: string;
}

const DEFAULT_SENDER_NAME = "PreWaitlist";

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
    const result = await resend.emails.send(
      {
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      },
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
