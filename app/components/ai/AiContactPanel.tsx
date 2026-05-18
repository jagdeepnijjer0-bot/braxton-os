"use client";

import { useState } from "react";
import AiScoreBadge from "./AiScoreBadge";

interface TaskSuggestion {
  title:       string;
  description: string;
  task_type:   string;
  priority:    string;
  reason:      string;
}

interface Props {
  contactId:     string;
  initialScore:  number | null;
  initialLabel:  "hot" | "warm" | "cold" | null;
  initialScoredAt?: string | null;
  initialSummary?: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high:   "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low:    "bg-gray-100 text-gray-600",
};

const TASK_ICONS: Record<string, string> = {
  call:       "📞",
  follow_up:  "🔔",
  meeting:    "📅",
  outreach:   "📤",
  admin:      "📋",
};

export default function AiContactPanel({
  contactId,
  initialScore,
  initialLabel,
  initialScoredAt,
  initialSummary,
}: Props) {
  const [score,      setScore]      = useState<number | null>(initialScore);
  const [label,      setLabel]      = useState<"hot" | "warm" | "cold" | null>(initialLabel);
  const [scoredAt,   setScoredAt]   = useState<string | null>(initialScoredAt ?? null);
  const [reasoning,  setReasoning]  = useState<string | null>(null);
  const [keyFactors, setKeyFactors] = useState<string[]>([]);
  const [summary,    setSummary]    = useState<string | null>(initialSummary ?? null);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [createdTasks, setCreatedTasks] = useState<Set<number>>(new Set());

  const [scoringBusy,   setScoringBusy]   = useState(false);
  const [summaryBusy,   setSummaryBusy]   = useState(false);
  const [suggestBusy,   setSuggestBusy]   = useState(false);
  const [createBusy,    setCreateBusy]    = useState<number | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  async function runScore() {
    setScoringBusy(true); setError(null);
    try {
      const res = await fetch(`/api/ai/score/${contactId}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setScore(data.score.score);
      setLabel(data.score.label);
      setScoredAt(new Date().toISOString());
      setReasoning(data.score.reasoning);
      setKeyFactors(data.score.key_factors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setScoringBusy(false);
  }

  async function runSummary() {
    setSummaryBusy(true); setError(null);
    try {
      const res = await fetch(`/api/ai/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", id: contactId }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setSummaryBusy(false);
  }

  async function runSuggest() {
    setSuggestBusy(true); setError(null); setCreatedTasks(new Set());
    try {
      const res = await fetch(`/api/ai/suggest/${contactId}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuggestions(data.suggestions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setSuggestBusy(false);
  }

  async function createTask(idx: number, suggestion: TaskSuggestion) {
    setCreateBusy(idx); setError(null);
    try {
      const res = await fetch(`/api/ai/suggest/${contactId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ create: true, single: suggestion }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setCreatedTasks(prev => new Set([...prev, idx]));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setCreateBusy(null);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <h3 className="text-sm font-semibold text-gray-700">AI Intelligence</h3>
          {label && <AiScoreBadge score={score} label={label} scoredAt={scoredAt} compact />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runScore}
            disabled={scoringBusy}
            className="px-3 py-1.5 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            {scoringBusy ? "Scoring…" : "Score Lead"}
          </button>
          <button
            onClick={runSummary}
            disabled={summaryBusy}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {summaryBusy ? "Summarising…" : "Summarise"}
          </button>
          <button
            onClick={runSuggest}
            disabled={suggestBusy}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            {suggestBusy ? "Thinking…" : "Suggest Tasks"}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Score result */}
        {(score !== null || reasoning) && (
          <div className="space-y-2">
            {score !== null && label && (
              <AiScoreBadge score={score} label={label} scoredAt={scoredAt} />
            )}
            {reasoning && (
              <p className="text-sm text-gray-600 italic">"{reasoning}"</p>
            )}
            {keyFactors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keyFactors.map((f, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">AI Summary</p>
            <p className="text-sm text-indigo-900">{summary}</p>
          </div>
        )}

        {/* Task suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggested Actions</p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-lg flex-shrink-0">{TASK_ICONS[s.task_type] ?? "✅"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[s.priority] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    <p className="text-xs text-indigo-500 mt-0.5 italic">Why: {s.reason}</p>
                  </div>
                  <button
                    onClick={() => createTask(i, s)}
                    disabled={createBusy === i || createdTasks.has(i)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      createdTasks.has(i)
                        ? "bg-emerald-100 text-emerald-700 cursor-default"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40"
                    }`}
                  >
                    {createdTasks.has(i) ? "✓ Created" : createBusy === i ? "…" : "Create"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!score && !summary && suggestions.length === 0 && !error && (
          <p className="text-sm text-gray-400 text-center py-2">
            Use the buttons above to score this lead, generate a summary, or get AI task suggestions.
          </p>
        )}
      </div>
    </div>
  );
}
