"use client";

import { useMemo } from "react";
import { getEventType } from "@/lib/constants/tasks";
import type { Database } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["calendar_events"]["Row"];
type TaskRow  = Database["public"]["Tables"]["tasks"]["Row"];

interface DayEvent {
  id:    string;
  title: string;
  type:  string;
  time?: string;
  isTask: boolean;
}

interface Props {
  year:   number;
  month:  number; // 0-indexed
  events: EventRow[];
  tasks:  TaskRow[];
  onDayClick:   (date: string) => void;
  onEventClick: (id: string, isTask: boolean) => void;
}

export default function CalendarGrid({ year, month, events, tasks, onDayClick, onEventClick }: Props) {
  const today = new Date();

  const days = useMemo(() => {
    const first    = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0).getDate();
    const startDow = (first.getDay() + 6) % 7; // Mon-first

    // Map: dateStr -> events
    const map: Record<string, DayEvent[]> = {};
    events.forEach(ev => {
      const d = ev.start_datetime.split("T")[0];
      if (!map[d]) map[d] = [];
      const et = getEventType(ev.event_type);
      map[d].push({ id: ev.id, title: ev.title, type: et.icon, time: ev.start_datetime.split("T")[1]?.slice(0,5), isTask: false });
    });
    tasks.forEach(t => {
      if (!t.due_date) return;
      if (!map[t.due_date]) map[t.due_date] = [];
      map[t.due_date].push({ id: t.id, title: t.title, type: "✓", isTask: true });
    });

    const cells: { date: number | null; dateStr: string | null; events: DayEvent[] }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ date: null, dateStr: null, events: [] });
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: d, dateStr, events: map[dateStr] ?? [] });
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push({ date: null, dateStr: null, events: [] });
    return cells;
  }, [year, month, events, tasks]);

  const todayStr = today.toISOString().split("T")[0];
  const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="flex flex-col h-full">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DOW.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "1fr" }}>
        {days.map((cell, i) => {
          const isToday  = cell.dateStr === todayStr;
          const isPast   = cell.dateStr ? cell.dateStr < todayStr : false;
          return (
            <div
              key={i}
              onClick={() => cell.dateStr && onDayClick(cell.dateStr)}
              className={`border-r border-b border-gray-100 p-1 min-h-[80px] ${
                cell.date ? "cursor-pointer hover:bg-indigo-50/40 transition-colors" : "bg-gray-50/30"
              } ${isPast && cell.date ? "bg-gray-50/50" : ""}`}
            >
              {cell.date && (
                <>
                  <div className="flex justify-end mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-indigo-600 text-white" : isPast ? "text-gray-400" : "text-gray-700"
                    }`}>
                      {cell.date}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {cell.events.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); onEventClick(ev.id, ev.isTask); }}
                        className={`w-full text-left text-[10px] font-medium px-1 py-0.5 rounded truncate ${
                          ev.isTask
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        }`}
                        title={ev.title}
                      >
                        {ev.type} {ev.time ? `${ev.time} ` : ""}{ev.title}
                      </button>
                    ))}
                    {cell.events.length > 3 && (
                      <p className="text-[10px] text-gray-400 px-1">+{cell.events.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
