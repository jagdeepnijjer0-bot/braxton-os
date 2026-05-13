import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import CampaignForm from "@/app/components/outreach/CampaignForm";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default async function EditCampaignPage({ params }: Props) {
  const { id }   = await params;
  const supabase = createServerClient();
  const { data: campaign, error } = await supabase.from("outreach_campaigns").select("*").eq("id", id).single();
  if (error || !campaign) notFound();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/outreach/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Campaign
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
        <p className="text-sm text-gray-500 mt-1 truncate">{campaign.campaign_name}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <CampaignForm initial={campaign} campaignId={id} />
      </div>
    </div>
  );
}
