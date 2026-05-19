"use client";

import { useState, useEffect, useCallback } from "react";
import FileItem from "./FileItem";
import FileUploadZone from "./FileUploadZone";
import type { FileEntityType } from "@/lib/storage/config";

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
  entityType: FileEntityType;
  entityId:   string;
  title?:     string;
}

export default function FileAttachments({ entityType, entityId, title = "Files & Attachments" }: Props) {
  const [files,    setFiles]    = useState<FileAttachment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attachments?entity_type=${entityType}&entity_id=${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.attachments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  function handleDeleted(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📎</span>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {files.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold bg-gray-100 text-gray-500 rounded-full">
              {files.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-5 space-y-4">
          {/* Upload zone */}
          <FileUploadZone
            entityType={entityType}
            entityId={entityId}
            onUploaded={load}
          />

          {/* File list */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No files attached yet.</p>
          ) : (
            <div className="space-y-2">
              {files.map(f => (
                <FileItem key={f.id} file={f} onDeleted={handleDeleted} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
