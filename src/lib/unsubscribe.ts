import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET environment variable is required");
  }
  return secret;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://prewaitlist.com";

export function generateUnsubscribeToken(subscriberId: string): string {
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(subscriberId)
    .digest("hex");
  return `${subscriberId}.${hmac}`;
}

export function generateUnsubscribeUrl(subscriberId: string): string {
  const token = generateUnsubscribeToken(subscriberId);
  return `${BASE_URL}/api/unsubscribe?token=${token}`;
}

export function generateUnsubscribePageUrl(subscriberId: string): string {
  const token = generateUnsubscribeToken(subscriberId);
  return `${BASE_URL}/unsubscribe?token=${token}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [subscriberId, providedHmac] = token.split(".");
  if (!subscriberId || !providedHmac) return null;

  const expectedHmac = crypto
    .createHmac("sha256", getSecret())
    .update(subscriberId)
    .digest("hex");

  if (providedHmac.length !== expectedHmac.length) return null;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(providedHmac, "hex"),
    Buffer.from(expectedHmac, "hex")
  );
  return isValid ? subscriberId : null;
}
