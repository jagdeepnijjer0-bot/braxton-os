import Link from "next/link";
import ContactForm from "@/app/components/crm/ContactForm";

export default function NewContactPage() {
  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/crm" className="text-gray-400 hover:text-indigo-600 transition-colors">CRM</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">New Contact</span>
      </nav>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">Add New Contact</h2>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details to create a new CRM contact.</p>
      </div>
      <ContactForm mode="create" />
    </div>
  );
}
