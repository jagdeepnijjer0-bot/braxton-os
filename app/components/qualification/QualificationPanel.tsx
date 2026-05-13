"use client";

import { useState, useEffect, useCallback } from "react";
import type { QualLeadType, QualificationTemplate, QualificationSession } from "@/lib/supabase/types";
import { LEAD_TYPE_LABELS, HEAT_CONFIG, computeScore, computeHeat, maxScore, getSuggestedReply } from "@/lib/constants/qualification";
import LeadScoreBadge from "./LeadScoreBadge";
import SuggestedReplyBox from "./SuggestedReplyBox";
import QualificationForm from "./QualificationForm";
import QualificationHistory from "./QualificationHistory";

interface Props {
  contactId?: string | null;
  conversationId?: string | null;
  contactName?: string | null;
  defaultLeadType?: QualLeadType | null;
}

type PanelView = "history" | "new";

function Spinner() {
  return <div className="flex justify-center py-6"><div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" /></div>;
}

export default function QualificationPanel({ contactId, conversationId, contactName, defaultLeadType }: Props) {
  const [view,      setView]      = useState<PanelView>("history");
  const [sessions,  setSessions]  = useState<QualificationSession[]>([]);
  const [template,  setTemplate]  = useState<QualificationTemplate | null>(null);
  const [leadType,  setLeadType]  = useState<QualLeadType | "">(defaultLeadType ?? "");
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [loadingTpl, setLoadingTpl] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (contactId)      params.set("contact_id",      contactId);
    if (conversationId) params.set("conversation_id", conversationId);
    const res = await fetch(`/api/qualification/sessions?${params}`);
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }, [contactId, conversationId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    if (!leadType) { setTemplate(null); return; }
    setLoadingTpl(true);
    setAnswers({});
    fetch(`/api/qualification/templates/${leadType}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setTemplate(d); setLoadingTpl(false); });
  }, [leadType]);

  const score   = template ? computeScore(template.questions, answers) : 0;
  const max     = template ? maxScore(template.questions) : 0;
  const heat    = template ? computeHeat(score, template.heat_thresholds) : "cold";
  const reply   = template ? getSuggestedReply(template.reply_templates, heat) : "";
  const nextAct = template ? (template.next_actions[heat] ?? "") : "";
  const answered = template ? template.questions.filter(q => answers[q.id]).length : 0;
  const total    = template ? template.questions.length : 0;

  function handleAnswer(qId: string, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  async function handleSave() {
    if (!leadType || !template) return;
    setSaving(true);
    await fetch("/api/qualification/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_type:       leadType,
        contact_id:      contactId ?? null,
        conversation_id: conversationId ?? null,
        answers,
        score,
        heat,
        notes:           notes.trim() || null,
        suggested_reply: reply || null,
        next_action:     nextAct || null,
      }),
    });
    setSaving(false);
    setView("history");
    setAnswers({});
    setNotes("");
    setLeadType(defaultLeadType ?? "");
    await loadSessions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this qualification session?")) return;
    await fetch(`/api/qualification/sessions/${id}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lead Qualification</h3>
        </div>
        <div className="flex gap-1">
          {(["history","new"] as PanelView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors capitalize ${view === v ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
            >
              {v === "history" ? `History (${sessions.length})` : "+ Qualify"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* HISTORY TAB */}
        {view === "history" && (
          loading ? <Spinner /> : (
            <QualificationHistory sessions={sessions} onDelete={handleDelete} />
          )
        )}

        {/* NEW QUALIFICATION TAB */}
        {view === "new" && (
          <div className="space-y-4">
            {/* Lead type selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lead Type</label>
              <select
                value={leadType}
                onChange={e => setLeadType(e.target.value as QualLeadType | "")}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select lead type…</option>
                {(Object.keys(LEAD_TYPE_LABELS) as QualLeadType[]).map(lt => (
                  <option key={lt} value={lt}>{LEAD_TYPE_LABELS[lt]}</option>
                ))}
              </select>
            </div>

            {loadingTpl && <Spinner />}

            {template && !loadingTpl && (
              <>
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{answered}/{total} answered</span>
                    {answered > 0 && (
                      <LeadScoreBadge heat={heat} score={score} maxScore={max} />
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${HEAT_CONFIG[heat].dot}`}
                      style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Questions */}
                <QualificationForm
                  questions={template.questions}
                  answers={answers}
                  onChange={handleAnswer}
                />

                {/* Live score preview */}
                {answered > 0 && (
                  <div className={`rounded-xl p-3 border ${HEAT_CONFIG[heat].border} ${HEAT_CONFIG[heat].bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <LeadScoreBadge heat={heat} score={score} maxScore={max} size="md" />
                      <span className={`text-xs font-semibold ${HEAT_CONFIG[heat].color}`}>Lead Score</span>
                    </div>
                    {reply && (
                      <SuggestedReplyBox reply={reply} contactName={contactName} />
                    )}
                    {nextAct && (
                      <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2">
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Recommended Next Action</p>
                        <p className="text-xs text-amber-800">{nextAct}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Add any additional context…"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving || answered === 0}
                  className="w-full py-2 px-4 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? "Saving…" : "Save Qualification"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
