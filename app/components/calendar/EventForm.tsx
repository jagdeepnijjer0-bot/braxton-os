"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPES } from "@/lib/constants/tasks";
import type { Database, EventType } from "@/lib/supabase/types";

type EventRow = Database["public"]["Tables"]["calendar_events"]["Row"];

interface Props {
  initial?: Partial<EventRow>;
  eventId?: string;
  defaultDate?: string; // pre-fill start date
}

export default function EventForm({ initial, eventId, defaultDate }: Props) {
  const router  = useRouter();
  const isEdit  = !!eventId;

  const defaultStart = initial?.start_datetime
    ? initial.start_datetime.slice(0, 16)
    : defaultDate ? `${defaultDate}T09:00` : "";

  const [title,      setTitle]      = useState(initial?.title       ?? "");
  const [description,setDescription]= useState(initial?.description ?? "");
  const [eventType,  setEventType]  = useState<EventType>(initial?.event_type  ?? "meeting");
  const [start,      setStart]      = useState(defaultStart);
  const [end,        setEnd]        = useState(initial?.end_datetime ? initial.end_datetime.slice(0,16) : "");
  const [allDay,     setAllDay]     = useState(initial?.all_day     ?? false);
  const [color,      setColor]      = useState(initial?.color       ?? "");
  const [contactId,  setContactId]  = useState(initial?.linked_contact_id ?? "");
  const [dealId,     setDealId]     = useState(initial?.linked_deal_id    ?? "");
  const [projectId,  setProjectId]  = useState(initial?.linked_project_id ?? "");

  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [deals,    setDeals]    = useState<{ id: string; title: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch("/api/contacts?limit=100").then(r => r.json()).then(d => setContacts(Array.isArray(d) ? d : []));
    fetch("/api/deals?limit=100").then(r => r.json()).then(d => setDeals(Array.isArray(d) ? d : []));
    fetch("/api/projects?limit=100").then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (!start && !allDay) { setError("Start date/time is required"); return; }
    setSaving(true); setError("");

    const payload = {
      title: title.trim(),
      description:        description  || null,
      event_type:         eventType,
      start_datetime:     allDay ? `${start.split("T")[0]}T00:00:00Z` : new Date(start).toISOString(),
      end_datetime:       end ? new Date(end).toISOString() : null,
      all_day:            allDay,
      color:              color || null,
      linked_contact_id:  contactId || null,
      linked_deal_id:     dealId    || null,
      linked_project_id:  projectId || null,
    };

    const url    = isEdit ? `/api/calendar/${eventId}` : "/api/calendar";
    const method = isEdit ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      setSaving(false);
      return;
    }
    router.push("/calendar");
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#0ea5e9","#f97316","#64748b"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <div>
        <label className={labelCls}>Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Event title…" required />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          className={`${inputCls} resize-none`} rows={2} placeholder="Optional notes…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Event Type</label>
          <select value={eventType} onChange={e => setEventType(e.target.value as EventType)} className={inputCls}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm text-gray-700 font-medium">All day</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{allDay ? "Date" : "Start"}</label>
          <input type={allDay ? "date" : "datetime-local"} value={start}
            onChange={e => setStart(e.target.value)} className={inputCls} />
        </div>
        {!allDay && (
          <div>
            <label className={labelCls}>End (optional)</label>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className={inputCls} />
          </div>
        )}
      </div>

      {/* Color picker */}
      <div>
        <label className={labelCls}>Colour (optional)</label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(color === c ? "" : c)}
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"}`}
              style={{ backgroundColor: c }} />
          ))}
          {color && (
            <button type="button" onClick={() => setColor("")}
              className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Link to (optional)</p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelCls}>Contact</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Deal</label>
            <select value={dealId} onChange={e => setDealId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
        </button>
      </div>
    </form>
  );
}
