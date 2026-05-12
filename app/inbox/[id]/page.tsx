import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getPlatform, getInboxStatus, getInboxPriority, INBOX_STATUSES, INBOX_PRIORITIES, INBOX_CATEGORIES, initials, avatarColor } from "@/lib/constants/inbox";
import MessageThread from "@/app/components/inbox/MessageThread";
import PlatformBadge from "@/app/components/inbox/PlatformBadge";
import InboxStatusBadge from "@/app/components/inbox/InboxStatusBadge";
import ConversationDetailActions from "@/app/components/inbox/ConversationDetailActions";

interface Props { params: Promise<{ id: string }> }

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const [{ data: conv, error }, { data: messages }] = await Promise.all([
    supabase.from("inbox_conversations").select("*").eq("id", id).single(),
    supabase.from("inbox_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
  ]);

  if (error || !conv) notFound();

  // Mark as read on open
  if (!conv.is_read) {
    await supabase.from("inbox_conversations").update({ is_read: true }).eq("id", id);
  }

  const priority = getInboxPriority(conv.priority);
  const av = avatarColor(conv.contact_name);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/inbox" className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${av}`}>
            {initials(conv.contact_name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold text-gray-900 truncate">
                {conv.subject ?? conv.contact_name ?? "Conversation"}
              </h1>
              <PlatformBadge value={conv.platform} size="xs" />
              <InboxStatusBadge value={conv.status} />
              {conv.priority !== "normal" && (
                <span className={`text-xs font-semibold ${priority.color}`}>● {priority.label}</span>
              )}
            </div>
            {conv.contact_name && (
              <p className="text-xs text-gray-400">{conv.contact_name}{conv.contact_email ? ` · ${conv.contact_email}` : ""}</p>
            )}
          </div>
        </div>
        <Link href={`/inbox/${id}/edit`}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </Link>
      </div>

      {/* Body: thread + sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Message thread */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <MessageThread
            conversationId={id}
            messages={(messages ?? []).map(m => ({
              id: m.id, direction: m.direction, body: m.body,
              sender_name: m.sender_name, created_at: m.created_at, is_read: m.is_read,
            }))}
            contactName={conv.contact_name}
          />
        </div>

        {/* Sidebar metadata */}
        <div className="w-72 border-l border-gray-100 bg-gray-50/50 overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-4 space-y-4">
            {/* Quick status actions */}
            <ConversationDetailActions conversationId={id} currentStatus={conv.status} />

            {/* Linked contact */}
            {conv.contact_id && (
              <div className="bg-white border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">CRM Contact</p>
                <Link href={`/crm/${conv.contact_id}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  {conv.contact_name}
                </Link>
                {conv.contact_email && <p className="text-xs text-gray-400 mt-0.5">{conv.contact_email}</p>}
              </div>
            )}

            {/* Category */}
            {conv.assigned_category && (
              <div className="bg-white border border-gray-100 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm text-gray-700">{conv.assigned_category}</p>
              </div>
            )}

            {/* Suggested reply */}
            {conv.ai_suggested_reply && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-2">Suggested Reply</p>
                <p className="text-xs text-indigo-800 leading-relaxed whitespace-pre-wrap">{conv.ai_suggested_reply}</p>
              </div>
            )}

            {/* Next action */}
            {conv.next_action && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Next Action</p>
                <p className="text-sm text-amber-800">{conv.next_action}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Info</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Created</span>
                <span className="text-gray-700">{new Date(conv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Messages</span>
                <span className="text-gray-700">{(messages ?? []).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
