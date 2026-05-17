import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  meeting:   "bg-indigo-500",
  reminder:  "bg-amber-400",
  deadline:  "bg-rose-500",
  milestone: "bg-emerald-500",
  refurb:    "bg-orange-400",
  finance:   "bg-sky-500",
  other:     "bg-slate-400",
};

interface CalEvent {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean | null;
}

interface Props {
  events: CalEvent[];
}

function formatEventTime(ev: CalEvent): string {
  if (ev.all_day) return "All day";
  const d = new Date(ev.start_datetime);
  return d.toLocaleString("en-GB", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `In ${d}d`;
}

export default function UpcomingEvents({ events }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
        <Link href="/calendar" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No upcoming events</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {events.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_COLORS[ev.event_type] ?? TYPE_COLORS.other}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                <p className="text-xs text-gray-500">{formatEventTime(ev)}</p>
              </div>
              <span className="text-xs font-medium text-indigo-600 flex-shrink-0">{daysUntil(ev.start_datetime)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
