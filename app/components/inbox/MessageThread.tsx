"use client";

import { useState, useRef, useEffect } from "react";
import type { MessageDirection } from "@/lib/supabase/types";

interface Message {
  id: string;
  direction: MessageDirection;
  body: string;
  sender_name: string | null;
  created_at: string;
  is_read: boolean;
}

interface Props {
  conversationId: string;
  messages: Message[];
  contactName: string | null;
  onMessageSent?: (msg: Message) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageThread({ conversationId, messages: initial, contactName, onMessageSent }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [body, setBody]         = useState("");
  const [direction, setDirection] = useState<MessageDirection>("outbound");
  const [senderName, setSenderName] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/inbox/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, direction, sender_name: senderName || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const msg: Message = await res.json();
      setMessages(prev => [...prev, msg]);
      onMessageSent?.(msg);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No messages yet. Add the first message below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOut = msg.direction === "outbound";
            return (
              <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] group`}>
                  {/* sender label */}
                  {!isOut && (
                    <p className="text-[10px] text-gray-400 mb-1 ml-1">
                      {msg.sender_name ?? contactName ?? "Contact"}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isOut
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    {msg.body}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${isOut ? "text-right mr-1" : "ml-1"}`}>
                    {formatTime(msg.created_at)}
                    {isOut && <span className="ml-1">✓</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose area */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        {/* Direction toggle */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs text-gray-400">Direction:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
            {(["inbound", "outbound"] as MessageDirection[]).map(d => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={`px-3 py-1.5 font-medium transition-colors capitalize ${
                  direction === d ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}>
                {d === "inbound" ? "↙ Inbound" : "↗ Outbound"}
              </button>
            ))}
          </div>
          {direction === "inbound" && (
            <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
              placeholder="Sender name (optional)"
              className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          )}
        </div>

        <form onSubmit={send} className="flex gap-2 items-end">
          <textarea
            value={body} onChange={e => setBody(e.target.value)} rows={2}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) { e.preventDefault(); send(e as unknown as React.FormEvent); } }}
            placeholder={direction === "outbound" ? "Type your reply… (⌘Enter to send)" : "Paste inbound message…"}
            className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-gray-400"
          />
          <button type="submit" disabled={saving || !body.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all self-end">
            {saving
              ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
            {saving ? "…" : "Send"}
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}
