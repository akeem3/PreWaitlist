import { resend } from "@/lib/resend";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateUnsubscribeUrl } from "@/lib/unsubscribe";
import { resolveFromAddress, type Stream } from "@/lib/from-address";

// Re-export for existing server-side importers (Story 17.3 moved the
// implementation to the isomorphic `from-address` module so Client
// Components can share it without pulling in `resend`).
export { resolveFromAddress };

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
  waitlistId?: string;
  businessAddress?: string | null;
}

/**
 * Replace {{variable}} placeholders in an email template with actual values.
 * Unmatched variables are left as-is (e.g. {{unknown}} stays unchanged).
 */
export function interpolateEmail(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined && val !== "" ? String(val) : `{{${key}}}`;
  });
}

const DEFAULT_ADDRESS =
  "PreWaitlist Inc., 548 Market St, Suite 35000, San Francisco, CA 94104";

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
 * Escape a string for safe interpolation into HTML email markup.
 * Founder-authored update text is untrusted input — always escape before
 * embedding it in the HTML body. The plain-text payload keeps the raw string.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
 * Build the free-tier email footer with "Powered by PreWaitlist" branding.
 * Logo + text at the bottom, physical address below.
 */
export function buildFreeEmailFooter(businessAddress?: string | null): string {
  const address = businessAddress?.trim() || DEFAULT_ADDRESS;

  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 0 0 8px 0;">
          <a href="https://prewaitlist.com" target="_blank" style="text-decoration: none;">
            <img src="https://prewaitlist.com/PreWaitlist-logo.svg" alt="PreWaitlist" width="20" height="20" style="display: inline-block; vertical-align: middle; border: 0; margin-right: 6px;" />
            <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6B6459; vertical-align: middle;">Powered by</span>
            <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #0F7A5E; font-weight: 600; vertical-align: middle;"> PreWaitlist</span>
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size: 11px; color: #9ca3af; margin: 8px 0 0 0; text-align: center;">
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
 * Build the email footer with a pre-built unsubscribe URL (for broadcast
 * send path — Story 17.0 AC4: generate the URL once per recipient and reuse
 * it for both the List-Unsubscribe header and the body footer).
 */
export function buildBroadcastEmailFooterWithUrl(
  unsubscribeUrl: string,
  businessAddress?: string | null
): string {
  const address = businessAddress?.trim() || DEFAULT_ADDRESS;

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
 * 3.1: Resend 429 taxonomy. The SDK reports failures as
 * `{ message, statusCode, name }` (see resend@6.x `ErrorResponse`) — the
 * `name` is the exact error code (`rate_limit_exceeded`,
 * `daily_quota_exceeded`, `monthly_quota_exceeded`). A bare 429 without a
 * known name is treated as transient (HTTP-correct: retry a few times).
 */
export type ResendErrorKind =
  "rate_limit" | "daily_quota" | "monthly_quota" | "other";

export function classifyResendError(
  error: { name?: string | null; statusCode?: number | null } | null | undefined
): ResendErrorKind {
  const name = error?.name ?? "";
  if (name === "rate_limit_exceeded") return "rate_limit";
  if (name === "daily_quota_exceeded") return "daily_quota";
  if (name === "monthly_quota_exceeded") return "monthly_quota";
  if (error?.statusCode === 429) return "rate_limit";
  return "other";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type BatchSendResult = Awaited<ReturnType<typeof resend.batch.send>>;

/**
 * 3.1e: batch-send with inline transient retry for the broadcast + updates
 * chunk loops. Retries ONLY `rate_limit` failures with backoff (same chunk
 * idempotency key, so retries can never double-send). Quota failures return
 * immediately — per-item failed accounting stays 3.3's scope.
 */
export async function sendBatchWithRetry(
  emails: Parameters<typeof resend.batch.send>[0],
  options?: { idempotencyKey?: string; retryDelaysMs?: number[] }
): Promise<BatchSendResult> {
  const delays = options?.retryDelaysMs ?? [1000, 2000];
  for (let attempt = 0; ; attempt++) {
    const result = await resend.batch.send(
      emails,
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}
    );
    if (!result.error) return result;
    if (
      classifyResendError(result.error) === "rate_limit" &&
      attempt < delays.length
    ) {
      await delay(delays[attempt]);
      continue;
    }
    return result;
  }
}

/**
 * AC5: Send a transactional email via Resend's Emails API (single send).
 * AC6: Error handling — returns { ok, error } instead of throwing.
 * 3.1: preserves the Resend error classification (`errorKind`/`errorName`)
 * instead of reducing failures to a message string, and retries transient
 * `rate_limit` failures inline with backoff (same idempotency key, so
 * retries can never double-send). Quota failures are returned, never
 * retried here — daily parking lives in the retry queue, monthly is
 * dead-lettered by the caller.
 */
export async function sendEmail(
  params: SendEmailParams & { retryDelaysMs?: number[] }
): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
  errorKind?: ResendErrorKind;
  errorName?: string;
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
      tags?: { name: string; value: string }[];
    } = {
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    };

    if (params.text) {
      sendParams.text = params.text;
    }

    // AC7 (Story 15.2): pass targeting metadata to Resend. Resend has no
    // metadata field — tags are the mechanism, and webhook events echo them
    // back as data.tags for per-waitlist subscriber attribution.
    if (params.waitlistId || params.subscriberId) {
      const tags: { name: string; value: string }[] = [];
      if (params.waitlistId) {
        tags.push({ name: "waitlist_id", value: params.waitlistId });
      }
      if (params.subscriberId) {
        tags.push({ name: "subscriber_id", value: params.subscriberId });
      }
      sendParams.tags = tags;
    }

    const delays = params.retryDelaysMs ?? [1000, 2000];

    for (let attempt = 0; ; attempt++) {
      const result = await resend.emails.send(
        sendParams,
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}
      );

      if (!result.error) {
        return { ok: true, id: result.data?.id };
      }

      const kind = classifyResendError(result.error);
      if (kind === "rate_limit" && attempt < delays.length) {
        await delay(delays[attempt]);
        continue;
      }

      return {
        ok: false,
        error: result.error.message,
        errorKind: kind,
        errorName: result.error.name ?? undefined,
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
      errorKind: "other",
    };
  }
}
