"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INBOX_STATUSES } from "@/lib/constants/inbox";
import type { InboxStatus } from "@/lib/supabase/types";

interface Props {
  conversationId: string;
  currentStatus: InboxStatus;
}

export default function ConversationDetailActions({ conversationId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<InboxStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus: InboxStatus) {
    if (newStatus === status) return;
    setSaving(true);
    await fetch(`/api/inbox/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Status {saving && <span className="text-indigo-400 ml-1">saving…</span>}
      </p>
      <div className="flex flex-col gap-1">
        {INBOX_STATUSES.map(s => (
          <button key={s.value} onClick={() => updateStatus(s.value as InboxStatus)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
              status === s.value
                ? `${s.bg} ${s.color}`
                : "text-gray-500 hover:bg-gray-50"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === s.value ? s.dot : "bg-gray-200"}`} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
