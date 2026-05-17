import Link from "next/link";

const PRIORITY_STYLES: Record<string, string> = {
  critical: "text-rose-600 bg-rose-50 border-rose-200",
  high:     "text-amber-600 bg-amber-50 border-amber-200",
  medium:   "text-sky-600 bg-sky-50 border-sky-200",
  low:      "text-gray-500 bg-gray-50 border-gray-200",
};

interface Notif {
  id: string;
  title: string;
  body: string | null;
  type: string;
  priority: string;
  created_at: string;
  link_url: string | null;
}

interface Props {
  notifications: Notif[];
  unreadCount: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsList({ notifications, unreadCount }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">All caught up 🎉</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {notifications.map(n => {
            const s = PRIORITY_STYLES[n.priority] ?? PRIORITY_STYLES.low;
            const inner = (
              <div className="flex items-start gap-3 px-5 py-3.5">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  n.priority === "critical" ? "bg-rose-500" :
                  n.priority === "high"     ? "bg-amber-400" :
                  n.priority === "medium"   ? "bg-sky-400"   : "bg-gray-300"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 truncate">{n.body ?? ""}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${s} flex-shrink-0 capitalize`}>
                  {n.priority}
                </span>
              </div>
            );
            return n.link_url
              ? <Link key={n.id} href={n.link_url} className="block hover:bg-gray-50 transition-colors">{inner}</Link>
              : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
