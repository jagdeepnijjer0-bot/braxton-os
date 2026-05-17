import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import ContactForm from "@/app/components/crm/ContactForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditContactPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contact) notFound();

  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/crm" className="text-gray-400 hover:text-indigo-600 transition-colors">CRM</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href={`/crm/${id}`} className="text-gray-400 hover:text-indigo-600 transition-colors">{contact.name}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </nav>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">Edit Contact</h2>
        <p className="text-sm text-gray-500 mt-0.5">Update the details for {contact.name}.</p>
      </div>
      <ContactForm mode="edit" contactId={id} initial={contact} />
    </div>
  );
}
