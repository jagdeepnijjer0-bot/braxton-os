import type { InboxPlatform, InboxStatus, InboxPriority } from "@/lib/supabase/types";

export const PLATFORMS: {
  value: InboxPlatform;
  label: string;
  color: string;
  bg: string;
  dot: string;
  icon: string;
}[] = [
  { value: "email",        label: "Email",          color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500",    icon: "✉️"  },
  { value: "whatsapp",     label: "WhatsApp",       color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500", icon: "💬"  },
  { value: "instagram",    label: "Instagram",      color: "text-pink-700",    bg: "bg-pink-100",    dot: "bg-pink-500",    icon: "📸"  },
  { value: "facebook",     label: "Facebook",       color: "text-indigo-700",  bg: "bg-indigo-100",  dot: "bg-indigo-500",  icon: "👤"  },
  { value: "linkedin",     label: "LinkedIn",       color: "text-sky-700",     bg: "bg-sky-100",     dot: "bg-sky-500",     icon: "💼"  },
  { value: "website_form", label: "Website Form",   color: "text-teal-700",    bg: "bg-teal-100",    dot: "bg-teal-500",    icon: "🌐"  },
];

export const INBOX_STATUSES: {
  value: InboxStatus;
  label: string;
  color: string;
  bg: string;
  dot: string;
}[] = [
  { value: "open",      label: "Open",       color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500"    },
  { value: "replied",   label: "Replied",    color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  { value: "waiting",   label: "Waiting",    color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500"   },
  { value: "follow_up", label: "Follow Up",  color: "text-violet-700",  bg: "bg-violet-100",  dot: "bg-violet-500"  },
  { value: "closed",    label: "Closed",     color: "text-gray-500",    bg: "bg-gray-100",    dot: "bg-gray-400"    },
];

export const INBOX_PRIORITIES: {
  value: InboxPriority;
  label: string;
  color: string;
  dot: string;
}[] = [
  { value: "low",    label: "Low",    color: "text-gray-400",    dot: "bg-gray-300"    },
  { value: "normal", label: "Normal", color: "text-blue-500",    dot: "bg-blue-400"    },
  { value: "high",   label: "High",   color: "text-amber-600",   dot: "bg-amber-500"   },
  { value: "urgent", label: "Urgent", color: "text-red-600",     dot: "bg-red-500"     },
];

export const INBOX_CATEGORIES = [
  "Lead Enquiry",
  "Support Request",
  "Partnership",
  "Press / Media",
  "Job Application",
  "General Enquiry",
  "Complaint",
  "Invoice / Payment",
  "Other",
];

// ── Helpers ───────────────────────────────────────────────────

export function getPlatform(value: string | null) {
  return PLATFORMS.find(p => p.value === value) ?? PLATFORMS[0];
}

export function getInboxStatus(value: string | null) {
  return INBOX_STATUSES.find(s => s.value === value) ?? INBOX_STATUSES[0];
}

export function getInboxPriority(value: string | null) {
  return INBOX_PRIORITIES.find(p => p.value === value) ?? INBOX_PRIORITIES[1];
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function avatarColor(name: string | null | undefined): string {
  const colors = [
    "bg-rose-100 text-rose-700", "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700", "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  ];
  if (!name) return colors[0];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return colors[h % colors.length];
}
