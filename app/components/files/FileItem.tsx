"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ui/Toast";
import FilePreviewModal from "./FilePreviewModal";

interface FileAttachment {
  id:          string;
  filename:    string;
  file_size:   number;
  mime_type:   string;
  label:       string | null;
  created_at:  string;
  uploaded_by: string | null;
}

interface Props {
  file:      FileAttachment;
  onDeleted: (id: string) => void;
}

function fileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/"))       return "🖼️";
  if (mimeType === "application/pdf")      return "📄";
  if (mimeType.startsWith("video/"))       return "🎬";
  if (mimeType.startsWith("audio/"))       return "🎵";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("word"))           return "📝";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📋";
  return "📎";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function FileItem({ file, onDeleted }: Props) {
  const toast = useToast();
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [previewing,     setPreviewing]     = useState(false);

  const isImage = file.mime_type.startsWith("image/");
  const isPdf   = file.mime_type === "application/pdf";
  const canPreview = isImage || isPdf;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/attachments/${file.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Delete failed (${res.status})`);
      }
      toast.success("File deleted", file.filename);
      onDeleted(file.id);
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : "Could not delete file");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors group">
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-base">
        {fileIcon(file.mime_type)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.filename}</p>
        <p className="text-xs text-gray-400">
          {formatBytes(file.file_size)} · {formatDate(file.created_at)}
          {file.label && <span className="ml-1 text-indigo-500">· {file.label}</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {/* Preview — images and PDFs */}
        {canPreview && (
          <button
            onClick={e => { e.stopPropagation(); setPreviewing(true); }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Preview"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {/* Download */}
        <a
          href={`/api/attachments/${file.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Download"
          onClick={e => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
          </svg>
        </a>

        {/* Delete with confirm */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "…" : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>

    {previewing && (
      <FilePreviewModal
        fileId={file.id}
        filename={file.filename}
        mimeType={file.mime_type}
        onClose={() => setPreviewing(false)}
      />
    )}
    </>
  );
}
