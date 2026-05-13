"use client";

import Link from "next/link";
import LeadCard from "./LeadCard";
import { PIPELINE_COLS } from "@/lib/constants/outreach";
import type { Database, LeadStatus } from "@/lib/supabase/types";

type LeadRow = Database["public"]["Tables"]["outreach_leads"]["Row"];

interface Props {
  leads:          LeadRow[];
  campaignId:     string;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDelete:       (id: string) => void;
}

export default function OutreachPipeline({ leads, campaignId, onStatusChange, onDelete }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {PIPELINE_COLS.map(col => {
        const colLeads = leads.filter(l => l.status === col.key);
        return (
          <div key={col.key} className="flex flex-col w-60 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
              <span className="text-xs font-bold text-gray-700">{col.label}</span>
              <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {colLeads.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {colLeads.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
                  No leads
                </div>
              ) : colLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onStatusChange={onStatusChange} onDelete={onDelete} />
              ))}
            </div>

            <Link href={`/outreach/${campaignId}/leads/new?status=${col.key}`}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add lead
            </Link>
          </div>
        );
      })}

      {/* Lost column (collapsed) */}
      {(() => {
        const lost = leads.filter(l => ["not_interested","ghosted","unqualified"].includes(l.status));
        if (!lost.length) return null;
        return (
          <div className="flex flex-col w-60 flex-shrink-0 opacity-60">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-xs font-bold text-gray-500">Lost</span>
              <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{lost.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {lost.map(lead => (
                <LeadCard key={lead.id} lead={lead} onStatusChange={onStatusChange} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
