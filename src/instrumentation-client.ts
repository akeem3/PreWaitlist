// Story 20.1 AC1 — PostHog client init (official Next.js 15.3+/16 pattern).
// Runs before the app becomes interactive; safe to call with no key present.
import { initAnalytics } from "./lib/analytics";

initAnalytics();
