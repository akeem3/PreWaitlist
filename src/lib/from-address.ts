/**
 * Shared from-address resolution — isomorphic, dependency-free.
 *
 * Deliberately lives outside `@/lib/email` so Client Components (e.g. the
 * broadcast compose preview, Story 17.3) can import it without pulling in
 * `@/lib/resend`, which throws at module load when RESEND_API_KEY is absent
 * — and non-NEXT_PUBLIC_ env vars are empty in the client bundle.
 */

export type Stream = "transactional" | "broadcast";

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
