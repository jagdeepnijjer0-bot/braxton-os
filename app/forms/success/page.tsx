import Link from "next/link";

const FORM_LABELS: Record<string, string> = {
  landlord:      "Landlord Enquiry",
  investor:      "Investor Criteria",
  maintenance:   "Maintenance Enquiry",
  website_app:   "Website & App Enquiry",
  ai_automation: "AI Automation Enquiry",
};

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export const metadata = { title: "Enquiry Received — Braxton OS" };

export default async function FormSuccessPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const label = (type && FORM_LABELS[type]) ? FORM_LABELS[type] : "Enquiry";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 bg-green-900/40 border border-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-white mb-3">{label} Received!</h1>
      <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8">
        Thank you for reaching out. A member of our team will review your submission and be in touch shortly.
      </p>

      <div className="space-y-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Submit another enquiry</div>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <Link href="/forms/landlord"      className="block py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">Landlord Enquiry</Link>
          <Link href="/forms/investor"      className="block py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">Investor Criteria</Link>
          <Link href="/forms/maintenance"   className="block py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">Maintenance Request</Link>
          <Link href="/forms/website-app"   className="block py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">Website &amp; App Enquiry</Link>
          <Link href="/forms/ai-automation" className="block py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">AI Automation Enquiry</Link>
        </div>
      </div>
    </div>
  );
}
