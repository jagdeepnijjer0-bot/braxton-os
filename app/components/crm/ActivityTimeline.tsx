"use client";

import { useState } from "react";
import { ACTIVITY_TYPES, getActivityType } from "@/lib/constants/crm";
import type { ActivityType } from "@/lib/supabase/types";

interface Activity {
  id: string;
  type: string;
  body: string;
  created_at: string;
  metadata?: unknown;
}

interface Props {
  contactId: string;
  activities: Activity[];
  onAdded: (activity: Activity) => void;
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

const TYPE_STYLES: Record<string, { bg: string; icon: string; dot: string }> = {
  note:          { bg: "bg-gray-100",   icon: "📝", dot: "bg-gray-400" },
  call:          { bg: "bg-green-100",  icon: "📞", dot: "bg-green-500" },
  email:         { bg: "bg-blue-100",   icon: "✉️",  dot: "bg-blue-500" },
  meeting:       { bg: "bg-indigo-100", icon: "📅", dot: "bg-indigo-500" },
  status_change: { bg: "bg-yellow-100", icon: "🔄", dot: "bg-yellow-500" },
  follow_up_set: { bg: "bg-orange-100", icon: "⏰", dot: "bg-orange-500" },
  created:       { bg: "bg-violet-100", icon: "✅", dot: "bg-violet-500" },
};

const LOGGABLE = ACTIVITY_TYPES.filter((t) => !["status_change", "created"].includes(t.value));

export default function ActivityTimeline({ contactId, activities: initial, onAdded }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initial);
  const [type, setType]     = useState<ActivityType>("note");
  const [body, setBody]     = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/contacts/${contactId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, body }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed to save");
      }
      const created: Activity = await res.json();
      setActivities((prev) => [created, ...prev]);
      onAdded(created);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const style = TYPE_STYLES[type] ?? TYPE_STYLES.note;

  return (
    <div className="space-y-5">
      {/* Log form */}
      <form onSubmit={addActivity} className="space-y-3">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1.5">
          {LOGGABLE.map((t) => {
            const s = TYPE_STYLES[t.value];
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value as ActivityType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  type === t.value
                    ? `${s.bg} border-transparent text-gray-800`
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (body.trim()) addActivity(e as unknown as React.FormEvent);
              }
            }}
            placeholder={`Log a ${getActivityType(type)?.label.toLowerCase()}... (⌘Enter to save)`}
            rows={2}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all placeholder-gray-400"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
            {saving ? "Saving..." : "Log"}
          </button>
        </div>
      </form>

      {/* Divider */}
      {activities.length > 0 && <div className="border-t border-gray-100" />}

      {/* Feed */}
      {activities.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No activity yet — log a call, email or note above.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((act, i) => {
            const s = TYPE_STYLES[act.type] ?? TYPE_STYLES.note;
            const def = getActivityType(act.type);
            const isLast = i === activities.length - 1;
            return (
              <div key={act.id} className="flex gap-3 group">
                {/* Timeline track */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full ${s.bg} flex items-center justify-center text-sm flex-shrink-0 mt-0.5`}>
                    {s.icon}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {def?.label ?? act.type}
                      </span>
                      <p className="text-sm text-gray-800 leading-relaxed">{act.body}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5 whitespace-nowrap">
                      {timeAgo(act.created_at)}
                    </span>
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
