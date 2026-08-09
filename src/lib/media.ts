import { supabase } from "@/integrations/supabase/client";

export type MediaBucket = "avatars" | "thumbnails" | "gifts" | "chat-images" | "payment-proofs";

/**
 * Media lives in private buckets, so a stored path is turned into a short-lived
 * signed URL. Stored values look like `bucket:path`.
 */
const cache = new Map<string, { url: string; expires: number }>();

export function mediaRef(bucket: MediaBucket, path: string) {
  return `${bucket}:${path}`;
}

export function parseRef(
  ref: string | null | undefined,
): { bucket: MediaBucket; path: string } | null {
  if (!ref) return null;
  if (/^https?:\/\//.test(ref)) return null;
  const idx = ref.indexOf(":");
  if (idx < 0) return null;
  return { bucket: ref.slice(0, idx) as MediaBucket, path: ref.slice(idx + 1) };
}

export async function resolveMedia(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null;
  if (/^https?:\/\//.test(ref)) return ref;
  const parsed = parseRef(ref);
  if (!parsed) return null;
  const hit = cache.get(ref);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 3600);
  if (!data?.signedUrl) return null;
  cache.set(ref, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadUserFile(
  bucket: MediaBucket,
  userId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be smaller than 5 MB.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return mediaRef(bucket, path);
}