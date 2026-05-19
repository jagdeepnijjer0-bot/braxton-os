"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CalendarGrid from "@/app/components/calendar/CalendarGrid";
import { getEventType, formatDueDate } from "@/lib/constants/tasks";
import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["calendar_events"]["Row"];
type TaskRow  = Database["public"]["Tables"]["tasks"]["Row"];

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const now    = new Date();
  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tasks,  setTasks]  = useState<TaskRow[]>([]);
  const [loading,setLoading]= useState(true);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const from = new Date(y, m, 1).toISOString();
      const to   = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
      // Tasks: only fetch those due in the current month (same date range as calendar)
      const taskFrom = new Date(y, m, 1).toISOString().split("T")[0];
      const taskTo   = new Date(y, m + 1, 0).toISOString().split("T")[0];
      const [evRes, tkRes] = await Promise.all([
        fetch(`/api/calendar?from=${from}&to=${to}`),
        fetch(`/api/tasks?due_from=${taskFrom}&due_to=${taskTo}&limit=100`),
      ]);
      const [evData, tkData] = await Promise.all([evRes.json(), tkRes.json()]);
      setEvents(Array.isArray(evData) ? evData : []);
      setTasks(Array.isArray(tkData) ? tkData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year, month); }, [year, month, load]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else              setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else               setMonth(m => m + 1);
  }

  function handleDayClick(date: string) {
    router.push(`/calendar/new?date=${date}`);
  }
  function handleEventClick(id: string, isTask: boolean) {
    if (isTask) router.push(`/tasks/${id}/edit`);
    else        router.push(`/calendar/${id}/edit`);
  }

  // Upcoming events this month
  const todayStr = now.toISOString().split("T")[0];
  const upcoming = events
    .filter(e => e.start_datetime.split("T")[0] >= todayStr)
    .slice(0, 5);

  // Tasks with due dates this month
  const tasksDueThisMonth = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Main calendar ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 min-w-40 text-center">
              {MONTH_NAMES[month]} {year}
            </h1>
            <button onClick={nextMonth}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
              className="px-2.5 py-1 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              Today
            </button>
          </div>
          <Link href="/calendar/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Event
          </Link>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? <Spinner /> : (
            <CalendarGrid
              year={year} month={month}
              events={events} tasks={tasks}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="w-64 border-l border-gray-100 bg-gray-50/50 flex-shrink-0 overflow-y-auto hidden lg:flex flex-col">
        <div className="p-4">
          {/* Upcoming events */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Upcoming</p>
          {upcoming.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No events this month</p>
          ) : upcoming.map(ev => {
            const et = getEventType(ev.event_type);
            const d  = new Date(ev.start_datetime);
            return (
              <Link key={ev.id} href={`/calendar/${ev.id}/edit`}
                className="flex items-start gap-2 p-2 mb-1.5 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                <span className="text-base flex-shrink-0">{et.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{ev.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                    {!ev.all_day && ` · ${d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* Tasks due */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-5">
            Tasks Due ({tasksDueThisMonth.length})
          </p>
          {tasksDueThisMonth.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No tasks due this month</p>
          ) : tasksDueThisMonth.slice(0, 8).map(t => (
            <Link key={t.id} href={`/tasks/${t.id}/edit`}
              className="flex items-center gap-2 p-2 mb-1.5 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                t.status === "overdue" ? "bg-red-500" :
                t.status === "completed" ? "bg-emerald-500" : "bg-blue-400"
              }`} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${t.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {t.title}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDueDate(t.due_date)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
