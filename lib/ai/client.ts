import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY env var is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// Model IDs — use Haiku for fast/cheap ops, Sonnet for quality summaries
export const HAIKU  = "claude-haiku-4-5-20251001" as const;
export const SONNET = "claude-sonnet-4-6"         as const;
