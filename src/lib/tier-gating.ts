export type Tier = "free" | "pro";

interface FeatureDef {
  key: string;
  requiredTier: Tier;
  label: string;
}

const FEATURES: FeatureDef[] = [
  { key: "warmth_tracking", requiredTier: "pro", label: "Warmth tracking" },
  { key: "broadcast", requiredTier: "pro", label: "Broadcast emails" },
  { key: "csv_export", requiredTier: "free", label: "CSV export" },
  { key: "domain_auth", requiredTier: "pro", label: "Custom sender domain" },
  {
    key: "qual_questions_3_5",
    requiredTier: "pro",
    label: "3-5 qualification questions",
  },
  { key: "subscriber_cap", requiredTier: "pro", label: "500+ subscribers" },
];

const TIER_LIMITS: Record<
  Tier,
  { maxQuestions: number; maxSubscribers: number | null }
> = {
  free: { maxQuestions: 2, maxSubscribers: 500 },
  pro: { maxQuestions: 5, maxSubscribers: null },
};

export function isPro(tier: string): boolean {
  return tier === "pro";
}

export function canAccess(tier: Tier, featureKey: string): boolean {
  const feature = FEATURES.find((f) => f.key === featureKey);
  if (!feature) return false;
  if (feature.requiredTier === "free") return true;
  return tier === feature.requiredTier;
}

export function getTierLimits(tier: Tier) {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.free;
}

export function requirePro(
  tier: string,
  feature: string
): { allowed: boolean; reason?: string } {
  if (isPro(tier)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `${feature} requires a Pro subscription`,
  };
}
