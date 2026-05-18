import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the X-Hub-Signature-256 header that Meta sends on every webhook POST.
 * Returns true if valid (or if META_APP_SECRET is not configured — dev mode).
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // dev mode: skip verification

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signatureHeader, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Verifies Meta's webhook verification challenge (GET request).
 * Returns the challenge string if valid, null if not.
 */
export function verifyWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null,
): string | null {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) return null;
  if (mode === "subscribe" && token === verifyToken && challenge) return challenge;
  return null;
}
