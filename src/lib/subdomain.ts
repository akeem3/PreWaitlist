export const RESERVED_SUBDOMAINS = [
  "api",
  "www",
  "app",
  "admin",
  "dashboard",
  "onboarding",
  "signin",
  "signup",
  "verify-email",
] as const;

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidSubdomain(value: unknown): value is string {
  return typeof value === "string" && SUBDOMAIN_PATTERN.test(value);
}

export function isReservedSubdomain(value: string): boolean {
  const normalized = value.toLowerCase();
  return RESERVED_SUBDOMAINS.some((reserved) => reserved === normalized);
}
