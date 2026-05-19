import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "./config";

const SIGNED_URL_TTL = 3600; // 1 hour

/**
 * Generate a signed upload URL so the client can PUT the file directly to Supabase Storage.
 * Returns { signedUrl, token, path }.
 */
export async function createSignedUploadUrl(path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(error?.message ?? "Failed to create upload URL");
  return data; // { signedUrl, token, path }
}

/**
 * Generate a short-lived signed download URL for a stored object.
 */
export async function createSignedDownloadUrl(path: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Failed to create download URL");
  return data.signedUrl;
}

/**
 * Delete an object from storage by path.
 */
export async function deleteStorageObject(path: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw new Error(error.message);
}
