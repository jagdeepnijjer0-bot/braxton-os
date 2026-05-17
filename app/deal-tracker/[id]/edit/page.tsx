import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import DealForm from "@/app/components/deals/DealForm";

interface Props { params: Promise<{ id: string }> }

export default async function EditDealPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: deal, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !deal) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/deal-tracker" className="hover:text-gray-600 transition-colors">Deal Tracker</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href={`/deal-tracker/${id}`} className="hover:text-gray-600 transition-colors truncate max-w-[200px]">{deal.deal_name}</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Deal</h1>
        <p className="text-sm text-gray-500 mt-1">Update the details for <span className="font-medium text-gray-700">{deal.deal_name}</span>.</p>
      </div>

      <DealForm mode="edit" dealId={id} initial={deal} />
    </div>
  );
}
