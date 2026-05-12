import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import LeadTypeBadge from "@/app/components/crm/LeadTypeBadge";
import StatusBadge from "@/app/components/crm/StatusBadge";
import FollowUpBadge from "@/app/components/crm/FollowUpBadge";
import ActivityTimeline from "@/app/components/crm/ActivityTimeline";
import DeleteContactButton from "@/app/components/crm/DeleteContactButton";

type Props = { params: Promise<{ id: string }> };

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const [{ data: contact }, { data: activities }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).single(),
    supabase
      .from("contact_activities")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!contact) notFound();

  function fmt(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  const fields = [
    { label: "Email",     value: contact.email   ? <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">{contact.email}</a>    : null },
    { label: "Phone",     value: contact.phone   ? <a href={`tel:${contact.phone}`}   className="text-indigo-600 hover:underline">{contact.phone}</a>      : null },
    { label: "Company",   value: contact.company },
    { label: "Role",      value: contact.role },
    { label: "Source",    value: contact.source },
    { label: "Added",     value: fmt(contact.created_at) },
    { label: "Last Contacted", value: fmt(contact.last_contacted) },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/crm" className="hover:text-indigo-600">CRM</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{contact.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 text-lg font-bold flex items-center justify-center flex-shrink-0">
            {contact.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{contact.name}</h2>
            {(contact.role || contact.company) && (
              <p className="text-sm text-gray-500 mt-0.5">
                {[contact.role, contact.company].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge value={contact.status} />
              <LeadTypeBadge value={contact.lead_type} />
              <FollowUpBadge date={contact.follow_up_date} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/crm/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </Link>
            <DeleteContactButton id={id} name={contact.name} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: details + notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>
            <dl className="space-y-2.5">
              {fields.map(({ label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <dt className="text-xs font-medium text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</dt>
                  <dd className="text-sm text-gray-800 flex-1 min-w-0 break-words">
                    {value ?? <span className="text-gray-300">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Right: activity timeline */}
        <div className="lg:col-span-3">
          <ActivityTimeline
            contactId={id}
            activities={activities ?? []}
            onAdded={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
