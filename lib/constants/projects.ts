import type { ProjectStage, ProjectActivityType } from "@/lib/supabase/types";

export const PROJECT_STAGES: {
  value: ProjectStage;
  label: string;
  color: string;
  bg: string;
  dot: string;
  order: number;
  defaultProgress: number;
}[] = [
  { value: "planning",    label: "Planning",    color: "text-slate-700",   bg: "bg-slate-100",   dot: "bg-slate-400",   order: 0, defaultProgress: 5  },
  { value: "demolition",  label: "Demolition",  color: "text-red-700",     bg: "bg-red-100",     dot: "bg-red-500",     order: 1, defaultProgress: 15 },
  { value: "first_fix",   label: "First Fix",   color: "text-orange-700",  bg: "bg-orange-100",  dot: "bg-orange-500",  order: 2, defaultProgress: 35 },
  { value: "second_fix",  label: "Second Fix",  color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500",   order: 3, defaultProgress: 55 },
  { value: "decorating",  label: "Decorating",  color: "text-violet-700",  bg: "bg-violet-100",  dot: "bg-violet-500",  order: 4, defaultProgress: 75 },
  { value: "snagging",    label: "Snagging",    color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500",    order: 5, defaultProgress: 90 },
  { value: "completed",   label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500", order: 6, defaultProgress: 100},
  { value: "on_hold",     label: "On Hold",     color: "text-gray-600",    bg: "bg-gray-100",    dot: "bg-gray-400",    order: 7, defaultProgress: 0  },
];

export const ACTIVE_PROJECT_STAGES = PROJECT_STAGES.filter(s => s.value !== "on_hold");

export const PROJECT_ACTIVITY_TYPES: { value: ProjectActivityType; label: string; icon: string }[] = [
  { value: "note",         label: "Note",          icon: "📝" },
  { value: "call",         label: "Call",          icon: "📞" },
  { value: "email",        label: "Email",         icon: "✉️" },
  { value: "meeting",      label: "Meeting",       icon: "📅" },
  { value: "cost_update",  label: "Cost Update",   icon: "💸" },
  { value: "photo",        label: "Photo Note",    icon: "📷" },
  { value: "stage_change", label: "Stage Change",  icon: "🔄" },
  { value: "created",      label: "Created",       icon: "✅" },
];

export const LOGGABLE_PROJECT_ACTIVITIES = PROJECT_ACTIVITY_TYPES.filter(
  (t) => !["stage_change", "created"].includes(t.value)
);

export const COST_CATEGORIES = [
  "Labour", "Materials", "Plumbing", "Electrics", "Plastering",
  "Roofing", "Windows & Doors", "Flooring", "Kitchen", "Bathroom",
  "Decoration", "Landscaping", "Professional Fees", "Other",
];

// ── Helpers ──────────────────────────────────────────────────

export function getProjectStage(value: string | null) {
  return PROJECT_STAGES.find((s) => s.value === value) ?? PROJECT_STAGES[0];
}

export function getProjectActivityType(value: string | null) {
  return PROJECT_ACTIVITY_TYPES.find((t) => t.value === value) ?? PROJECT_ACTIVITY_TYPES[0];
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value}%`;
}

export function budgetVariance(budget: number | null, spent: number | null): number | null {
  if (budget == null || spent == null) return null;
  return budget - spent;
}

export function budgetUsedPercent(budget: number | null, spent: number | null): number {
  if (!budget || !spent) return 0;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

export function nextProjectStage(current: ProjectStage): ProjectStage | null {
  const stages = ACTIVE_PROJECT_STAGES;
  const cur = stages.find((s) => s.value === current);
  if (!cur) return null;
  const next = stages.find((s) => s.order === cur.order + 1);
  return next?.value ?? null;
}

export function prevProjectStage(current: ProjectStage): ProjectStage | null {
  const stages = ACTIVE_PROJECT_STAGES;
  const cur = stages.find((s) => s.value === current);
  if (!cur || cur.order === 0) return null;
  const prev = stages.find((s) => s.order === cur.order - 1);
  return prev?.value ?? null;
}
