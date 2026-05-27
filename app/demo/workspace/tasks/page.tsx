import { DEMO_TASKS } from "@/lib/demo/seed";

export const metadata = { title: "Tasks — Braxton OS Demo" };

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-50 text-red-600 border border-red-200",
  high:   "bg-orange-50 text-orange-600 border border-orange-200",
  medium: "bg-yellow-50 text-yellow-600 border border-yellow-200",
  low:    "bg-gray-100 text-gray-500 border border-gray-200",
};

const TYPE_ICONS: Record<string, string> = {
  follow_up:   "📞",
  admin:       "📋",
  meeting:     "📅",
  call:        "📱",
  refurb:      "🔨",
  maintenance: "🔧",
};

const overdueTasks    = DEMO_TASKS.filter(t => t.status === "overdue");
const activeTasks     = DEMO_TASKS.filter(t => t.status === "todo" || t.status === "in_progress");
const completedTasks  = DEMO_TASKS.filter(t => t.status === "completed");

export default function TasksPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{DEMO_TASKS.length} tasks — {overdueTasks.length} overdue</p>
        </div>
        <div className="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-lg border border-red-200 font-semibold">
          {overdueTasks.length} overdue
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        Track outstanding, overdue and unread actions that need human attention.
      </div>

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-red-500 rounded-full" />
            <h2 className="font-semibold text-gray-900">Overdue</h2>
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
              {overdueTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <TaskRow key={task.id} task={task} variant="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Due Today / This Week */}
      {activeTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
            <h2 className="font-semibold text-gray-900">Due This Week</h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
              {activeTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <TaskRow key={task.id} task={task} variant="active" />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-gray-300 rounded-full" />
            <h2 className="font-semibold text-gray-400">Completed</h2>
          </div>
          <div className="space-y-2 opacity-60">
            {completedTasks.map(task => (
              <TaskRow key={task.id} task={task} variant="completed" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  variant,
}: {
  task: typeof DEMO_TASKS[number];
  variant: "overdue" | "active" | "completed";
}) {
  return (
    <div className={`bg-white rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-sm ${
      variant === "overdue"
        ? "border border-red-200"
        : variant === "completed"
        ? "border border-gray-100"
        : "border border-gray-200"
    }`}>
      {/* Check circle */}
      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
        variant === "completed"
          ? "border-emerald-400 bg-emerald-50"
          : variant === "overdue"
          ? "border-red-400"
          : "border-gray-300"
      }`}>
        {variant === "completed" && (
          <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Icon */}
      <span className="text-base shrink-0">{TYPE_ICONS[task.task_type] ?? "✓"}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${variant === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.related_contact && (
            <span className="text-xs text-gray-400">{task.related_contact}</span>
          )}
          {task.related_project && (
            <span className="text-xs text-gray-300">· {task.related_project}</span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400">{task.due_date}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[task.priority] ?? "bg-gray-100 text-gray-500"}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}
