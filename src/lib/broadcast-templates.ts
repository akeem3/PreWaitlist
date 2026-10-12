/**
 * Broadcast compose prefill defaults — founder-approved premade starter
 * message (2026-10-12). Tokens are baked into the copy so the founder
 * never has to type them; they interpolate at send time via the shared
 * `interpolateEmail` helper.
 *
 * Dependency-free (client-safe): imported by the broadcast Client Component.
 */

/** Default subject — approved verbatim (2026-10-12). */
export const DEFAULT_BROADCAST_SUBJECT = "Update from {{product_name}}";

/**
 * Default body — approved verbatim (2026-10-12). Plain text only;
 * the send path wraps it in the pre-wrap <p> and the preview mirrors.
 */
export const DEFAULT_BROADCAST_BODY = `Hi {{first_name}},

Quick update from {{product_name}} — thanks for being on the waitlist.

We're getting closer to launch and I wanted to share what's new.

More soon.`;
