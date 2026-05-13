"use client";

import type { QualQuestion } from "@/lib/supabase/types";

interface Props {
  questions: QualQuestion[];
  answers: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
}

export default function QualificationForm({ questions, answers, onChange }: Props) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id}>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            <span className="text-gray-400 mr-1">{i + 1}.</span>
            {q.text}
          </label>

          {q.type === "select" && q.options ? (
            <div className="space-y-1.5">
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(q.id, opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                      selected
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`inline-block w-3.5 h-3.5 rounded-full border mr-2 align-middle flex-shrink-0 ${selected ? "bg-indigo-500 border-indigo-500" : "border-gray-300"}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : q.type === "boolean" ? (
            <div className="flex gap-2">
              {["yes", "no"].map(v => {
                const selected = answers[q.id] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onChange(q.id, v)}
                    className={`px-4 py-2 rounded-lg text-xs border capitalize transition-all ${
                      selected ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          ) : q.type === "number" ? (
            <input
              type="number"
              value={answers[q.id] ?? ""}
              onChange={e => onChange(q.id, e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          ) : (
            <textarea
              value={answers[q.id] ?? ""}
              onChange={e => onChange(q.id, e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          )}
        </div>
      ))}
    </div>
  );
}
