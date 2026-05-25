import Link from "next/link";
import { DEMO_INBOX } from "@/lib/demo/seed";

export const metadata = { title: "Inbox — Braxton OS Demo" };

const PLATFORM_ICONS: Record<string, string> = {
  email:        "✉️",
  whatsapp:     "💬",
  instagram:    "📸",
  linkedin:     "💼",
  facebook:     "📘",
  website_form: "🌐",
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    "text-gray-400",
  normal: "text-blue-400",
  high:   "text-orange-400",
  urgent: "text-red-400",
};

export default function DemoInboxPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="text-gray-400 text-sm mt-1">
            Unified messages from all channels — email, WhatsApp, LinkedIn, and web forms
          </p>
        </div>
        <div className="bg-red-900/40 text-red-300 text-xs px-3 py-1.5 rounded-lg border border-red-700/40 font-semibold">
          2 unread
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-xl px-5 py-4 text-sm text-indigo-300">
        <strong>In your real OS:</strong> every inbound message — regardless of channel — lands here.
        AI can draft replies, route to team members, and auto-close resolved threads.
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
        {DEMO_INBOX.map(conv => (
          <div
            key={conv.id}
            className={`px-5 py-4 ${!conv.is_read ? "bg-gray-900" : "bg-gray-900/50"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="text-2xl shrink-0">{PLATFORM_ICONS[conv.platform] ?? "💬"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${!conv.is_read ? "text-white" : "text-gray-300"}`}>
                      {conv.contact_name}
                    </span>
                    {!conv.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{conv.subject}</div>
                  <div className="text-sm text-gray-400 truncate">{conv.latest_message}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs font-semibold ${PRIORITY_COLORS[conv.priority] ?? "text-gray-400"}`}>
                  {conv.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(conv.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-700/40 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <span className="font-bold text-white">Your inbox</span> would connect your real email, WhatsApp Business, LinkedIn DMs, and website forms — all searchable and automatable.
        </div>
        <Link
          href="/demo/workspace/reserve"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Get yours →
        </Link>
      </div>
    </div>
  );
}
