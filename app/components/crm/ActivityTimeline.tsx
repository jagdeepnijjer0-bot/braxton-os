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
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const typeColors: Record<string, string> = {
  note:          "bg-gray-100 text-gray-600",
  call:          "bg-green-100 text-green-700",
  email:         "bg-blue-100 text-blue-700",
  meeting:       "bg-indigo-100 text-indigo-700",
  status_change: "bg-yellow-100 text-yellow-700",
  follow_up_set: "bg-orange-100 text-orange-700",
  created:       "bg-purple-100 text-purple-700",
};

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

  return (
    <div className="space-y-4">
      {/* Log activity form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Log Activity</p>
        <form onSubmit={addActivity} className="space-y-3">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.filter((t) => !["status_change", "created"].includes(t.value)).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value as ActivityType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  type === t.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Add a ${getActivityType(type)?.label.toLowerCase()} note...`}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !body.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Log Activity"}
            </button>
          </div>
        </form>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {activities.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
        )}
        {activities.map((act, i) => {
          const def = getActivityType(act.type);
          return (
            <div key={act.id} className="flex gap-3">
              {/* Line */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${typeColors[act.type] ?? "bg-gray-100"}`}>
                  {def?.icon ?? "•"}
                </div>
                {i < activities.length - 1 && (
                  <div className="w-px flex-1 bg-gray-100 my-1" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 leading-snug">{act.body}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                    {timeAgo(act.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{def?.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
