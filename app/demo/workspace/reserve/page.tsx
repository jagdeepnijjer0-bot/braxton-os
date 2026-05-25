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
  const [selected, setSelected] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReserve() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demo/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: selected, timeframe, notes }),
      });
      const json = await res.json() as { error?: string; package_name?: string };
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
      <div className="p-6 max-w-lg mx-auto text-center space-y-6 pt-16">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-black text-white">You&apos;re reserved!</h1>
        <p className="text-gray-400">
          We&apos;ve noted your interest in <strong className="text-white">{pkg?.name}</strong>.
          Our team will reach out within 24 hours to schedule your strategy call and confirm your build slot.
        </p>
        <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-5 text-left text-sm text-indigo-200 space-y-2">
          <div>✅ Package interest logged</div>
          <div>✅ CRM deal created for your account</div>
          <div>✅ Strategy call task created for our team</div>
          <div>✅ You&apos;ll hear from us within 24 hours</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Reserve your Braxton OS</h1>
        <p className="text-gray-400 text-sm">
          No payment today — just tell us which package fits your business and we&apos;ll hold your build slot.
        </p>
      </div>

      {/* Package cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DEMO_PACKAGES.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => setSelected(pkg.id)}
            className={`text-left bg-gray-900 border rounded-2xl p-5 transition-all ${
              selected === pkg.id
                ? "border-indigo-500 ring-2 ring-indigo-500/30"
                : pkg.highlight
                ? "border-indigo-700/60 hover:border-indigo-600"
                : "border-gray-800 hover:border-gray-600"
            }`}
          >
            {pkg.highlight && (
              <div className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full inline-block mb-3 font-semibold">
                Most popular
              </div>
            )}
            <div className="font-black text-xl text-white mb-1">{pkg.name}</div>
            <div className="text-indigo-400 font-bold text-lg">{pkg.price}</div>
            <div className="text-gray-500 text-xs mb-3">{pkg.period}</div>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">{pkg.description}</p>
            <ul className="space-y-1.5">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {selected === pkg.id && (
              <div className="mt-4 text-xs text-indigo-400 font-semibold">✓ Selected</div>
            )}
          </button>
        ))}
      </div>

      {/* Reservation form */}
      {selected && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 max-w-lg">
          <h2 className="font-bold text-white">Almost there — just a couple of questions</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              When are you looking to get started?
            </label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a timeframe</option>
              {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Anything else you&apos;d like us to know?
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Team size, current tools, specific challenges…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? "Reserving your slot…" : `Reserve ${DEMO_PACKAGES.find(p => p.id === selected)?.name} →`}
          </button>

          <p className="text-gray-600 text-xs text-center">
            No payment. No contract. Just a conversation.
          </p>
        </div>
      )}
    </div>
  );
}
