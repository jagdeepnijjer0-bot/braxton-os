"use client";

import { useState } from "react";
import { LOGGABLE_DEAL_ACTIVITIES, getDealActivityType } from "@/lib/constants/deals";
import type { DealActivityType } from "@/lib/supabase/types";

interface Activity {
  id: string;
  type: string;
  body: string;
  created_at: string;
  metadata?: unknown;
}

interface Props {
  dealId: string;
  activities: Activity[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TYPE_STYLES: Record<string, { bg: string; dot: string }> = {
  note:             { bg: "bg-gray-100",   dot: "bg-gray-400" },
  call:             { bg: "bg-green-100",  dot: "bg-green-500" },
  email:            { bg: "bg-blue-100",   dot: "bg-blue-500" },
  meeting:          { bg: "bg-indigo-100", dot: "bg-indigo-500" },
  offer_made:       { bg: "bg-violet-100", dot: "bg-violet-500" },
  financial_update: { bg: "bg-emerald-100",dot: "bg-emerald-500" },
  stage_change:     { bg: "bg-amber-100",  dot: "bg-amber-500" },
  created:          { bg: "bg-purple-100", dot: "bg-purple-500" },
};

export default function DealActivityTimeline({ dealId, activities: initial }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initial);
  const [type, setType]   = useState<DealActivityType>("note");
  const [body, setBody]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/deals/${dealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, body }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const created: Activity = await res.json();
      setActivities((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Log form */}
      <form onSubmit={addActivity} className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {LOGGABLE_DEAL_ACTIVITIES.map((t) => {
            const s = TYPE_STYLES[t.value];
            return (
              <button key={t.value} type="button" onClick={() => setType(t.value as DealActivityType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  type === t.value ? `${s?.bg} border-transparent text-gray-800` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) { e.preventDefault(); addActivity(e as unknown as React.FormEvent); } }}
          placeholder={`Add a ${getDealActivityType(type)?.label.toLowerCase()} note... (⌘Enter to save)`}
          rows={2}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all placeholder-gray-400"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={saving || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {saving
              ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
            {saving ? "Saving..." : "Log"}
          </button>
        </div>
      </form>

      {activities.length > 0 && <div className="border-t border-gray-100" />}

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
      ) : (
        <div>
          {activities.map((act, i) => {
            const s = TYPE_STYLES[act.type] ?? TYPE_STYLES.note;
            const def = getDealActivityType(act.type);
            const isLast = i === activities.length - 1;
            return (
              <div key={act.id} className="flex gap-3 group">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full ${s.bg} flex items-center justify-center text-sm flex-shrink-0 mt-0.5`}>
                    {def?.icon ?? "•"}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
                </div>
                <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 mb-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {def?.label ?? act.type}
                      </span>
                      <p className="text-sm text-gray-800 leading-relaxed">{act.body}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5 whitespace-nowrap">{timeAgo(act.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
