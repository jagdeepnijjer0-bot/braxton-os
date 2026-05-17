import Link from "next/link";

const STAGE_LABEL: Record<string, string> = {
  planning:    "Planning",
  demolition:  "Demolition",
  first_fix:   "First Fix",
  second_fix:  "Second Fix",
  decorating:  "Decorating",
  snagging:    "Snagging",
  completed:   "Completed",
  on_hold:     "On Hold",
};

const STAGE_COLOR: Record<string, string> = {
  planning:    "bg-slate-400",
  demolition:  "bg-orange-400",
  first_fix:   "bg-amber-400",
  second_fix:  "bg-yellow-400",
  decorating:  "bg-sky-400",
  snagging:    "bg-violet-400",
  completed:   "bg-emerald-500",
  on_hold:     "bg-gray-300",
};

interface Project {
  id: string;
  project_name: string;
  stage: string;
  progress_percentage: number | null;
  budget: number | null;
  amount_spent: number | null;
}

interface Props {
  projects: Project[];
}

export default function ProjectCards({ projects }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Active Projects</h2>
        <Link href="/projects" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No active projects</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {projects.map(p => {
            const pct    = p.progress_percentage ?? 0;
            const budget = p.budget ?? 0;
            const spent  = p.amount_spent ?? 0;
            const budgetPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{p.project_name}</span>
                  <span className="text-xs font-bold text-gray-700 flex-shrink-0 ml-2">{pct}%</span>
                </div>

                {/* Progress bar */}
                <div className="flex h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`${STAGE_COLOR[p.stage] ?? "bg-indigo-400"} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{STAGE_LABEL[p.stage] ?? p.stage}</span>
                  {budget > 0 && (
                    <span className={`text-xs font-medium ${budgetPct > 90 ? "text-rose-500" : "text-gray-500"}`}>
                      £{(spent / 1000).toFixed(0)}k / £{(budget / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
