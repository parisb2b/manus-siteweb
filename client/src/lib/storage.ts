import { supabase } from "./supabase";

const BUCKET = "media";

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL on success, null on failure.
 *
 * Bucket "media" must exist in Supabase Storage with public access enabled.
 * SQL: INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
 */
export async function uploadFile(
  file: File,
  folder: string = ""
): Promise<string | null> {
  if (!supabase) return null;

  const ext = file.name.split(".").pop() || "png";
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  const path = folder
    ? `${folder}/${safeName}_${Date.now()}.${ext}`
    : `${safeName}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("[Storage] Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its path within the bucket.
 */
export async function deleteFile(path: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}

/**
 * List files in a Supabase Storage folder.
 */
export async function listFiles(folder: string = "") {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    sortBy: { column: "name", order: "asc" },
  });
  if (error) return [];
  return data;
}
