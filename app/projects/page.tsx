"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PROJECT_STAGES, ACTIVE_PROJECT_STAGES, getProjectStage,
  formatCurrency, budgetUsedPercent,
} from "@/lib/constants/projects";
import ProjectStageBadge from "@/app/components/projects/ProjectStageBadge";
import ProgressBar from "@/app/components/projects/ProgressBar";
import type { Database } from "@/lib/supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectWithDeal extends ProjectRow {
  deals?: { id: string; deal_name: string; address: string | null } | null;
}

function hashColor(name: string): string {
  const colors = [
    "bg-rose-100 text-rose-700", "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700", "bg-lime-100 text-lime-700",
    "bg-teal-100 text-teal-700", "bg-cyan-100 text-cyan-700",
    "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return colors[h % colors.length];
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

function KpiCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithDeal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const load = useCallback(async (q: string, stage: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)     params.set("search", q);
      if (stage) params.set("stage", stage);
      const res  = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search, stageFilter), 280);
    return () => clearTimeout(t);
  }, [search, stageFilter, load]);

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  // KPI aggregates
  const active      = projects.filter(p => !["completed", "on_hold"].includes(p.stage));
  const completed   = projects.filter(p => p.stage === "completed");
  const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
  const totalSpent  = projects.reduce((s, p) => s + (p.amount_spent ?? 0), 0);

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track refurbs, developments and contractor progress</p>
        </div>
        <Link href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Project
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Projects" value={String(active.length)} sub={`${completed.length} completed`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>} />
        <KpiCard label="Total Budget" value={formatCurrency(totalBudget)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <KpiCard label="Total Spent" value={formatCurrency(totalSpent)} sub={totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% of budget` : undefined}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <KpiCard label="Remaining" value={formatCurrency(totalBudget - totalSpent)}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects or contractors..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Stages</option>
          {PROJECT_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button onClick={() => setView("grid")}
            className={`px-3 py-2.5 transition-colors ${view === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button onClick={() => setView("list")}
            className={`px-3 py-2.5 transition-colors ${view === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? <Spinner /> : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            {search || stageFilter ? "No projects match your filters" : "No projects yet"}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {search || stageFilter ? "Try adjusting your search or stage filter." : "Add your first refurb or development project."}
          </p>
          {!search && !stageFilter && (
            <Link href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Project
            </Link>
          )}
        </div>
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => {
            const s = getProjectStage(project.stage);
            const av = hashColor(project.project_name);
            const usedPct = budgetUsedPercent(project.budget, project.amount_spent);
            const prog = project.progress_percentage ?? 0;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden flex flex-col">
                {/* Stage color bar */}
                <div className={`h-1 w-full ${s.dot}`} />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${av}`}>
                      {project.project_name.charAt(0).toUpperCase()}
                    </div>
                    <ProjectStageBadge value={project.stage} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-indigo-700 transition-colors leading-snug">{project.project_name}</h3>
                  {project.contractor_name && (
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {project.contractor_name}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-semibold text-gray-600">{prog}%</span>
                    </div>
                    <ProgressBar value={prog} showLabel={false} size="sm" />
                  </div>

                  {/* Financials */}
                  {(project.budget || project.amount_spent) && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Budget</span>
                        <span className="font-semibold text-gray-600">{usedPct}% used</span>
                      </div>
                      <ProgressBar
                        value={usedPct}
                        showLabel={false}
                        size="sm"
                        colorClass={usedPct > 100 ? "bg-red-500" : usedPct > 80 ? "bg-amber-500" : "bg-emerald-500"}
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{formatCurrency(project.amount_spent)} spent</span>
                        <span>{formatCurrency(project.budget)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                    {project.deals ? (
                      <span className="text-xs text-indigo-500 font-medium truncate flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        {(project.deals as { deal_name: string }).deal_name}
                      </span>
                    ) : <span />}
                    {project.target_completion_date && (
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {new Date(project.target_completion_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Budget</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Spent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const prog = project.progress_percentage ?? 0;
                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${project.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors block">
                        {project.project_name}
                      </Link>
                      {project.contractor_name && <p className="text-xs text-gray-400">{project.contractor_name}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <ProjectStageBadge value={project.stage} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell w-32">
                      <ProgressBar value={prog} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{formatCurrency(project.budget)}</td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{formatCurrency(project.amount_spent)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => router.push(`/projects/${project.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => deleteProject(project.id, project.project_name)} disabled={deleting === project.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          {deleting === project.id
                            ? <span className="w-3 h-3 border border-gray-300 border-t-red-500 rounded-full animate-spin block" />
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
