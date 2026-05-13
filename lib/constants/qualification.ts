import type { QualLeadType, QualHeat, QualQuestion, QualHeatThresholds, QualReplyTemplates } from "@/lib/supabase/types";

export const LEAD_TYPE_LABELS: Record<QualLeadType, string> = {
  landlord:               "Landlord",
  investor:               "Investor",
  developer:              "Developer",
  letting_agent:          "Letting Agent",
  tenant:                 "Tenant",
  maintenance_inquiry:    "Maintenance Inquiry",
  website_app_prospect:   "Website / App Prospect",
  ai_automation_prospect: "AI Automation Prospect",
  sourcer:                "Property Sourcer",
  sa_operator:            "SA Operator",
};

export const HEAT_CONFIG: Record<QualHeat, { label: string; bg: string; color: string; dot: string; border: string }> = {
  hot:  { label: "Hot",  bg: "bg-red-50",    color: "text-red-700",    dot: "bg-red-500",    border: "border-red-200" },
  warm: { label: "Warm", bg: "bg-amber-50",  color: "text-amber-700",  dot: "bg-amber-500",  border: "border-amber-200" },
  cold: { label: "Cold", bg: "bg-blue-50",   color: "text-blue-700",   dot: "bg-blue-400",   border: "border-blue-200" },
};

export function computeScore(questions: QualQuestion[], answers: Record<string, string>): number {
  let total = 0;
  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer) continue;
    if (q.type === "select" && q.options) {
      const opt = q.options.find(o => o.value === answer);
      if (opt) total += opt.score * (q.weight ?? 1);
    }
  }
  return total;
}

export function maxScore(questions: QualQuestion[]): number {
  let total = 0;
  for (const q of questions) {
    if (q.type === "select" && q.options) {
      const max = Math.max(...q.options.map(o => o.score));
      total += max * (q.weight ?? 1);
    }
  }
  return total;
}

export function computeHeat(score: number, thresholds: QualHeatThresholds): QualHeat {
  const pct = thresholds.hot > 0 ? (score / thresholds.hot) * 100 : 0;
  if (pct >= 100) return "hot";
  if (score >= thresholds.warm) return "warm";
  return "cold";
}

export function getSuggestedReply(templates: QualReplyTemplates, heat: QualHeat): string {
  return templates[heat] ?? "";
}

export function scorePercent(score: number, questions: QualQuestion[]): number {
  const max = maxScore(questions);
  if (!max) return 0;
  return Math.round((score / max) * 100);
}
