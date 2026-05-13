"use client";

import { useState, useEffect, useCallback } from "react";
import { getActivityType, ACTIVITY_TYPES, timeAgo } from "@/lib/constants/outreach";
import type { Database, OutreachActivityType } from "@/lib/supabase/types";

type ActivityRow = Database["public"]["Tables"]["outreach_activities"]["Row"];

interface Props { leadId: string; campaignId: string }

export default function ActivityFeed({ leadId, campaignId }: Props) {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [type,       setType]       = useState<OutreachActivityType>("note");
  const [body,       setBody]       = useState("");
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    const res  = await fetch(`/api/outreach/leads/${leadId}/activities`);
    const data = await res.json();
    setActivities(Array.isArray(data) ? data : []);
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await fetch(`/api/outreach/leads/${leadId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, activity_type: type, body: body.trim() }),
    });
    setBody("");
    setSaving(false);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Log activity form */}
      <form onSubmit={addActivity} className="flex flex-col gap-2">
        <select value={type} onChange={e => setType(e.target.value as OutreachActivityType)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {ACTIVITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="text" value={body} onChange={e => setBody(e.target.value)}
            placeholder="Log an activity or note…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" disabled={saving || !body.trim()}
            className="px-3 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {saving ? "…" : "Log"}
          </button>
        </div>
      </form>

      {/* Timeline */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No activity logged yet.</p>
        ) : activities.map((a, i) => {
          const at = getActivityType(a.activity_type);
          return (
            <div key={a.id} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <span className="text-base">{at.icon}</span>
                {i < activities.length - 1 && <div className="w-px h-full min-h-[16px] bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{at.label}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                </div>
                {a.body && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{a.body}</p>}
                {a.created_by && <p className="text-[10px] text-gray-400 mt-0.5">by {a.created_by}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
