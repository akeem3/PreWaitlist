/**
 * Client-safe email shell — shared by the broadcast send route, the updates
 * send route, AND the broadcast compose preview so preview === send
 * (Story 17.3 precedent).
 *
 * Dependency-free by design: Client Components import this module, so it
 * must never chain into `@/lib/email` (module-level `resend` import throws
 * without RESEND_API_KEY) or any server-only code. The address constant
 * lives here for the same reason — `@/lib/email` imports it from this file.
 *
 * Prompt #8 (2026-10-10): replaces the broadcast route's bare `<div>` shell
 * and the updates route's hand-rolled template with one HTML-email-grade
 * document: doctype, table layout, 600px card, brand header, hidden
 * preheader, optional CTA button, footer slot.
 */

export const EMAIL_DEFAULT_ADDRESS =
  "PreWaitlist Inc., 548 Market St, Suite 35000, San Francisco, CA 94104";

/** Broadcast CTA label — founder-approved verbatim (2026-10-10). */
export const BROADCAST_CTA_LABEL = "Read more";
/** Founder-update CTA label — founder-approved verbatim (2026-10-10). */
export const UPDATE_CTA_LABEL = "See all updates";
/** Broadcast CTA URL validation error — founder-approved verbatim (2026-10-10). */
export const CTA_URL_ERROR = "Invalid link URL";

const CTA_URL_MAX = 2048;
const PREHEADER_MAX = 100;

/**
 * Escape a string for safe interpolation into HTML email markup.
 * Mirrors `escapeHtml` in `@/lib/email` (which is not client-importable).
 */
export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validate the optional per-broadcast CTA link.
 * - absent / empty → { ok: true, url: null } (no CTA rendered)
 * - present but unusable → { ok: false, error: CTA_URL_ERROR } (server 400,
 *   client blocks send)
 * Only http/https pass — `javascript:` and friends are rejected at parse.
 */
export function validateCtaUrl(
  value: unknown
): { ok: true; url: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, url: null };
  if (typeof value !== "string") return { ok: false, error: CTA_URL_ERROR };

  const trimmed = value.trim();
  if (trimmed === "") return { ok: true, url: null };
  if (trimmed.length > CTA_URL_MAX) return { ok: false, error: CTA_URL_ERROR };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: CTA_URL_ERROR };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: CTA_URL_ERROR };
  }
  return { ok: true, url: trimmed };
}

/** Strip HTML tags (used for preheader + plain-text derivation). */
function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

/**
 * Hidden preheader: first ~100 chars of the body, tags stripped,
 * whitespace collapsed, HTML-escaped. Derived — no extra copy authored.
 * Returns an HTML-escaped string ready for embedding.
 */
export function derivePreheader(value: string): string {
  const text = stripTags(value).replace(/\s+/g, " ").trim();
  const clipped =
    text.length > PREHEADER_MAX ? `${text.slice(0, PREHEADER_MAX - 1)}…` : text;
  return escapeEmailHtml(clipped);
}

/**
 * Plain-text part for multipart payloads (text-forward placement leans
 * Primary per deliverability research — Prompt #8 Phase 2).
 * Unescapes the 5 HTML entities after tag stripping (order: `&` last).
 */
export function htmlToText(value: string): string {
  const withBreaks = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return stripped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface EmailShellParams {
  /** `<title>` content — escape handled by the shell. */
  title: string;
  /** Already-escaped preheader (use `derivePreheader`). */
  preheader: string;
  /** Brand line at the top of the card (product name — data, not copy). */
  brandName: string;
  /** Caller-sanitized body markup (broadcast: `sanitizeEmailHtml`, updates: `escapeHtml` wrapper). */
  bodyHtml: string;
  /** Validated link + approved label; null omits the button. */
  cta: { url: string; label: string } | null;
  /** Caller-built footer markup (address + unsubscribe). */
  footerHtml?: string | null;
  /**
   * Preview mode: return only the visible body content (preheader + card +
   * footer) — no doctype/html/head. The compose preview injects this via
   * `dangerouslySetInnerHTML`, where `<head>`-only elements would leak into
   * the page. Visual output is identical; only the document wrapper differs.
   */
  fragment?: boolean;
}

const CTA_BLOCK = (url: string, label: string) => `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 0 0;">
              <tr>
                <td align="center" bgcolor="#0F7A5E" style="border-radius: 6px;">
                  <a href="${url}" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">${label}</a>
                </td>
              </tr>
            </table>`;

/**
 * Build the full HTML email document. Colors are fixed email-side
 * (emails are inline-styled by nature): card #ffffff on #f9fafb with
 * #e5e7eb border, brand/CTA accent #0F7A5E.
 */
export function buildEmailShell(params: EmailShellParams): string {
  const title = escapeEmailHtml(params.title);
  const brand = escapeEmailHtml(params.brandName);
  const cta = params.cta
    ? CTA_BLOCK(
        escapeEmailHtml(params.cta.url),
        escapeEmailHtml(params.cta.label)
      )
    : "";
  const footer = params.footerHtml ?? "";

  const content = `  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px;">${params.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 24px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0F7A5E;">${brand}</p>
                ${params.bodyHtml}${cta}
              </td>
            </tr>
          </table>
          <div style="line-height: 32px; height: 32px;">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding: 0 40px;">${footer}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
  </table>`;

  if (params.fragment) return content;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
${content}
</body>
</html>`;
}

/**
 * Preview-only footer: same structure as the send-path footer from
 * `@/lib/email` (address + Unsubscribe), but the link points at `#` —
 * the preview has no subscriber to mint a real token for. Visual parity
 * without a valid (misdirected) unsubscribe URL.
 */
export function buildEmailPreviewFooter(
  businessAddress?: string | null
): string {
  const address = escapeEmailHtml(
    businessAddress?.trim() || EMAIL_DEFAULT_ADDRESS
  );
  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px 0; text-align: center;">
      ${address}
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
      <a href="#" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
    </p>`;
}
