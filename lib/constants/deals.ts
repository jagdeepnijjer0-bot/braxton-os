import type { DealStage, InvestorStatus, SolicitorStatus, DealActivityType } from "@/lib/supabase/types";

export const DEAL_STAGES: {
  value: DealStage;
  label: string;
  color: string;
  bg: string;
  dot: string;
  order: number;
}[] = [
  { value: "lead_found",          label: "Lead Found",          color: "text-slate-700",   bg: "bg-slate-100",   dot: "bg-slate-400",   order: 0 },
  { value: "reviewing",           label: "Reviewing",           color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500",    order: 1 },
  { value: "offer_made",          label: "Offer Made",          color: "text-violet-700",  bg: "bg-violet-100",  dot: "bg-violet-500",  order: 2 },
  { value: "under_negotiation",   label: "Under Negotiation",   color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500",   order: 3 },
  { value: "investor_interested", label: "Investor Interested", color: "text-cyan-700",    bg: "bg-cyan-100",    dot: "bg-cyan-500",    order: 4 },
  { value: "legals",              label: "Legals",              color: "text-indigo-700",  bg: "bg-indigo-100",  dot: "bg-indigo-500",  order: 5 },
  { value: "refurb",              label: "Refurb",              color: "text-orange-700",  bg: "bg-orange-100",  dot: "bg-orange-500",  order: 6 },
  { value: "sold_completed",      label: "Sold / Completed",    color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500", order: 7 },
  { value: "dead",                label: "Dead",                color: "text-red-600",     bg: "bg-red-50",      dot: "bg-red-400",     order: 8 },
];

// Active stages (shown as kanban columns)
export const ACTIVE_STAGES = DEAL_STAGES.filter((s) => s.value !== "dead");

export const INVESTOR_STATUSES: { value: InvestorStatus; label: string; color: string }[] = [
  { value: "none",       label: "No Investor",  color: "bg-gray-100 text-gray-500" },
  { value: "interested", label: "Interested",   color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmed",  label: "Confirmed",    color: "bg-green-100 text-green-700" },
  { value: "withdrawn",  label: "Withdrawn",    color: "bg-red-100 text-red-600" },
];

export const SOLICITOR_STATUSES: { value: SolicitorStatus; label: string; color: string }[] = [
  { value: "not_instructed", label: "Not Instructed", color: "bg-gray-100 text-gray-500" },
  { value: "instructed",     label: "Instructed",     color: "bg-blue-100 text-blue-700" },
  { value: "progressing",    label: "Progressing",    color: "bg-indigo-100 text-indigo-700" },
  { value: "completed",      label: "Completed",      color: "bg-green-100 text-green-700" },
];

export const DEAL_ACTIVITY_TYPES: { value: DealActivityType; label: string; icon: string }[] = [
  { value: "note",             label: "Note",             icon: "📝" },
  { value: "call",             label: "Call",             icon: "📞" },
  { value: "email",            label: "Email",            icon: "✉️" },
  { value: "meeting",          label: "Meeting",          icon: "📅" },
  { value: "offer_made",       label: "Offer Made",       icon: "🤝" },
  { value: "financial_update", label: "Financial Update", icon: "💰" },
  { value: "stage_change",     label: "Stage Change",     icon: "🔄" },
  { value: "created",          label: "Created",          icon: "✅" },
];

export const LOGGABLE_DEAL_ACTIVITIES = DEAL_ACTIVITY_TYPES.filter(
  (t) => !["stage_change", "created"].includes(t.value)
);

// ── Helpers ──────────────────────────────────────────────────

export function getDealStage(value: string | null) {
  return DEAL_STAGES.find((s) => s.value === value) ?? DEAL_STAGES[0];
}

export function getInvestorStatus(value: string | null) {
  return INVESTOR_STATUSES.find((s) => s.value === value) ?? INVESTOR_STATUSES[0];
}

export function getSolicitorStatus(value: string | null) {
  return SOLICITOR_STATUSES.find((s) => s.value === value) ?? SOLICITOR_STATUSES[0];
}

export function getDealActivityType(value: string | null) {
  return DEAL_ACTIVITY_TYPES.find((t) => t.value === value) ?? DEAL_ACTIVITY_TYPES[0];
}

// ── Financial formatters ──────────────────────────────────────

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatYield(monthlyRent: number | null, purchasePrice: number | null): string {
  if (!monthlyRent || !purchasePrice || purchasePrice === 0) return "—";
  const y = ((monthlyRent * 12) / purchasePrice) * 100;
  return `${y.toFixed(1)}%`;
}

export function formatROI(projectedProfit: number | null, purchasePrice: number | null): string {
  if (!projectedProfit || !purchasePrice || purchasePrice === 0) return "—";
  const roi = (projectedProfit / purchasePrice) * 100;
  return `${roi.toFixed(1)}%`;
}

export function nextStage(current: DealStage): DealStage | null {
  const cur = DEAL_STAGES.find((s) => s.value === current);
  if (!cur) return null;
  const next = DEAL_STAGES.find((s) => s.order === cur.order + 1 && s.value !== "dead");
  return next?.value ?? null;
}

export function prevStage(current: DealStage): DealStage | null {
  const cur = DEAL_STAGES.find((s) => s.value === current);
  if (!cur || cur.order === 0) return null;
  const prev = DEAL_STAGES.find((s) => s.order === cur.order - 1);
  return prev?.value ?? null;
}
