import crypto from "crypto";

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET || "default-secret-change-in-production";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://prewaitlist.com";

export function generateUnsubscribeToken(subscriberId: string): string {
  const hmac = crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(subscriberId)
    .digest("hex");
  return `${subscriberId}.${hmac}`;
}

export function generateUnsubscribeUrl(subscriberId: string): string {
  const token = generateUnsubscribeToken(subscriberId);
  return `${BASE_URL}/unsubscribe?token=${token}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [subscriberId, providedHmac] = token.split(".");
  if (!subscriberId || !providedHmac) return null;

  const expectedHmac = crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(subscriberId)
    .digest("hex");

  if (providedHmac !== expectedHmac) return null;
  return subscriberId;
}
