"use client";

import { useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const BookCallButton = dynamic(
  () => import("../workspace/components/BookCallButton"),
  { ssr: false },
);

function track(event_type: string) {
  void fetch("/api/demo/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type, metadata: { source: "services_page" } }),
  });
}

const SERVICES = [
  {
    number: "01",
    title: "Business Operating Systems",
    description:
      "Custom dashboards and internal systems to manage leads, clients, projects, tasks, finance and reporting in one place.",
    examples: [
      "CRM",
      "Unified inbox",
      "Live dashboard",
      "Task tracker",
      "Finance tracker",
      "Deal & project tracker",
      "Weekly reporting",
    ],
    color: "indigo",
  },
  {
    number: "02",
    title: "Automation & AI Workflows",
    description:
      "Automation that reduces manual admin and helps teams respond faster, follow up properly and prioritise the right opportunities.",
    examples: [
      "AI lead scoring",
      "Automatic follow-up tasks",
      "Inbox summaries",
      "Workflow triggers",
      "Team notifications",
      "n8n automations",
    ],
    color: "violet",
  },
  {
    number: "03",
    title: "Lead Generation & Outreach",
    description:
      "Structured outbound systems to generate, track and follow up with leads across different channels.",
    examples: [
      "Outbound calling systems",
      "LinkedIn outreach",
      "Email outreach",
      "WhatsApp follow-ups",
      "Campaign tracking",
      "Booked call tracking",
    ],
    color: "blue",
  },
  {
    number: "04",
    title: "Paid Ads & Lead Capture",
    description:
      "Lead generation funnels that capture enquiries and route them into a CRM with follow-up workflows.",
    examples: [
      "Meta ads",
      "Landing pages",
      "Lead forms",
      "Tracking & attribution",
      "Retargeting",
      "Enquiry follow-up",
    ],
    color: "emerald",
  },
  {
    number: "05",
    title: "Custom Apps & Portals",
    description:
      "Bespoke apps, dashboards and portals for businesses that need something more specific than off-the-shelf software.",
    examples: [
      "Client portals",
      "Contractor portals",
      "Internal tools",
      "Reporting dashboards",
      "Mobile-friendly workflows",
    ],
    color: "orange",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; num: string }> = {
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-100",  text: "text-indigo-700",  num: "text-indigo-400"  },
  violet:  { bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-700",  num: "text-violet-400"  },
  blue:    { bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-700",    num: "text-blue-400"    },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", num: "text-emerald-400" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-100",  text: "text-orange-700",  num: "text-orange-400"  },
};

const TRANSFORMATIONS = [
  {
    label: "Example transformation",
    title: "Manual follow-up reduced",
    before: "Leads scattered across email, Instagram and WhatsApp with no central system.",
    after:  "All enquiries routed into one inbox with follow-up tasks and AI priority labels.",
    result: "Faster response times and fewer missed opportunities.",
  },
  {
    label: "Example transformation",
    title: "Operations made visible",
    before: "Projects, costs and tasks were tracked across messages and spreadsheets.",
    after:  "Deals, projects, files, costs and next actions centralised in one dashboard.",
    result: "Clearer accountability and better project control.",
  },
  {
    label: "Example transformation",
    title: "Growth systemised",
    before: "Outreach, ads and follow-ups were inconsistent with no visibility across channels.",
    after:  "Campaigns, leads, calls and follow-ups tracked through one operating system.",
    result: "More consistent pipeline visibility and easier scaling.",
  },
];

export default function ServicesPage() {
  useEffect(() => {
    track("demo_services_viewed");
  }, []);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top nav */}
      <header className="w-full bg-gray-950 border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/demo/workspace"
            className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="hidden sm:block">Back to demo</span>
          </Link>
          <div className="hidden sm:block w-px h-4 bg-gray-700" />
          <span className="text-white font-black text-base tracking-tight">Braxton OS</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BookCallButton
            variant="banner"
            label="Book Strategy Call"
            onOpen={() => track("demo_book_call_clicked")}
          />
          <Link
            href="/demo/workspace/reserve"
            onClick={() => track("demo_services_cta_clicked")}
            className="hidden sm:block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Reserve Your Build Slot
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full bg-gray-950 text-white px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">What we build</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6">
            Systems that help businesses run smoother, follow up faster and grow with less manual work.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            We build operating systems, automations and growth workflows for businesses that need better visibility, better follow-up and better control.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="w-full bg-gray-50 px-6 py-16">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-gray-900">What we deliver</h2>
          <p className="text-gray-500 mt-1">Five core areas — each built around your specific workflow and goals.</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {SERVICES.map(service => {
            const c = colorMap[service.color];
            return (
              <div key={service.number} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${c.num}`}>
                  {service.number}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{service.description}</p>
                <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${c.text}`}>Includes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {service.examples.map(ex => (
                      <span key={ex} className={`text-xs px-2 py-1 rounded-lg font-medium bg-white border ${c.border} ${c.text}`}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transformations */}
      <section className="w-full bg-white px-6 py-16 border-t border-gray-100">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-gray-900">Results & transformations</h2>
          <p className="text-gray-500 mt-1">
            These are illustrative examples of the kind of outcomes our systems are designed to produce.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TRANSFORMATIONS.map(t => (
            <div key={t.title} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-indigo-600 px-5 py-3 flex items-center gap-2">
                <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">{t.label}</span>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-black text-gray-900 text-base">{t.title}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Before</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">After</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.after}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Result</p>
                    <p className="text-sm text-gray-800 font-medium leading-relaxed">{t.result}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-gray-950 px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-white mb-3">Want this built around your business?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Every Braxton OS build is scoped around your specific workflow, team size and operational goals.
            No generic templates. No off-the-shelf limitations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo/workspace/reserve"
              onClick={() => track("demo_services_cta_clicked")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Reserve Your Build Slot
            </Link>
            <BookCallButton
              variant="primary"
              label="Book Strategy Call"
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              onOpen={() => track("demo_book_call_clicked")}
            />
            <Link
              href="/demo/workspace"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              ← Return to Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
