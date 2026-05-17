import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  getProjectStage, formatCurrency, budgetVariance, budgetUsedPercent,
  PROJECT_STAGES,
} from "@/lib/constants/projects";
import ProjectStageBadge from "@/app/components/projects/ProjectStageBadge";
import ProgressBar from "@/app/components/projects/ProgressBar";
import ProjectActivityTimeline from "@/app/components/projects/ProjectActivityTimeline";
import CostTracker from "@/app/components/projects/CostTracker";

interface Props { params: Promise<{ id: string }> }

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: "red" | "green" }) {
  const valueClass = highlight === "green" ? "text-emerald-600" : highlight === "red" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: project, error }, { data: activities }, { data: costs }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("project_activities").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("project_costs").select("*").eq("project_id", id).order("date", { ascending: false }),
  ]);

  if (error || !project) notFound();

  // Fetch linked deal if present
  type DealRow = { id: string; deal_name: string; address: string | null };
  let linkedDeal: DealRow | null = null;
  if (project.linked_deal_id) {
    const { data: d } = await supabase
      .from("deals").select("id, deal_name, address").eq("id", project.linked_deal_id).single();
    linkedDeal = d as DealRow | null;
  }

  const stage    = getProjectStage(project.stage);
  const variance = budgetVariance(project.budget, project.amount_spent);
  const usedPct  = budgetUsedPercent(project.budget, project.amount_spent);
  const progress = project.progress_percentage ?? 0;

  const activeStages = PROJECT_STAGES.filter(s => s.value !== "on_hold");
  const stageOrders  = activeStages.map(s => s.value);
  const currentOrder = activeStages.find(s => s.value === project.stage)?.order ?? 0;

  type CostRow = { id: string; label: string; amount: number; direction: "in" | "out"; category: string | null; date: string; notes: string | null };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/projects" className="hover:text-gray-600 transition-colors">Projects</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium truncate">{project.project_name}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className={`h-1.5 w-full ${stage.dot}`} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <ProjectStageBadge value={project.stage} />
                {project.stage === "on_hold" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    ⏸ On Hold
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
              {project.contractor_name && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {project.contractor_name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                {project.start_date && (
                  <span>Started: <span className="text-gray-600 font-medium">{new Date(project.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                )}
                {project.target_completion_date && (
                  <span>Target: <span className="text-gray-600 font-medium">{new Date(project.target_completion_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/projects/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </Link>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">Overall Progress</span>
              <span className="font-bold text-gray-700">{progress}%</span>
            </div>
            <ProgressBar value={progress} showLabel={false} size="lg" />
          </div>

          {/* Stage pipeline */}
          <div className="mt-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {activeStages.map((s, i) => {
                const isActive = s.value === project.stage;
                const isPast   = stageOrders.indexOf(s.value) < stageOrders.indexOf(project.stage ?? "");
                return (
                  <div key={s.value} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <div className={`w-3 h-px flex-shrink-0 ${isPast || isActive ? "bg-indigo-300" : "bg-gray-200"}`} />}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                      isActive ? `${s.bg} ${s.color} ring-1 ring-inset` :
                      isPast   ? "bg-indigo-50 text-indigo-400" :
                                 "bg-gray-50 text-gray-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? s.dot : isPast ? "bg-indigo-300" : "bg-gray-200"}`} />
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Budget"         value={formatCurrency(project.budget)} />
        <StatCard label="Spent"          value={formatCurrency(project.amount_spent)} />
        <StatCard
          label="Remaining"
          value={variance !== null ? formatCurrency(Math.abs(variance)) : "—"}
          sub={variance !== null ? (variance >= 0 ? "under budget" : "over budget") : undefined}
          highlight={variance !== null ? (variance >= 0 ? "green" : "red") : undefined}
        />
        <StatCard label="Projected Profit" value={formatCurrency(project.projected_profit)}
          highlight={project.projected_profit != null ? (project.projected_profit >= 0 ? "green" : "red") : undefined}
        />
      </div>

      {/* Budget bar */}
      {project.budget && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-gray-600">Budget Used</span>
            <span className={`font-bold ${usedPct > 100 ? "text-red-600" : usedPct > 80 ? "text-amber-600" : "text-gray-700"}`}>{usedPct}%</span>
          </div>
          <ProgressBar
            value={usedPct}
            showLabel={false}
            size="lg"
            colorClass={usedPct > 100 ? "bg-red-500" : usedPct > 80 ? "bg-amber-500" : "bg-indigo-500"}
          />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{formatCurrency(project.amount_spent)} spent</span>
            <span>Budget: {formatCurrency(project.budget)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Linked deal */}
          {linkedDeal && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Linked Deal</h3>
              <Link href={`/deal-tracker/${linkedDeal.id}`}
                className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{linkedDeal.deal_name}</p>
                  {linkedDeal.address && <p className="text-xs text-gray-400 truncate">{linkedDeal.address}</p>}
                </div>
              </Link>
            </div>
          )}

          {/* Contractor card */}
          {project.contractor_name && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contractor</h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {project.contractor_name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-gray-800">{project.contractor_name}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{project.notes}</p>
            </div>
          )}

          {/* Cost tracker */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Spend Tracker</h3>
            <CostTracker
              projectId={id}
              costs={(costs ?? []) as CostRow[]}
            />
          </div>
        </div>

        {/* Right column: activity */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Activity</h3>
            <ProjectActivityTimeline
              projectId={id}
              activities={(activities ?? []).map(a => ({
                id: a.id,
                type: a.type,
                body: a.body,
                created_at: a.created_at,
                metadata: a.metadata ?? undefined,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
