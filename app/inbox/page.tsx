"use client";

import { useState } from "react";

const messages = [
  {
    id: 1,
    from: "Alice Johnson",
    company: "Acme Corp",
    subject: "Re: Q3 Proposal Follow-up",
    preview: "Hi, thanks for sending over the proposal. I had a chance to review it with my team and we have a few questions...",
    time: "10:32 AM",
    unread: true,
    tag: "Deal",
  },
  {
    id: 2,
    from: "Bob Martinez",
    company: "Globex Inc",
    subject: "Contract terms question",
    preview: "We'd like to discuss the payment schedule in section 3. Our finance team prefers quarterly billing rather than monthly...",
    time: "9:15 AM",
    unread: true,
    tag: "Deal",
  },
  {
    id: 3,
    from: "Carol Lee",
    company: "Initech",
    subject: "Intro call recap",
    preview: "Great speaking with you today! As discussed, I'll loop in our CTO for the technical evaluation next week...",
    time: "Yesterday",
    unread: false,
    tag: "Follow-up",
  },
  {
    id: 4,
    from: "David Park",
    company: "Umbrella Ltd",
    subject: "Looking for solutions",
    preview: "We're currently evaluating a few vendors and your platform came highly recommended by a colleague...",
    time: "Yesterday",
    unread: false,
    tag: "Lead",
  },
  {
    id: 5,
    from: "Elena Torres",
    company: "Hooli",
    subject: "Demo request",
    preview: "Could we schedule a demo for next week? We're particularly interested in the reporting and analytics features...",
    time: "May 9",
    unread: false,
    tag: "Demo",
  },
  {
    id: 6,
    from: "Frank Wright",
    company: "Pied Piper",
    subject: "Invoice received",
    preview: "Just wanted to confirm we received the invoice and payment is being processed. Should clear by end of week...",
    time: "May 9",
    unread: false,
    tag: "Admin",
  },
  {
    id: 7,
    from: "Grace Kim",
    company: "Aviato",
    subject: "Renewal discussion",
    preview: "Our contract is up next quarter and we're very happy with the service. Let's discuss renewal terms when you have time...",
    time: "May 8",
    unread: false,
    tag: "Renewal",
  },
];

const tagBadge: Record<string, string> = {
  Deal: "bg-indigo-100 text-indigo-700",
  "Follow-up": "bg-orange-100 text-orange-700",
  Lead: "bg-blue-100 text-blue-700",
  Demo: "bg-purple-100 text-purple-700",
  Admin: "bg-gray-100 text-gray-600",
  Renewal: "bg-green-100 text-green-700",
};

const activeMessage = messages[0];

export default function InboxPage() {
  const [selected, setSelected] = useState(activeMessage.id);
  const currentMsg = messages.find((m) => m.id === selected) ?? messages[0];

  return (
    <div className="flex gap-5 h-[calc(100vh-130px)]">
      {/* Message list */}
      <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-1.5">
            {["All", "Unread", "Tagged"].map((tab) => (
              <button
                key={tab}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  tab === "All" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
            2 new
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => setSelected(msg.id)}
              className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                selected === msg.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {msg.unread && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                  <span className={`text-sm ${msg.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {msg.from}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{msg.time}</span>
              </div>
              <p className={`text-xs mb-1.5 truncate ${msg.unread ? "font-medium text-gray-700" : "text-gray-500"}`}>
                {msg.subject}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 truncate flex-1 mr-2">{msg.preview}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${tagBadge[msg.tag] ?? "bg-gray-100 text-gray-500"}`}>
                  {msg.tag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message detail */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Email header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{currentMsg.subject}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                  {currentMsg.from[0]}
                </div>
                <span className="text-sm text-gray-600">{currentMsg.from}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{currentMsg.company}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{currentMsg.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><polyline points="16 17 12 21 8 17" /><polyline points="8 7 12 3 16 7" /></svg>
              </button>
              <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Email body */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            {currentMsg.preview}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-4">
            Would it be possible to schedule a call this week to go over our questions in detail? We&apos;re excited about the potential partnership and want to move things forward quickly.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-4">
            Looking forward to hearing from you.
          </p>
          <p className="text-sm text-gray-700 mt-4">
            Best regards,<br />
            <span className="font-medium">{currentMsg.from}</span><br />
            <span className="text-gray-500">{currentMsg.company}</span>
          </p>
        </div>

        {/* Reply box */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
              Reply to {currentMsg.from}
            </div>
            <textarea
              className="w-full px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none"
              placeholder="Write your reply..."
              rows={3}
            />
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                </button>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
