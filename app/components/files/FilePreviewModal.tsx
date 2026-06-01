"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  fileId:   string;
  filename: string;
  mimeType: string;
  onClose:  () => void;
}

export default function FilePreviewModal({ fileId, filename, mimeType, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  // Fetch the signed URL on mount
  useEffect(() => {
    fetch(`/api/attachments/${fileId}/download`, { redirect: "follow" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        // The route redirects — capture the final URL
        setSignedUrl(r.url);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load preview"));
  }, [fileId]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
    >
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
           style={{ width: "min(92vw, 960px)", maxHeight: "92dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{isImage ? "🖼️" : isPdf ? "📄" : "📎"}</span>
            <span className="text-sm font-medium text-white truncate">{filename}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {signedUrl && (
              <a
                href={signedUrl}
                download={filename}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
                </svg>
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-950 min-h-0">
          {error && (
            <div className="text-red-400 text-sm text-center px-8 py-12">
              <div className="text-3xl mb-3">⚠️</div>
              {error}
            </div>
          )}

          {!error && !signedUrl && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading preview…</p>
            </div>
          )}

          {!error && signedUrl && isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt={filename}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: "calc(92dvh - 56px)" }}
            />
          )}

          {!error && signedUrl && isPdf && (
            <iframe
              src={signedUrl}
              title={filename}
              className="w-full border-0"
              style={{ height: "calc(92dvh - 56px)" }}
            />
          )}

          {!error && signedUrl && !isImage && !isPdf && (
            <div className="text-center px-8 py-12 space-y-4">
              <div className="text-5xl">📎</div>
              <p className="text-gray-300 font-medium">{filename}</p>
              <p className="text-gray-500 text-sm">Preview not available for this file type.</p>
              <a
                href={signedUrl}
                download={filename}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
                </svg>
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
