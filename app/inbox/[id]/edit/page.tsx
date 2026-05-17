import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import ConversationForm from "@/app/components/inbox/ConversationForm";

interface Props { params: Promise<{ id: string }> }

export default async function EditConversationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: conv, error } = await supabase
    .from("inbox_conversations").select("*").eq("id", id).single();

  if (error || !conv) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/inbox" className="hover:text-gray-600 transition-colors">Inbox</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href={`/inbox/${id}`} className="hover:text-gray-600 transition-colors truncate max-w-[200px]">
          {conv.subject ?? conv.contact_name ?? "Conversation"}
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Conversation</h1>
      </div>
      <ConversationForm mode="edit" convId={id} initial={conv} />
    </div>
  );
}
