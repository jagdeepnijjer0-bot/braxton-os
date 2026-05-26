"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  onClose: () => void;
  sessionName?: string;
  sessionEmail?: string;
}

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

export default function BookCallModal({ onClose, sessionName, sessionEmail }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "calendly" | "done">("loading");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fire book-call API on mount (once)
  useEffect(() => {
    fetch("/api/demo/book-call", { method: "POST" })
      .catch(() => { /* non-critical */ })
      .finally(() => {
        setState(CALENDLY_URL ? "calendly" : "done");
      });
  }, []);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Build Calendly URL with prefilled fields
  function getCalendlyEmbedUrl() {
    const base = CALENDLY_URL.replace(/\/$/, "");
    const params = new URLSearchParams({
      embed_type: "Inline",
      hide_gdpr_banner: "1",
      primary_color: "4f46e5",
    });
    if (sessionName) params.set("name", sessionName);
    if (sessionEmail) params.set("email", sessionEmail);
    return `${base}?${params.toString()}`;
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Book a strategy call"
    >
      <div className="relative w-full sm:max-w-2xl bg-gray-900 border border-gray-700 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
           style={{ maxHeight: "95dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="font-bold text-white text-lg leading-tight">Book a strategy call</h2>
            <p className="text-gray-400 text-xs mt-0.5">Free 30-minute walkthrough — no obligation</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Preparing your booking…</p>
            </div>
          )}

          {state === "calendly" && CALENDLY_URL && (
            <div className="relative">
              {/* Calendly inline iframe */}
              <iframe
                src={getCalendlyEmbedUrl()}
                title="Book a call"
                className="w-full border-0"
                style={{ height: "60dvh", minHeight: "480px" }}
                allow="camera; microphone"
                loading="eager"
              />
            </div>
          )}

          {state === "done" && (
            <div className="flex flex-col items-center justify-center py-16 px-8 gap-6 text-center">
              <div className="w-16 h-16 bg-emerald-900/40 border border-emerald-700/40 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">We&apos;ll be in touch!</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                  Our team has been notified and will reach out within 24 hours to schedule
                  a strategy call with you.
                </p>
              </div>
              <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4 text-left text-sm text-indigo-200 space-y-1.5 w-full max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Your interest has been logged
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  CRM activity created
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Team notified — expect a reply within 24h
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-colors w-full max-w-sm"
              >
                Continue exploring
              </button>
            </div>
          )}
        </div>

        {/* Footer — only shown when Calendly is visible */}
        {state === "calendly" && (
          <div className="px-5 py-3 border-t border-gray-800 shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Prefer email? We&apos;ll follow up automatically.</p>
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
