import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "upload"
  | "download"
  | "status_change"
  | "login"
  | "logout";

export type AuditEntityType =
  | "contact"
  | "deal"
  | "project"
  | "task"
  | "file"
  | "inbox_conversation"
  | "finance_transaction"
  | "notification"
  | "user"
  | "team";

interface AuditEntry {
  userId:     string | null;
  action:     AuditAction;
  entityType: AuditEntityType;
  entityId:   string;
  // diff: { field: [oldValue, newValue] }
  changes?:   Record<string, [unknown, unknown]>;
  metadata?:  Record<string, unknown>;
}

/**
 * Write an audit log entry. Never throws — audit failures silently drop
 * so the main operation is never interrupted.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id:     entry.userId,
      action:      entry.action,
      entity_type: entry.entityType,
      entity_id:   entry.entityId,
      changes:     entry.changes  ?? null,
      metadata:    entry.metadata ?? null,
    });
  } catch {
    // Intentionally swallow — audit log failures must not block operations
  }
}

/**
 * Build a changes diff from two objects. Only includes fields that changed.
 */
export function buildDiff(
  before: Record<string, unknown>,
  after:  Record<string, unknown>,
): Record<string, [unknown, unknown]> {
  const diff: Record<string, [unknown, unknown]> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      diff[key] = [before[key] ?? null, after[key] ?? null];
    }
  }
  return diff;
}
