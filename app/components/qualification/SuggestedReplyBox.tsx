"use client";

import { useState } from "react";

interface Props {
  reply: string;
  contactName?: string | null;
}

export default function SuggestedReplyBox({ reply, contactName }: Props) {
  const [copied, setCopied] = useState(false);
  const text = reply.replace(/\[Name\]/g, contactName ?? "[Name]");

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Suggested Reply</p>
        <button
          onClick={copy}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Copied
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-indigo-800 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
