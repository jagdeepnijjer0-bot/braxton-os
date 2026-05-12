import type { TaskStatus, TaskPriority, TaskType, EventType } from "@/lib/supabase/types";

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string; bg: string; dot: string }[] = [
  { value: "todo",        label: "To Do",      color: "text-slate-700",   bg: "bg-slate-100",   dot: "bg-slate-400"   },
  { value: "in_progress", label: "In Progress", color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500"    },
  { value: "completed",   label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  { value: "overdue",     label: "Overdue",     color: "text-red-700",     bg: "bg-red-100",     dot: "bg-red-500"     },
  { value: "cancelled",   label: "Cancelled",   color: "text-gray-500",    bg: "bg-gray-100",    dot: "bg-gray-300"    },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string; dot: string; bg: string }[] = [
  { value: "low",    label: "Low",    color: "text-gray-500",   dot: "bg-gray-300",   bg: "bg-gray-100"   },
  { value: "medium", label: "Medium", color: "text-blue-600",   dot: "bg-blue-400",   bg: "bg-blue-50"    },
  { value: "high",   label: "High",   color: "text-amber-600",  dot: "bg-amber-500",  bg: "bg-amber-50"   },
  { value: "urgent", label: "Urgent", color: "text-red-600",    dot: "bg-red-500",    bg: "bg-red-50"     },
];

export const TASK_TYPES: { value: TaskType; label: string; icon: string; color: string }[] = [
  { value: "call",       label: "Call",       icon: "📞", color: "text-green-600"   },
  { value: "follow_up",  label: "Follow Up",  icon: "🔁", color: "text-violet-600"  },
  { value: "meeting",    label: "Meeting",    icon: "📅", color: "text-indigo-600"  },
  { value: "refurb",     label: "Refurb",     icon: "🔨", color: "text-orange-600"  },
  { value: "finance",    label: "Finance",    icon: "💰", color: "text-emerald-600" },
  { value: "outreach",   label: "Outreach",   icon: "📣", color: "text-pink-600"    },
  { value: "admin",      label: "Admin",      icon: "📋", color: "text-gray-600"    },
];

export const EVENT_TYPES: { value: EventType; label: string; icon: string; color: string; bg: string }[] = [
  { value: "meeting",   label: "Meeting",    icon: "📅", color: "text-indigo-700", bg: "bg-indigo-100"  },
  { value: "reminder",  label: "Reminder",   icon: "🔔", color: "text-amber-700",  bg: "bg-amber-100"   },
  { value: "deadline",  label: "Deadline",   icon: "⏰", color: "text-red-700",    bg: "bg-red-100"     },
  { value: "milestone", label: "Milestone",  icon: "🏆", color: "text-emerald-700",bg: "bg-emerald-100" },
  { value: "refurb",    label: "Refurb",     icon: "🔨", color: "text-orange-700", bg: "bg-orange-100"  },
  { value: "finance",   label: "Finance",    icon: "💰", color: "text-green-700",  bg: "bg-green-100"   },
  { value: "other",     label: "Other",      icon: "📌", color: "text-gray-600",   bg: "bg-gray-100"    },
];

// ── Helpers ───────────────────────────────────────────────────

export function getTaskStatus(v: string | null)   { return TASK_STATUSES.find(s => s.value === v)   ?? TASK_STATUSES[0]; }
export function getTaskPriority(v: string | null) { return TASK_PRIORITIES.find(p => p.value === v) ?? TASK_PRIORITIES[1]; }
export function getTaskType(v: string | null)     { return TASK_TYPES.find(t => t.value === v)      ?? TASK_TYPES[6]; }
export function getEventType(v: string | null)    { return EVENT_TYPES.find(t => t.value === v)     ?? EVENT_TYPES[6]; }

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const d   = new Date(dueDate);
  const now = new Date();
  const today     = new Date(now.toDateString());
  const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === tomorrow.toDateString())  return "Tomorrow";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < -1) return `${Math.abs(diff)}d overdue`;
  if (diff > 1 && diff < 8) return `In ${diff}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
