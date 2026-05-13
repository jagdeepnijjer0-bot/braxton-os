import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import LeadForm from "@/app/components/outreach/LeadForm";
import ActivityFeed from "@/app/components/outreach/ActivityFeed";
import Link from "next/link";

interface Props { params: Promise<{ id: string; leadId: string }> }

export default async function EditLeadPage({ params }: Props) {
  const { id, leadId } = await params;
  const supabase = createServerClient();

  const [{ data: lead, error }, { data: campaign }] = await Promise.all([
    supabase.from("outreach_leads").select("*").eq("id", leadId).single(),
    supabase.from("outreach_campaigns").select("campaign_name").eq("id", id).single(),
  ]);
  if (error || !lead) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/outreach/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to {campaign?.campaign_name ?? "Campaign"}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
        <p className="text-sm text-gray-500 mt-1">{lead.contact_name}{lead.company ? ` · ${lead.company}` : ""}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Lead Details</h2>
          <LeadForm campaignId={id} initial={lead} leadId={leadId} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Activity Timeline</h2>
          <ActivityFeed leadId={leadId} campaignId={id} />
        </div>
      </div>
    </div>
  );
}
