"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRIES = [
  "Property / Real Estate",
  "Letting / Estate Agency",
  "Construction / Refurbishment",
  "Financial Services",
  "Professional Services",
  "Technology",
  "Retail / E-Commerce",
  "Other",
];

const BOTTLENECK_OPTIONS = [
  "Lead generation",
  "Lead follow-up",
  "Organisation / admin",
  "Team communication",
  "Project tracking",
  "Client management",
  "Sales process",
  "Marketing consistency",
  "Finance visibility",
  "Scaling operations",
  "Too many manual tasks",
  "No central system",
];

export default function DemoAccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const bottleneck_value = fd.get("bottleneck") as string || null;
    const payload = {
      name:          fd.get("name") as string,
      email:         fd.get("email") as string,
      business_name: fd.get("business_name") as string,
      industry:      fd.get("industry") as string || null,
      problem:       bottleneck_value,
      bottleneck:    bottleneck_value,
    };

    try {
      const res = await fetch("/api/demo/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      router.push("/demo/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/demo" className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-block">
          ← Back to overview
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Get instant demo access</h1>
            <p className="text-gray-400 text-sm">
              72 hours of live access. No credit card. No sales call.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full name *</label>
              <input
                name="name"
                required
                placeholder="Jane Smith"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Work email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="jane@company.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Business name</label>
              <input
                name="business_name"
                placeholder="Smith Properties Ltd"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
              <select
                name="industry"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select (optional)</option>
                {INDUSTRIES.map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Biggest operational challenge *
              </label>
              <select
                name="bottleneck"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select your main challenge</option>
                {BOTTLENECK_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? "Setting up your workspace…" : "Enter the demo →"}
            </button>
          </form>

          <p className="text-gray-600 text-xs text-center mt-4">
            By continuing you agree to receive follow-up messages from Braxton OS. No spam.
          </p>
        </div>
      </div>
    </div>
  );
}
