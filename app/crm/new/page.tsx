import ContactForm from "@/app/components/crm/ContactForm";

export default function NewContactPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">Add New Contact</h2>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to create a new CRM contact.</p>
      </div>
      <ContactForm mode="create" />
    </div>
  );
}
