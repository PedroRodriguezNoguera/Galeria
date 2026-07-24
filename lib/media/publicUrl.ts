const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export type PublicBucket = "media-original" | "media-thumbnails";

/**
 * Construye la URL pública directamente (sin instanciar un cliente de Supabase):
 * es una simple concatenación de string, igual que hace `storage.getPublicUrl` internamente.
 * Funciona tanto en Server como en Client Components.
 */
export function getPublicStorageUrl(bucket: PublicBucket, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
