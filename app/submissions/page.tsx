import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth-server";
import Link from "next/link";
import SubmissionStatusUpdate from "./SubmissionStatusUpdate";
import type { FormStatus, FormType } from "@/lib/supabase/types";

export const metadata = { title: "Form Submissions — Braxton OS" };

const FORM_TYPE_LABELS: Record<FormType, string> = {
  landlord:      "Landlord",
  investor:      "Investor",
  maintenance:   "Maintenance",
  website_app:   "Website/App",
  ai_automation: "AI Automation",
};

const STATUS_COLORS: Record<FormStatus, string> = {
  new:       "bg-blue-900/40 text-blue-300 border-blue-700",
  reviewed:  "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  contacted: "bg-purple-900/40 text-purple-300 border-purple-700",
  qualified: "bg-green-900/40 text-green-300 border-green-700",
  closed:    "bg-gray-800 text-gray-400 border-gray-600",
};

const FORM_TYPE_COLORS: Record<FormType, string> = {
  landlord:      "bg-indigo-900/40 text-indigo-300",
  investor:      "bg-emerald-900/40 text-emerald-300",
  maintenance:   "bg-orange-900/40 text-orange-300",
  website_app:   "bg-cyan-900/40 text-cyan-300",
  ai_automation: "bg-violet-900/40 text-violet-300",
};

export default async function SubmissionsPage() {
  await requireAuth();
  const supabase = await createServerClient();

  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = submissions ?? [];

  const counts: Record<string, number> = { total: rows.length };
  for (const s of rows) {
    counts[s.form_type]  = (counts[s.form_type]  ?? 0) + 1;
    counts[s.status]     = (counts[s.status]      ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Form Submissions</h1>
          <p className="text-gray-400 text-sm mt-1">
            All public enquiry form submissions — {rows.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {(["landlord","investor","maintenance","website_app","ai_automation"] as FormType[]).map((t) => (
            <span key={t} className={`text-xs px-2 py-1 rounded-full font-medium ${FORM_TYPE_COLORS[t]}`}>
              {FORM_TYPE_LABELS[t]} {counts[t] ?? 0}
            </span>
          ))}
        </div>
      </div>

      {/* Status summary strip */}
      <div className="grid grid-cols-5 gap-3">
        {(["new","reviewed","contacted","qualified","closed"] as FormStatus[]).map((s) => (
          <div key={s} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{counts[s] ?? 0}</div>
            <div className="text-xs text-gray-400 capitalize mt-1">{s}</div>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium text-gray-400 mb-2">No submissions yet</p>
            <p className="text-sm">
              Share a form link to start receiving enquiries:
            </p>
            <div className="mt-4 space-y-1 text-sm text-indigo-400">
              <div>/forms/landlord</div>
              <div>/forms/investor</div>
              <div>/forms/maintenance</div>
              <div>/forms/website-app</div>
              <div>/forms/ai-automation</div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Key Detail</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map((sub) => {
                  const d = sub.data as Record<string, string>;
                  const name     = d.name  ?? "—";
                  const email    = d.email ?? null;
                  const phone    = d.phone ?? null;
                  const keyField = d.service_needed ?? d.strategy ?? d.issue_type ??
                                   d.project_type   ?? d.automation_goal ?? null;
                  const formType = sub.form_type as FormType;
                  const status   = sub.status   as FormStatus;

                  return (
                    <tr key={sub.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "2-digit",
                        })}
                        <br />
                        <span className="text-gray-600">
                          {new Date(sub.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${FORM_TYPE_COLORS[formType]}`}>
                          {FORM_TYPE_LABELS[formType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {email && <div>{email}</div>}
                        {phone && <div>{phone}</div>}
                        {!email && !phone && <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {keyField ? (
                          <span className="capitalize">{keyField.replace(/_/g, " ")}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SubmissionStatusUpdate
                          id={sub.id}
                          currentStatus={status}
                          statusColors={STATUS_COLORS}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {sub.contact_id ? (
                          <Link
                            href={`/crm/${sub.contact_id}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            View →
                          </Link>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form links */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Public Form Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            { href: "/forms/landlord",      label: "Landlord Enquiry",      color: FORM_TYPE_COLORS.landlord },
            { href: "/forms/investor",      label: "Investor Criteria",     color: FORM_TYPE_COLORS.investor },
            { href: "/forms/maintenance",   label: "Maintenance Request",   color: FORM_TYPE_COLORS.maintenance },
            { href: "/forms/website-app",   label: "Website & App",         color: FORM_TYPE_COLORS.website_app },
            { href: "/forms/ai-automation", label: "AI Automation",         color: FORM_TYPE_COLORS.ai_automation },
          ]).map(({ href, label, color }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
            >
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color} mr-2`}>
                  {label}
                </span>
              </div>
              <span className="text-gray-500 text-xs group-hover:text-indigo-400 transition-colors">{href} ↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
