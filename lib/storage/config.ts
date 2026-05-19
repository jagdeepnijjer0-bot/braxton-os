import "server-only";

export const BUCKET_NAME    = "attachments";
export const MAX_FILE_SIZE  = 52_428_800; // 50 MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  // Images
  "image/jpeg":  ".jpg",
  "image/png":   ".png",
  "image/gif":   ".gif",
  "image/webp":  ".webp",
  "image/heic":  ".heic",
  "image/heif":  ".heif",
  // Documents
  "application/pdf":    ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/csv":   ".csv",
  // Audio
  "audio/mpeg": ".mp3",
  "audio/mp4":  ".m4a",
  "audio/wav":  ".wav",
  "audio/ogg":  ".ogg",
  // Video
  "video/mp4":      ".mp4",
  "video/quicktime": ".mov",
};

export type FileEntityType =
  | "contact"
  | "deal"
  | "project"
  | "conversation"
  | "task"
  | "inbox_message";

export function storagePath(
  entityType: FileEntityType,
  entityId: string,
  fileId: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${entityType}/${entityId}/${fileId}-${safe}`;
}
