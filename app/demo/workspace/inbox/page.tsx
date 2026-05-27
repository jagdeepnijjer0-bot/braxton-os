"use client";

import { useState } from "react";
import { DEMO_INBOX_THREADS, DEMO_CONTACTS } from "@/lib/demo/seed";

const PLATFORM_ICONS: Record<string, string> = {
  email:        "✉",
  whatsapp:     "💬",
  instagram:    "📷",
  facebook:     "f",
  website_form: "🌐",
};

const PLATFORM_LABELS: Record<string, string> = {
  email:        "Email",
  whatsapp:     "WhatsApp",
  instagram:    "Instagram",
  facebook:     "Facebook",
  website_form: "Web Form",
};

const PRIORITY_BADGE: Record<string, string> = {
  low:    "bg-gray-100 text-gray-500",
  normal: "bg-blue-50 text-blue-600",
  high:   "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_INBOX_THREADS[0]?.id ?? null);
  const selected = selectedId ? DEMO_INBOX_THREADS.find(t => t.id === selectedId) ?? null : null;

  const contact = selected?.contact_id
    ? DEMO_CONTACTS.find(c => c.id === selected.contact_id)
    : null;

  return (
    <div className="flex h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Left panel — thread list */}
      <div className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-400 text-xs mt-0.5">{DEMO_INBOX_THREADS.filter(t => !t.is_read).length} unread</p>
        </div>

        {/* Info box */}
        <div className="mx-3 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-blue-700 text-xs">
          View conversations from email, WhatsApp, Instagram, Facebook and website enquiries in one place.
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 mt-3">
          {DEMO_INBOX_THREADS.map(thread => (
            <button
              key={thread.id}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                selectedId === thread.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""
              }`}
              onClick={() => setSelectedId(thread.id)}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0 mt-0.5">{PLATFORM_ICONS[thread.platform] ?? "💬"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${!thread.is_read ? "text-gray-900" : "text-gray-600"}`}>
                      {thread.contact_name}
                    </span>
                    {!thread.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{thread.subject}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {thread.messages[thread.messages.length - 1]?.body.slice(0, 60)}…
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[thread.priority] ?? "bg-gray-100 text-gray-500"}`}>
                      {thread.priority}
                    </span>
                    <span className="text-xs text-gray-300">
                      {thread.messages[thread.messages.length - 1]?.time}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — conversation detail */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {selected ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{selected.contact_name}</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {PLATFORM_LABELS[selected.platform] ?? selected.platform}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[selected.priority] ?? "bg-gray-100 text-gray-500"}`}>
                    {selected.priority}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{selected.subject}</div>
              </div>
            </div>

            {/* AI summary */}
            <div className="mx-6 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">AI Summary</span>
                </div>
                <p className="text-amber-800 text-sm">{selected.ai_summary}</p>
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <span className="text-xs text-amber-600 font-medium">Suggested next action: </span>
                  <span className="text-xs text-amber-700">{selected.ai_next_action}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selected.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-sm rounded-xl px-4 py-3 text-sm ${
                      msg.direction === "out"
                        ? "bg-indigo-100 text-indigo-900"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-60">{msg.sender_name}</div>
                    <div className="leading-relaxed">{msg.body}</div>
                    <div className="text-xs opacity-50 mt-1.5 text-right">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Linked contact */}
            {contact && (
              <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3">
                <span className="text-xs text-gray-400">Linked CRM contact:</span>
                <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                <span className="text-xs text-gray-400">{contact.company}</span>
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {contact.status.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {!contact && selected.contact_id === null && (
              <div className="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-400">
                No CRM contact linked — add to CRM to track this lead.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-3">✉</div>
              <p className="text-sm">Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
