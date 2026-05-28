import Link from "next/link";
import { DEMO_KPI } from "@/lib/demo/seed";

export const metadata = { title: "Braxton OS — Live Demo" };

const FEATURES = [
  {
    icon: "👥",
    title: "Smart CRM",
    desc: "AI-scored leads, full contact history, and automated follow-up triggers — all in one place.",
  },
  {
    icon: "📬",
    title: "Unified Inbox",
    desc: "Email, WhatsApp, and web messages unified. Reply, route, and close conversations without switching apps.",
  },
  {
    icon: "✅",
    title: "Task & Calendar",
    desc: "Auto-generated tasks from leads and deals. Never miss a follow-up or deadline again.",
  },
  {
    icon: "⚡",
    title: "Automation Engine",
    desc: "n8n-powered workflows that qualify leads, notify your team, and update your CRM automatically.",
  },
  {
    icon: "💼",
    title: "Deal Pipeline",
    desc: "Visual deal tracker with stage automation and revenue forecasting built in.",
  },
  {
    icon: "📊",
    title: "Live Dashboard",
    desc: "Real-time KPIs across every part of your business — no spreadsheets needed.",
  },
];

const STATS = [
  { value: DEMO_KPI.active_leads,    label: "Active Leads"     },
  { value: DEMO_KPI.open_deals,      label: "Open Deals"       },
  { value: DEMO_KPI.total_pipeline,  label: "Pipeline Value"   },
  { value: DEMO_KPI.monthly_revenue, label: "Monthly Revenue"  },
];

export default function DemoLandingPage() {
  return (
    <div className="w-full min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/50 rounded-full px-4 py-1.5 text-indigo-300 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Live interactive demo — no credit card required
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
            See how your business could run<br />
            <span className="text-indigo-400">with an AI operating system</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Braxton OS replaces your scattered tools with one intelligent platform —
            CRM, inbox, tasks, automations, and deals working together in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo/access"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Get instant access →
            </Link>
            <Link
              href="#features"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              See what&apos;s inside
            </Link>
          </div>
        </div>
      </section>

      {/* Live stats strip */}
      <section className="bg-gray-900/60 border-y border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-indigo-400">{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Everything in one OS</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Built for property companies, agencies, and service businesses that are done
          with patchwork software stacks.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700/50 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-gray-900/40 border-y border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-2xl font-bold mb-3">
            &ldquo;We went from 12 spreadsheets to one dashboard. Our team saves 15+ hours a week.&rdquo;
          </p>
          <p className="text-gray-400">— Property portfolio manager, Manchester</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to see it in action?</h2>
        <p className="text-gray-400 mb-8">
          Get 72 hours of access to a live workspace. No credit card. No sales call.
          Just the product.
        </p>
        <Link
          href="/demo/access"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
        >
          Start your free demo →
        </Link>
      </section>
    </div>
  );
}
