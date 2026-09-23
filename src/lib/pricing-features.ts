/**
 * Single source of truth for pricing feature lists.
 * Marketing homepage, billing plan comparison, and upgrade modal must all
 * render these exact strings — do not fork copies (trust/consistency).
 */

export const FREE_FEATURES: string[] = [
  "1 waitlist, 500 signups",
  "3 templates",
  "Referral system + leaderboard",
  "2 qualification questions",
  "Qualification dashboard (basic aggregate)",
  "Warmth tracking (view)",
  "Founder updates feed",
  "Confirmation + \u2018moved up\u2019 email",
  "CSV export, all columns",
  "API access",
  "\u2014 \u2018Powered by\u2019 footer shown",
  "\u2014 No broadcast email (Pro feature)",
];

export const PRO_FEATURES: string[] = [
  "Everything in Base, plus",
  "Unlimited waitlists + signups",
  "5 qualification questions + full breakdown dashboard",
  "Broadcast email, warmth-segmented",
  "Founder updates feed",
  "Sender name + domain authentication (one-time)",
  "Branding removed",
  "New templates as released",
  "Full dashboard analytics",
];

export function isExcludedFeature(feature: string): boolean {
  return feature.startsWith("\u2014");
}
