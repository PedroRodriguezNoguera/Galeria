"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashIp } from "@/lib/security/hashIp";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/constants/limits";
import type { MediaType } from "@/types/media";

interface ConfirmUploadInput {
  mediaId: string;
  storagePath: string;
  thumbnailPath: string;
  mediaType: MediaType;
  mimeType: string;
  width: number;
  height: number;
  durationMs?: number;
  /** Fecha EXIF (DateTimeOriginal) leída en el cliente, si el archivo la traía — ver extractExifTakenAt. */
  takenAt?: string;
}

/** Como con width/height/duration, se confía en el valor que manda el cliente (sólo metadato de visualización, no algo que afecte a seguridad) — pero sólo si es una fecha real. */
function parseTakenAt(takenAt: string | undefined): string | null {
  if (!takenAt) return null;
  const date = new Date(takenAt);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function splitPath(path: string): { dir: string; name: string } {
  const segments = path.split("/");
  const name = segments.pop() ?? path;
  return { dir: segments.join("/"), name };
}

/**
 * Fase 2: sólo inserta la fila en `media` después de comprobar contra el propio
 * Storage que el objeto subido existe de verdad y su tamaño real es razonable.
 * Nunca confía en los metadatos que declaró el cliente.
 */
export async function confirmUpload(input: ConfirmUploadInput) {
  const { mediaId, storagePath, thumbnailPath, mediaType, mimeType, width, height, durationMs, takenAt } =
    input;

  const allowed = mediaType === "image" ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_VIDEO_MIME_TYPES;
  if (!(allowed as readonly string[]).includes(mimeType)) {
    throw new Error("Tipo de archivo no permitido.");
  }
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error("Dimensiones inválidas.");
  }

  const supabase = createAdminClient();

  const original = splitPath(storagePath);
  const { data: originalListing, error: originalListError } = await supabase.storage
    .from("media-original")
    .list(original.dir, { search: original.name });

  if (originalListError) throw originalListError;
  const originalObject = originalListing?.find((item) => item.name === original.name);
  if (!originalObject) throw new Error("No se encontró el archivo subido.");

  const sizeBytes = originalObject.metadata?.size as number | undefined;
  if (typeof sizeBytes !== "number" || sizeBytes <= 0) {
    throw new Error("No se pudo verificar el tamaño del archivo subido.");
  }

  if (mediaType === "video" && sizeBytes > MAX_VIDEO_SIZE_BYTES) {
    await supabase.storage.from("media-original").remove([storagePath]);
    await supabase.storage.from("media-thumbnails").remove([thumbnailPath]);
    throw new Error("El vídeo supera el tamaño máximo permitido.");
  }

  const thumbnail = splitPath(thumbnailPath);
  const { data: thumbnailListing, error: thumbnailListError } = await supabase.storage
    .from("media-thumbnails")
    .list(thumbnail.dir, { search: thumbnail.name });

  if (thumbnailListError) throw thumbnailListError;
  const thumbnailExists = thumbnailListing?.some((item) => item.name === thumbnail.name);
  if (!thumbnailExists) throw new Error("No se encontró la miniatura subida.");

  const ipHash = await hashIp();

  const { error: insertError } = await supabase.from("media").insert({
    id: mediaId,
    media_type: mediaType,
    storage_path: storagePath,
    thumbnail_path: thumbnailPath,
    width,
    height,
    duration_ms: durationMs ?? null,
    size_bytes: sizeBytes,
    mime_type: mimeType,
    ip_hash: ipHash,
    taken_at: parseTakenAt(takenAt),
  });

  if (insertError) throw insertError;

  return { mediaId };
}
