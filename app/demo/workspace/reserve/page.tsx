"use client";

import { useState } from "react";
import { DEMO_PACKAGES } from "@/lib/demo/seed";

const TIMEFRAMES = [
  "ASAP — ready to start now",
  "Within 2 weeks",
  "Within a month",
  "1–3 months",
  "Just exploring for now",
];

export default function DemoReservePage() {
  const [selected, setSelected]   = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("");
  const [notes, setNotes]         = useState("");
  const [outcome, setOutcome]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleReserve() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demo/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: selected,
          timeframe,
          notes: [notes, outcome ? `Desired outcome: ${outcome}` : ""].filter(Boolean).join("\n"),
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const pkg = DEMO_PACKAGES.find(p => p.id === selected);
    return (
      <div className="min-h-full bg-gray-50 flex items-start justify-center pt-16 px-6 pb-12">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-3xl mx-auto">✓</div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Build slot reserved</h1>
            <p className="text-gray-500 leading-relaxed">
              Your interest in <strong className="text-gray-900">{pkg?.name}</strong> has been noted.
              We&apos;ll be in touch within 24 hours to review your business and recommend the best setup.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What happens next</p>
            {[
              "Your interest has been logged against your demo profile",
              "A strategy call will be arranged to understand your workflow",
              "We'll recommend the right build and scope for your business",
              "No payment is taken until you&apos;re fully comfortable",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-8">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Reserve Your Build Slot</h1>
        <p className="text-gray-500 leading-relaxed">
          Every build is tailored to your workflow, business size and operational goals.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-blue-700 text-sm">
          No payment today — reserve your build slot and we&apos;ll recommend the best setup after reviewing your business.
        </div>
      </div>

      {/* Package cards — equal height, badge inline with title */}
      <div className="grid sm:grid-cols-3 gap-5 items-stretch">
        {DEMO_PACKAGES.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => setSelected(pkg.id)}
            className={`text-left bg-white border rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col ${
              selected === pkg.id
                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                : pkg.highlight
                ? "border-indigo-200 hover:border-indigo-400"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Name + badge on same line */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-black text-xl text-gray-900">{pkg.name}</span>
              {pkg.highlight && (
                <span className="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                  Most popular
                </span>
              )}
            </div>

            {"subtitle" in pkg && typeof pkg.subtitle === "string" && (
              <div className="text-indigo-600 text-sm font-medium mb-4">{pkg.subtitle}</div>
            )}

            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="text-gray-900 font-bold">{pkg.price}</div>
              {pkg.period && <div className="text-gray-400 text-xs mt-0.5">{pkg.period}</div>}
            </div>

            <p className="text-gray-500 text-sm mb-5 leading-relaxed">{pkg.description}</p>

            <ul className="space-y-2 flex-1">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Select button pinned to bottom of each card */}
            <div className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${
              selected === pkg.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            }`}>
              {selected === pkg.id ? "Selected ✓" : "Select this package"}
            </div>
          </button>
        ))}
      </div>

      {/* Reservation form — appears after selecting */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-xl shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reserve your slot</h2>
            <p className="text-gray-400 text-sm">
              Just a few quick questions so we can prepare for our conversation.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                When are you looking to get started?
              </label>
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Select a timeframe</option>
                {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What outcome are you hoping to achieve?
              </label>
              <input
                type="text"
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                placeholder="E.g. reduce manual admin, get full visibility across deals and projects…"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Anything else we should know? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Team size, current tools, biggest challenges…"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? "Reserving your slot…" : "Reserve Your Build Slot →"}
          </button>

          <p className="text-gray-400 text-xs text-center">
            No payment. No contract. Just a conversation about your business.
          </p>
        </div>
      )}
    </div>
  );
}
