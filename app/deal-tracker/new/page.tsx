import Link from "next/link";
import DealForm from "@/app/components/deals/DealForm";

export default function NewDealPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/deal-tracker" className="hover:text-gray-600 transition-colors">Deal Tracker</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">New Deal</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add a Deal</h1>
        <p className="text-sm text-gray-500 mt-1">Enter the property details to add it to your pipeline.</p>
      </div>

      <DealForm mode="create" />
    </div>
  );
}
