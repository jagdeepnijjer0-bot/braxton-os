"use client";

import { useState } from "react";
import { DEMO_CALENDAR_EVENTS } from "@/lib/demo/seed";

type CalEvent = typeof DEMO_CALENDAR_EVENTS[number];

const TYPE_BADGE: Record<string, string> = {
  call:       "bg-indigo-50 text-indigo-700 border border-indigo-200",
  meeting:    "bg-blue-50 text-blue-700 border border-blue-200",
  site_visit: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  deadline:   "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_BADGE: Record<string, string> = {
  upcoming:  "bg-indigo-50 text-indigo-600 border border-indigo-200",
  completed: "bg-gray-100 text-gray-500 border border-gray-200",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
};

// Group events by date
function groupByDate(events: CalEvent[]) {
  const groups: Record<string, CalEvent[]> = {};
  for (const ev of events) {
    if (!groups[ev.date]) groups[ev.date] = [];
    groups[ev.date].push(ev);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export default function CalendarPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const selected = selectedId ? DEMO_CALENDAR_EVENTS.find(e => e.id === selectedId) ?? null : null;

  const grouped = groupByDate(DEMO_CALENDAR_EVENTS);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">{DEMO_CALENDAR_EVENTS.length} events</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
        See booked calls, meetings and deadlines. Click any event to see how editing and rescheduling would work.
      </div>

      {/* Event list grouped by date */}
      <div className="space-y-6">
        {grouped.map(([date, events]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">{formatDate(date)}</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="space-y-2">
              {events.map(event => (
                <button
                  key={event.id}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-3.5 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all shadow-sm"
                  onClick={() => setSelectedId(event.id)}
                >
                  <div className="text-center shrink-0 w-10">
                    <div className="text-sm font-bold text-gray-900">{event.time}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{event.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_BADGE[event.type]}`}>
                        {event.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {event.contact_name && (
                      <div className="text-xs text-gray-400 mt-0.5">{event.contact_name}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {event.duration_mins > 0 && (
                      <span className="text-xs text-gray-400">{event.duration_mins}min</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[event.status]}`}>
                      {event.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Event modal */}
      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[selected.type]}`}>
                    {selected.type.replace(/_/g, " ")}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Date</div>
                  <div className="font-medium text-gray-900">{formatDate(selected.date)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Time</div>
                  <div className="font-medium text-gray-900">{selected.time}</div>
                </div>
                {selected.duration_mins > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Duration</div>
                    <div className="font-medium text-gray-900">{selected.duration_mins} minutes</div>
                  </div>
                )}
                {selected.contact_name && (
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Contact</div>
                    <div className="font-medium text-gray-900">{selected.contact_name}</div>
                  </div>
                )}
              </div>

              {selected.location && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Location</div>
                  <div className="text-sm text-gray-700">{selected.location}</div>
                </div>
              )}

              {selected.notes && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Notes</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              {selected.outcome && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <div className="text-xs text-emerald-600 font-semibold mb-0.5">Outcome</div>
                  <p className="text-sm text-emerald-800">{selected.outcome}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => showToast("This would open the edit form in the full build")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Edit event
                </button>
                <button
                  onClick={() => showToast("This would open the reschedule form in the full build")}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
