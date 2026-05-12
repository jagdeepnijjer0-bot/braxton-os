import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import ContactForm from "@/app/components/crm/ContactForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditContactPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (!contact) notFound();

  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/crm" className="hover:text-indigo-600">CRM</Link>
        <span>/</span>
        <Link href={`/crm/${id}`} className="hover:text-indigo-600">{contact.name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </nav>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Edit Contact</h2>
        <p className="text-sm text-gray-500 mt-0.5">Update the details for {contact.name}.</p>
      </div>
      <ContactForm mode="edit" contactId={id} initial={contact} />
    </div>
  );
}
