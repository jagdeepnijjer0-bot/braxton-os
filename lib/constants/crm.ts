import type { LeadType, ContactStatus, ActivityType } from "@/lib/supabase/types";

export const LEAD_TYPES: { value: LeadType; label: string; color: string }[] = [
  { value: "letting_agent",           label: "Letting Agent",          color: "bg-blue-100 text-blue-700" },
  { value: "sourcer",                 label: "Sourcer",                color: "bg-purple-100 text-purple-700" },
  { value: "developer",               label: "Developer",              color: "bg-orange-100 text-orange-700" },
  { value: "landlord",                label: "Landlord",               color: "bg-yellow-100 text-yellow-700" },
  { value: "investor",                label: "Investor",               color: "bg-emerald-100 text-emerald-700" },
  { value: "maintenance_client",      label: "Maintenance Client",     color: "bg-red-100 text-red-700" },
  { value: "website_app_prospect",    label: "Website / App Prospect", color: "bg-indigo-100 text-indigo-700" },
  { value: "ai_automation_prospect",  label: "AI Automation Prospect", color: "bg-pink-100 text-pink-700" },
];

export const CONTACT_STATUSES: { value: ContactStatus; label: string; color: string }[] = [
  { value: "new",           label: "New",           color: "bg-gray-100 text-gray-600" },
  { value: "contacted",     label: "Contacted",     color: "bg-blue-100 text-blue-700" },
  { value: "qualified",     label: "Qualified",     color: "bg-indigo-100 text-indigo-700" },
  { value: "proposal_sent", label: "Proposal Sent", color: "bg-yellow-100 text-yellow-700" },
  { value: "negotiating",   label: "Negotiating",   color: "bg-orange-100 text-orange-700" },
  { value: "closed_won",    label: "Closed Won",    color: "bg-green-100 text-green-700" },
  { value: "closed_lost",   label: "Closed Lost",   color: "bg-red-100 text-red-700" },
  { value: "follow_up",     label: "Follow Up",     color: "bg-purple-100 text-purple-700" },
];

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: "note",          label: "Note",           icon: "📝" },
  { value: "call",          label: "Call",           icon: "📞" },
  { value: "email",         label: "Email",          icon: "✉️" },
  { value: "meeting",       label: "Meeting",        icon: "📅" },
  { value: "status_change", label: "Status Change",  icon: "🔄" },
  { value: "follow_up_set", label: "Follow-up Set",  icon: "⏰" },
  { value: "created",       label: "Contact Created", icon: "✅" },
];

export const SOURCE_OPTIONS = [
  "Referral",
  "LinkedIn",
  "Cold Outreach",
  "Website",
  "Event",
  "Partnership",
  "Social Media",
  "Other",
];

export function getLeadType(value: string | null) {
  return LEAD_TYPES.find((t) => t.value === value) ?? null;
}

export function getContactStatus(value: string | null) {
  return CONTACT_STATUSES.find((s) => s.value === value) ?? CONTACT_STATUSES[0];
}

export function getActivityType(value: string | null) {
  return ACTIVITY_TYPES.find((a) => a.value === value) ?? ACTIVITY_TYPES[0];
}

export function formatFollowUpDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff <= 7) return `In ${diff} days`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
