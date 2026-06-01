// Pure demo utility functions — no server imports, safe for client components

export function scoreLabel(score: number): "low" | "medium" | "high" {
  if (score >= 30) return "high";
  if (score >= 10) return "medium";
  return "low";
}

export const SCORE_HIGH_THRESHOLD = 30;
