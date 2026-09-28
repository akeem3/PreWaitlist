/**
 * Broadcast subject/body length caps — shared between the server route
 * (Story 17.0 AC1) and the compose client (Story 17.2 AC5).
 *
 * Dependency-free by design: the Client Component imports this module, so
 * it must never chain into `@/lib/resend` or server-only code.
 */
export const BROADCAST_SUBJECT_MAX = 200;
export const BROADCAST_BODY_MAX = 10_000;
