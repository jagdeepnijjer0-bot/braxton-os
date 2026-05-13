import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import LeadForm from "@/app/components/outreach/LeadForm";
import Link from "next/link";

interface Props { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }

export default async function NewLeadPage({ params }: Props) {
  const { id }   = await params;
  const supabase = createServerClient();
  const { data: campaign, error } = await supabase.from("outreach_campaigns").select("campaign_name").eq("id", id).single();
  if (error || !campaign) notFound();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/outreach/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to {campaign.campaign_name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Lead</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new lead to this campaign.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <LeadForm campaignId={id} />
      </div>
    </div>
  );
}
