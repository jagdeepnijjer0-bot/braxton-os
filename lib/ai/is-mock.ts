import "server-only";
import { cookies } from "next/headers";

/**
 * Returns true when mock AI mode should be used:
 *  1. No ANTHROPIC_API_KEY set (automatic — app must never crash)
 *  2. AI_MOCK_MODE=true env var (CI / deploy override)
 *  3. Cookie ai_mock_mode=true (user toggled in Settings → AI Lab)
 */
export async function isMockMode(): Promise<boolean> {
  if (!process.env.ANTHROPIC_API_KEY) return true;
  if (process.env.AI_MOCK_MODE === "true") return true;
  const store = await cookies();
  return store.get("ai_mock_mode")?.value === "true";
}
