import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import LeadTypeBadge from "@/app/components/crm/LeadTypeBadge";
import StatusBadge from "@/app/components/crm/StatusBadge";
import FollowUpBadge from "@/app/components/crm/FollowUpBadge";
import ActivityTimeline from "@/app/components/crm/ActivityTimeline";
import DeleteContactButton from "@/app/components/crm/DeleteContactButton";
import QualificationPanel from "@/app/components/qualification/QualificationPanel";
import AiContactPanel from "@/app/components/ai/AiContactPanel";
import type { QualLeadType } from "@/lib/supabase/types";

type Props = { params: Promise<{ id: string }> };

function displayName(contact: { name?: string | null; first_name?: string | null; last_name?: string | null; company?: string | null; email?: string | null }): string {
  if (contact.name) return contact.name;
  const full = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  return contact.company ?? contact.email ?? "Unknown Contact";
}

function initials(name: string) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = [
  "from-violet-400 to-violet-600",
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-indigo-400 to-indigo-600",
  "from-cyan-400 to-cyan-600",
  "from-pink-400 to-pink-600",
];
function avatarGradient(name: string | null | undefined) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: contact }, { data: activities }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).single(),
    supabase.from("contact_activities").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
  ]);

  if (!contact) notFound();

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/crm" className="text-gray-400 hover:text-indigo-600 transition-colors">CRM</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">{displayName(contact)}</span>
      </nav>

      {/* Hero card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Gradient strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${avatarGradient(displayName(contact))}`} />

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(displayName(contact))} flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0`}>
              {initials(displayName(contact))}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName(contact)}</h2>
              {(contact.role || contact.company) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[contact.role, contact.company].filter(Boolean).join(" · ")}
                </p>
              )}
              {contact.source && (
                <p className="text-xs text-gray-400 mt-0.5">via {contact.source}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge value={contact.status} />
                <LeadTypeBadge value={contact.lead_type} />
                <FollowUpBadge date={contact.follow_up_date} />
              </div>
            </div>

            {/* Quick contact + actions */}
            <div className="flex flex-wrap items-center gap-2">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.05 6.05l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call
                </a>
              )}
              <Link
                href={`/crm/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </Link>
              <DeleteContactButton id={id} name={displayName(contact)} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Intelligence Panel */}
      <AiContactPanel
        contactId={id}
        initialScore={contact.ai_score ?? null}
        initialLabel={contact.ai_score_label ?? null}
        initialScoredAt={contact.ai_scored_at ?? null}
        initialSummary={contact.ai_summary ?? null}
      />

      {/* AI Qualification Panel */}
      <QualificationPanel
        contactId={id}
        contactName={displayName(contact)}
        defaultLeadType={contact.lead_type as QualLeadType | null}
      />

      {/* Body: info + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact info */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Info</h3>
            <dl className="space-y-3">
              {[
                {
                  label: "Email",
                  value: contact.email
                    ? <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline break-all">{contact.email}</a>
                    : null,
                },
                {
                  label: "Phone",
                  value: contact.phone
                    ? <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline">{contact.phone}</a>
                    : null,
                },
                { label: "Company",  value: contact.company },
                { label: "Role",     value: contact.role },
                { label: "Source",   value: contact.source },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-400 w-20 flex-shrink-0 pt-0.5">{label}</dt>
                  <dd className="text-sm text-gray-800 flex-1 min-w-0">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>

          {/* Timeline card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Timeline</h3>
            <dl className="space-y-3">
              {[
                { label: "Added",          value: fmt(contact.created_at) },
                { label: "Last contacted", value: fmt(contact.last_contacted) },
                { label: "Follow-up",      value: contact.follow_up_date ? new Date(contact.follow_up_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="text-xs font-medium text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</dt>
                  <dd className="text-sm text-gray-700">{value ?? <span className="text-gray-300">—</span>}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Right: activity */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity</h3>
            <ActivityTimeline
              contactId={id}
              activities={activities ?? []}
              onAdded={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
