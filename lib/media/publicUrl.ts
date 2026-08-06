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

export function extensionFromPath(path: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  return match ? match[1] : "bin";
}

/** Mismo criterio de nombre en la descarga individual y en el ZIP de exportación. */
export function downloadFilenameForMedia(media: {
  id: string;
  storage_path: string;
  sort_date: string | null;
  created_at: string;
}): string {
  const date = (media.sort_date ?? media.created_at).slice(0, 10);
  return `${date}_${media.id}.${extensionFromPath(media.storage_path)}`;
}

/**
 * URL de descarga directa de Storage (sin pasar por el servidor): el
 * parámetro `download` de la Storage API de Supabase fuerza
 * `Content-Disposition: attachment` con el nombre indicado, en vez de
 * abrir la imagen/vídeo en una pestaña nueva.
 */
export function getDownloadUrl(bucket: PublicBucket, path: string, filename: string) {
  return `${getPublicStorageUrl(bucket, path)}?download=${encodeURIComponent(filename)}`;
}
