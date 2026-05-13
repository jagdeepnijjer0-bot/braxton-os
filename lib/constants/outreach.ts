import type { OutreachNiche, OutreachPlatform, CampaignStatus, LeadStatus, ReplyStatus, OutreachActivityType } from "@/lib/supabase/types";

export const NICHES: { value: OutreachNiche; label: string; icon: string }[] = [
  { value: "letting_agents",    label: "Letting Agents",     icon: "🏠" },
  { value: "property_sourcers", label: "Property Sourcers",  icon: "🔍" },
  { value: "developers",        label: "Developers",         icon: "🏗" },
  { value: "sa_operators",      label: "SA Operators",       icon: "🛎" },
  { value: "estate_agents",     label: "Estate Agents",      icon: "🏡" },
  { value: "maintenance",       label: "Maintenance Co.",    icon: "🔧" },
  { value: "ai_automation",     label: "AI Automation",      icon: "🤖" },
  { value: "website_app",       label: "Website / App",      icon: "💻" },
];

export const PLATFORMS: { value: OutreachPlatform; label: string; icon: string; color: string; bg: string }[] = [
  { value: "linkedin",  label: "LinkedIn",  icon: "💼", color: "text-blue-700",   bg: "bg-blue-100"   },
  { value: "email",     label: "Email",     icon: "📧", color: "text-gray-700",   bg: "bg-gray-100"   },
  { value: "whatsapp",  label: "WhatsApp",  icon: "💬", color: "text-green-700",  bg: "bg-green-100"  },
  { value: "facebook",  label: "Facebook",  icon: "📘", color: "text-indigo-700", bg: "bg-indigo-100" },
  { value: "instagram", label: "Instagram", icon: "📸", color: "text-pink-700",   bg: "bg-pink-100"   },
];

export const CAMPAIGN_STATUSES: { value: CampaignStatus; label: string; color: string; bg: string; dot: string }[] = [
  { value: "draft",     label: "Draft",     color: "text-gray-600",   bg: "bg-gray-100",    dot: "bg-gray-400"   },
  { value: "active",    label: "Active",    color: "text-green-700",  bg: "bg-green-100",   dot: "bg-green-500"  },
  { value: "paused",    label: "Paused",    color: "text-amber-700",  bg: "bg-amber-100",   dot: "bg-amber-500"  },
  { value: "completed", label: "Completed", color: "text-blue-700",   bg: "bg-blue-100",    dot: "bg-blue-500"   },
  { value: "archived",  label: "Archived",  color: "text-gray-500",   bg: "bg-gray-100",    dot: "bg-gray-300"   },
];

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string; bg: string; dot: string }[] = [
  { value: "new",            label: "New",           color: "text-gray-600",   bg: "bg-gray-100",    dot: "bg-gray-400"   },
  { value: "contacted",      label: "Contacted",     color: "text-blue-700",   bg: "bg-blue-100",    dot: "bg-blue-500"   },
  { value: "replied",        label: "Replied",       color: "text-violet-700", bg: "bg-violet-100",  dot: "bg-violet-500" },
  { value: "interested",     label: "Interested",    color: "text-amber-700",  bg: "bg-amber-100",   dot: "bg-amber-500"  },
  { value: "not_interested", label: "Not Interested",color: "text-red-600",    bg: "bg-red-100",     dot: "bg-red-400"    },
  { value: "booked",         label: "Booked Call",   color: "text-emerald-700",bg: "bg-emerald-100", dot: "bg-emerald-500"},
  { value: "closed",         label: "Closed Won",    color: "text-green-700",  bg: "bg-green-100",   dot: "bg-green-500"  },
  { value: "ghosted",        label: "Ghosted",       color: "text-gray-500",   bg: "bg-gray-100",    dot: "bg-gray-300"   },
  { value: "unqualified",    label: "Unqualified",   color: "text-gray-500",   bg: "bg-gray-100",    dot: "bg-gray-300"   },
];

export const REPLY_STATUSES: { value: ReplyStatus; label: string; color: string }[] = [
  { value: "no_reply",      label: "No Reply",       color: "text-gray-500"   },
  { value: "replied",       label: "Replied",        color: "text-blue-600"   },
  { value: "positive",      label: "Positive",       color: "text-emerald-600"},
  { value: "negative",      label: "Negative",       color: "text-red-600"    },
  { value: "bounced",       label: "Bounced",        color: "text-amber-600"  },
  { value: "out_of_office", label: "Out of Office",  color: "text-gray-400"   },
];

export const ACTIVITY_TYPES: { value: OutreachActivityType; label: string; icon: string }[] = [
  { value: "note",          label: "Note",            icon: "📝" },
  { value: "email_sent",    label: "Email Sent",      icon: "📧" },
  { value: "dm_sent",       label: "DM Sent",         icon: "💬" },
  { value: "call",          label: "Call",            icon: "📞" },
  { value: "reply_received",label: "Reply Received",  icon: "↩️" },
  { value: "status_change", label: "Status Change",   icon: "🔄" },
  { value: "follow_up_set", label: "Follow-Up Set",   icon: "🔔" },
  { value: "deal_closed",   label: "Deal Closed",     icon: "🏆" },
  { value: "call_booked",   label: "Call Booked",     icon: "📅" },
];

// Kanban pipeline columns (visible statuses)
export const PIPELINE_COLS: { key: LeadStatus; label: string; dot: string }[] = [
  { key: "new",        label: "New",          dot: "bg-gray-400"   },
  { key: "contacted",  label: "Contacted",    dot: "bg-blue-500"   },
  { key: "replied",    label: "Replied",      dot: "bg-violet-500" },
  { key: "interested", label: "Interested",   dot: "bg-amber-500"  },
  { key: "booked",     label: "Booked Call",  dot: "bg-emerald-500"},
  { key: "closed",     label: "Closed Won",   dot: "bg-green-500"  },
];

// ── Helpers ───────────────────────────────────────────────────
export function getNiche(v: string | null)          { return NICHES.find(n => n.value === v)           ?? NICHES[0]; }
export function getPlatform(v: string | null)       { return PLATFORMS.find(p => p.value === v)        ?? PLATFORMS[1]; }
export function getCampaignStatus(v: string | null) { return CAMPAIGN_STATUSES.find(s => s.value === v)?? CAMPAIGN_STATUSES[0]; }
export function getLeadStatus(v: string | null)     { return LEAD_STATUSES.find(s => s.value === v)    ?? LEAD_STATUSES[0]; }
export function getReplyStatus(v: string | null)    { return REPLY_STATUSES.find(s => s.value === v)   ?? REPLY_STATUSES[0]; }
export function getActivityType(v: string | null)   { return ACTIVITY_TYPES.find(a => a.value === v)   ?? ACTIVITY_TYPES[0]; }

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatFollowUp(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date(new Date().toDateString());
  const diff  = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0)  return "Today";
  if (diff === 1)  return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < -1)   return `${Math.abs(diff)}d overdue`;
  if (diff < 8)    return `In ${diff}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
