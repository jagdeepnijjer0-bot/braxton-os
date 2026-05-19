"use client";

import { useState, useRef, DragEvent } from "react";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/storage/config";
import type { FileEntityType } from "@/lib/storage/config";

interface Props {
  entityType: FileEntityType;
  entityId:   string;
  onUploaded: () => void;
}

interface UploadState {
  filename: string;
  progress: number;
  error:    string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function FileUploadZone({ entityType, entityId, onUploaded }: Props) {
  const [dragging, setDragging]   = useState(false);
  const [uploads,  setUploads]    = useState<UploadState[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function setProgress(idx: number, progress: number) {
    setUploads(prev => prev.map((u, i) => i === idx ? { ...u, progress } : u));
  }
  function setError(idx: number, error: string) {
    setUploads(prev => prev.map((u, i) => i === idx ? { ...u, error } : u));
  }

  async function uploadFile(file: File, idx: number) {
    if (!ALLOWED_MIME_TYPES[file.type]) {
      setError(idx, `File type ${file.type || "unknown"} is not allowed`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(idx, `File exceeds 50 MB limit (${formatBytes(file.size)})`);
      return;
    }

    // 1. Get signed upload URL
    let signedData: { signedUrl: string; token: string; path: string; file_id: string };
    try {
      const res = await fetch("/api/attachments/upload-url", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id:   entityId,
          filename:    file.name,
          mime_type:   file.type,
          file_size:   file.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(idx, data.error ?? "Failed to get upload URL"); return; }
      signedData = data;
    } catch {
      setError(idx, "Network error requesting upload URL");
      return;
    }

    // 2. XHR upload with progress
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedData.signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(idx, Math.round((e.loaded / e.total) * 90));
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(idx, 95);
          // 3. Save metadata
          try {
            const metaRes = await fetch("/api/attachments", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                entity_type:  entityType,
                entity_id:    entityId,
                storage_path: signedData.path,
                filename:     file.name,
                file_size:    file.size,
                mime_type:    file.type,
              }),
            });
            if (!metaRes.ok) {
              const d = await metaRes.json();
              setError(idx, d.error ?? "Failed to save file metadata");
            } else {
              setProgress(idx, 100);
              setTimeout(() => {
                setUploads(prev => prev.filter((_, i) => i !== idx));
                onUploaded();
              }, 800);
            }
          } catch {
            setError(idx, "Network error saving file metadata");
          }
        } else {
          setError(idx, `Upload failed (HTTP ${xhr.status})`);
        }
        resolve();
      };

      xhr.onerror = () => { setError(idx, "Upload failed — network error"); resolve(); };
      xhr.send(file);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const base = uploads.length;
    setUploads(prev => [...prev, ...arr.map(f => ({ filename: f.name, progress: 0, error: null }))]);
    await Promise.all(arr.map((f, i) => uploadFile(f, base + i)));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const busy = uploads.some(u => u.progress > 0 && u.progress < 100 && !u.error);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-4 py-6 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={Object.keys(ALLOWED_MIME_TYPES).join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-1.5">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-gray-600">
            {dragging ? "Drop files here" : "Drop files or click to upload"}
          </p>
          <p className="text-xs text-gray-400">Images, PDFs, Office docs, audio &amp; video · max 50 MB each</p>
        </div>
      </div>

      {/* Upload progress rows */}
      {uploads.map((u, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-100 rounded-xl">
          <span className="text-sm flex-shrink-0">
            {u.error ? "❌" : u.progress === 100 ? "✅" : "⏳"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{u.filename}</p>
            {u.error ? (
              <p className="text-xs text-red-500">{u.error}</p>
            ) : (
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 w-8 text-right">
            {u.error ? "" : u.progress === 100 ? "" : `${u.progress}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
