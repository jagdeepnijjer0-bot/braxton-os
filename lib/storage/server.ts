import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_BUCKET } from "./config";

const SIGNED_URL_TTL = 3600; // 1 hour

/**
 * Generate a signed upload URL so the client can PUT the file directly to Supabase Storage.
 * Returns { signedUrl, token, path }.
 */
export async function createSignedUploadUrl(path: string, bucket = DEFAULT_BUCKET) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(error?.message ?? "Failed to create upload URL");
  return data; // { signedUrl, token, path }
}

/**
 * Generate a short-lived signed download URL for a stored object.
 */
export async function createSignedDownloadUrl(path: string, bucket = DEFAULT_BUCKET): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Failed to create download URL");
  return data.signedUrl;
}

/**
 * Delete an object from storage by path and bucket.
 */
export async function deleteStorageObject(path: string, bucket = DEFAULT_BUCKET): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
