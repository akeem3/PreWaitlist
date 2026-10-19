// Story 20.1 AC1 — PostHog client init (official Next.js 15.3+/16 pattern).
// Runs before the app becomes interactive; safe to call with no key present.
// The SDK itself is code-split and fetched after idle (see lib/analytics.ts),
// so this file stays tiny and never blocks first paint.
import { initAnalytics } from "./lib/analytics";

void initAnalytics();
