"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import TaskCard from "@/app/components/tasks/TaskCard";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from "@/lib/constants/tasks";
import { useToast } from "@/app/components/ui/Toast";
import type { Database, TaskStatus } from "@/lib/supabase/types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type View = "kanban" | "list";

const KANBAN_COLS = [
  { key: "todo",        label: "To Do",      dotCls: "bg-slate-400"   },
  { key: "in_progress", label: "In Progress", dotCls: "bg-blue-500"    },
  { key: "overdue",     label: "Overdue",     dotCls: "bg-red-500"     },
  { key: "completed",   label: "Completed",   dotCls: "bg-emerald-500" },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export default function TasksPage() {
  const [tasks,   setTasks]   = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [view,    setView]    = useState<View>("kanban");
  const toast = useToast();

  const [search,     setSearch]     = useState("");
  const [priority,   setPriority]   = useState("");
  const [type,       setType]       = useState("");
  const [statusFilt, setStatusFilt] = useState("");

  const load = useCallback(async (s: string, pri: string, ty: string, st: string) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (s)   p.set("search",   s);
      if (pri) p.set("priority", pri);
      if (ty)  p.set("type",     ty);
      if (st)  p.set("status",   st);
      const res  = await fetch(`/api/tasks?${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, priority, type, statusFilt), 250);
    return () => clearTimeout(t);
  }, [search, priority, type, statusFilt, load]);

  async function handleStatusChange(id: string, status: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed", "Please try again.");
      load(search, priority, type, statusFilt);
    } else {
      toast.success("Task deleted");
    }
  }

  const hasFilters = search || priority || type || statusFilt;
  const counts = useMemo(() => ({
    total:       tasks.length,
    todo:        tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    overdue:     tasks.filter(t => t.status === "overdue").length,
    completed:   tasks.filter(t => t.status === "completed").length,
  }), [tasks]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {counts.todo} to do · {counts.in_progress} in progress · {counts.overdue} overdue · {counts.completed} done
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "kanban" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                Board
              </button>
              <button onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${view === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                List
              </button>
            </div>
            <Link href="/tasks/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Task
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-40">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Types</option>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
          {view === "list" && (
            <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Statuses</option>
              {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )}
          {hasFilters && (
            <button onClick={() => { setSearch(""); setPriority(""); setType(""); setStatusFilt(""); }}
              className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Clear ×
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="mx-4 mt-3 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
          <button onClick={() => load(search, priority, type, statusFilt)} className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-medium transition-colors">Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? <Spinner /> : (
        view === "kanban" ? (
          /* ── Kanban Board ── */
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 p-4 h-full min-w-max">
              {KANBAN_COLS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key);
                return (
                  <div key={col.key} className="flex flex-col w-72 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotCls}`} />
                      <span className="text-sm font-bold text-gray-700">{col.label}</span>
                      <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {colTasks.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                          No tasks
                        </div>
                      ) : colTasks.map(task => (
                        <TaskCard key={task.id} task={task}
                          onStatusChange={handleStatusChange} onDelete={handleDelete} />
                      ))}
                    </div>
                    <Link href={`/tasks/new?status=${col.key}`}
                      className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add task
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── List View ── */
          <div className="flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">✓</div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  {hasFilters ? "No tasks match your filters" : "No tasks yet"}
                </h3>
                <p className="text-sm text-gray-400 mb-5">
                  {hasFilters ? "Try clearing your filters." : "Create your first task to get started."}
                </p>
                {!hasFilters && (
                  <Link href="/tasks/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Task
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task}
                    onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
