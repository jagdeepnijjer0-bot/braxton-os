import Link from "next/link";

const TYPE_ICON: Record<string, { icon: string; bg: string; text: string }> = {
  note:        { icon: "📝", bg: "bg-slate-100",   text: "text-slate-600"  },
  call:        { icon: "📞", bg: "bg-sky-100",     text: "text-sky-600"    },
  email:       { icon: "✉️",  bg: "bg-indigo-100",  text: "text-indigo-600" },
  meeting:     { icon: "🤝", bg: "bg-violet-100",  text: "text-violet-600" },
  stage_change:{ icon: "🔀", bg: "bg-amber-100",   text: "text-amber-600"  },
  created:     { icon: "✨", bg: "bg-emerald-100", text: "text-emerald-600"},
  status:      { icon: "🔄", bg: "bg-orange-100",  text: "text-orange-600" },
  default:     { icon: "📌", bg: "bg-gray-100",    text: "text-gray-500"   },
};

export interface ActivityItem {
  id:         string;
  created_at: string;
  type:       string;
  body:       string;
  source:     "contact" | "deal" | "project";
  label:      string;
  href:       string;
}

interface Props {
  items: ActivityItem[];
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

export default function ActivityFeed({ items }: Props) {
  const style = TYPE_ICON;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Recent Activity</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map(item => {
            const s = style[item.type] ?? style.default;
            return (
              <Link key={item.id + item.source} href={item.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${s.bg}`}>
                  {s.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{item.body}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${s.text}`}>{item.label}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
