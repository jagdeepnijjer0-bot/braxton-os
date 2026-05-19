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
  const [files,   setFiles]   = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attachments?entity_type=${entityType}&entity_id=${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.attachments ?? []);
      } else {
        setError(`API error ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  function handleDeleted(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-indigo-200 bg-white shadow-sm">
      {/* Header — always visible, never collapses */}
      <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center gap-2">
        <span className="text-lg">📎</span>
        <h3 className="text-sm font-bold text-indigo-800 tracking-wide">{title}</h3>
        {files.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
            {files.length}
          </span>
        )}
      </div>

      {/* Body — always open */}
      <div className="p-5 space-y-4">
        {/* Upload zone — always shown */}
        <FileUploadZone
          entityType={entityType}
          entityId={entityId}
          onUploaded={load}
        />

        {/* Status */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
            Could not load files: {error}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-2">
            <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs text-gray-400">Loading files…</span>
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-1">No files attached yet.</p>
        )}

        {!loading && files.length > 0 && (
          <div className="space-y-2">
            {files.map(f => (
              <FileItem key={f.id} file={f} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
