import Link from "next/link";
import { DEMO_TASKS } from "@/lib/demo/seed";

export const metadata = { title: "Tasks — Braxton OS Demo" };

const STATUS_COLORS: Record<string, string> = {
  todo:        "bg-gray-800 text-gray-300",
  in_progress: "bg-blue-900/60 text-blue-300",
  completed:   "bg-emerald-900/60 text-emerald-300",
  overdue:     "bg-red-900/60 text-red-300",
  cancelled:   "bg-gray-700 text-gray-500",
};

const PRIORITY_BADGE: Record<string, string> = {
  low:    "bg-gray-700 text-gray-400",
  medium: "bg-yellow-900/60 text-yellow-300",
  high:   "bg-orange-900/60 text-orange-300",
  urgent: "bg-red-900/60 text-red-300",
};

const TYPE_ICONS: Record<string, string> = {
  follow_up: "📞",
  admin:     "📋",
  meeting:   "📅",
  call:      "📱",
  refurb:    "🔨",
};

export default function DemoTasksPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">
            Auto-generated from leads, deals, and form submissions
          </p>
        </div>
        <div className="bg-orange-900/40 text-orange-300 text-xs px-3 py-1.5 rounded-lg border border-orange-700/40 font-semibold">
          3 due this week
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl px-5 py-4 text-sm text-indigo-300">
        <strong>In your real OS:</strong> tasks are automatically created when a new lead comes in,
        a deal changes stage, or a follow-up date passes — so nothing slips through the cracks.
      </div>

      <div className="space-y-3">
        {DEMO_TASKS.map(task => (
          <div
            key={task.id}
            className={`bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-start justify-between gap-4 ${
              task.status === "completed" ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xl shrink-0">{TYPE_ICONS[task.task_type] ?? "✅"}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${task.status === "completed" ? "line-through text-gray-500" : "text-white"}`}>
                  {task.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Due {task.due_date}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_BADGE[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                {task.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/40 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <span className="font-bold text-white">Your task system</span> would auto-generate actions from every lead, deal, and inbox message — and notify your team in real time.
        </div>
        <Link
          href="/demo/workspace/reserve"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Get yours →
        </Link>
      </div>
    </div>
  );
}
