"use client";

import Link from "next/link";
import { getLeadStatus, getReplyStatus, getPlatform, formatFollowUp } from "@/lib/constants/outreach";
import type { Database, LeadStatus } from "@/lib/supabase/types";

type LeadRow = Database["public"]["Tables"]["outreach_leads"]["Row"];

interface Props {
  lead:            LeadRow;
  onStatusChange:  (id: string, status: LeadStatus) => void;
  onDelete:        (id: string) => void;
}

export default function LeadCard({ lead, onStatusChange, onDelete }: Props) {
  const s   = getLeadStatus(lead.status);
  const rs  = getReplyStatus(lead.reply_status);
  const plt = getPlatform(lead.platform);
  const fu  = lead.next_follow_up ? formatFollowUp(lead.next_follow_up) : null;
  const fuOverdue = fu && (fu.includes("overdue") || fu === "Yesterday");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">{lead.contact_name}</p>
          {lead.company && <p className="text-[10px] text-gray-500 truncate">{lead.company}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Link href={`/outreach/${lead.campaign_id}/leads/${lead.id}/edit`}
            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Link>
          <button onClick={() => onDelete(lead.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${plt.bg} ${plt.color}`}>
          {plt.icon} {plt.label}
        </span>
        <span className={`text-[10px] font-medium ${rs.color}`}>{rs.label}</span>
      </div>

      {lead.step > 1 && (
        <p className="text-[10px] text-gray-400 mb-1.5">Step {lead.step}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {lead.booked_call && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">📅 Booked</span>
        )}
        {lead.closed_deal && (
          <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">🏆 Closed</span>
        )}
        {fu && (
          <span className={`text-[10px] font-semibold ${fuOverdue ? "text-red-600" : "text-gray-500"}`}>
            {fuOverdue ? "⚠ " : ""}Follow-up: {fu}
          </span>
        )}
      </div>

      {/* Quick action buttons */}
      {lead.status !== "closed" && lead.status !== "not_interested" && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1">
          {lead.status === "new" && (
            <button onClick={() => onStatusChange(lead.id, "contacted")}
              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              Contacted
            </button>
          )}
          {lead.status === "contacted" && (
            <button onClick={() => onStatusChange(lead.id, "replied")}
              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors">
              Got Reply
            </button>
          )}
          {lead.status === "replied" && (
            <button onClick={() => onStatusChange(lead.id, "interested")}
              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
              Interested
            </button>
          )}
          {lead.status === "interested" && (
            <button onClick={() => onStatusChange(lead.id, "booked")}
              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
              Book Call
            </button>
          )}
          {lead.status === "booked" && (
            <button onClick={() => onStatusChange(lead.id, "closed")}
              className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
              Close Deal
            </button>
          )}
          <button onClick={() => onStatusChange(lead.id, "ghosted")}
            className="px-2 text-[10px] font-semibold py-1 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors">
            Ghost
          </button>
        </div>
      )}
    </div>
  );
}
