"use client";

import { useState } from "react";
import type { QualificationSession } from "@/lib/supabase/types";
import { HEAT_CONFIG, LEAD_TYPE_LABELS } from "@/lib/constants/qualification";
import LeadScoreBadge from "./LeadScoreBadge";

interface Props {
  sessions: QualificationSession[];
  onDelete?: (id: string) => void;
}

export default function QualificationHistory({ sessions, onDelete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!sessions.length) {
    return <p className="text-xs text-gray-400 italic">No qualification sessions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map(s => {
        const isOpen = expanded === s.id;
        return (
          <div key={s.id} className={`border rounded-xl overflow-hidden ${HEAT_CONFIG[s.heat].border}`}>
            <button
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setExpanded(isOpen ? null : s.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <LeadScoreBadge heat={s.heat} score={s.score} />
                <span className="text-xs font-medium text-gray-700 truncate">
                  {LEAD_TYPE_LABELS[s.lead_type] ?? s.lead_type}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-gray-400">
                  {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>Score: <strong className="text-gray-900">{s.score}</strong></span>
                  <span className={`font-semibold ${HEAT_CONFIG[s.heat].color}`}>{HEAT_CONFIG[s.heat].label} lead</span>
                </div>

                {s.suggested_reply && (
                  <div className="bg-indigo-50 rounded-lg p-2">
                    <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">Suggested Reply</p>
                    <p className="text-xs text-indigo-800 leading-relaxed whitespace-pre-wrap">{s.suggested_reply}</p>
                  </div>
                )}

                {s.next_action && (
                  <div className="bg-amber-50 rounded-lg p-2">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Next Action</p>
                    <p className="text-xs text-amber-800">{s.next_action}</p>
                  </div>
                )}

                {s.notes && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{s.notes}</p>
                  </div>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(s.id)}
                    className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete session
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
