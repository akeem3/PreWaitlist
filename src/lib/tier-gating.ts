export function isPro(tier: string): boolean {
  return tier === "pro";
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
