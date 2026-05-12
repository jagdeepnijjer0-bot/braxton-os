import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type NotifRow = Database["public"]["Tables"]["notifications"]["Row"];

const TYPE_ICONS: Record<string, string> = {
  task_overdue:      "⚠",
  follow_up_overdue: "🔁",
  finance_overdue:   "💰",
  meeting_upcoming:  "📅",
  project_deadline:  "🏗",
  budget_warning:    "📊",
  system:            "🔔",
};

const PRIORITY_RING: Record<string, string> = {
  urgent: "border-l-red-500",
  high:   "border-l-amber-500",
  normal: "border-l-indigo-400",
  low:    "border-l-gray-300",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  notif:    NotifRow;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({ notif, onRead, onDelete }: Props) {
  const icon = TYPE_ICONS[notif.type] ?? "🔔";
  const ring = PRIORITY_RING[notif.priority] ?? "border-l-gray-300";

  const content = (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-100 border-l-2 ${ring} ${
      notif.is_read ? "bg-white" : "bg-indigo-50/40"
    } hover:bg-gray-50 transition-colors group`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold text-gray-900 leading-snug ${notif.is_read ? "font-medium text-gray-600" : ""}`}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
      </div>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.is_read && (
          <button onClick={e => { e.preventDefault(); onRead(notif.id); }}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors" title="Mark read">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        )}
        <button onClick={e => { e.preventDefault(); onDelete(notif.id); }}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Dismiss">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );

  if (notif.link_url) {
    return <Link href={notif.link_url}>{content}</Link>;
  }
  return <div onClick={() => !notif.is_read && onRead(notif.id)}>{content}</div>;
}
