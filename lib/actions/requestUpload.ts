"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_THUMBNAIL_MIME_TYPES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/constants/limits";
import type { MediaType } from "@/types/media";

interface RequestUploadInput {
  mediaType: MediaType;
  mimeType: string;
  sizeBytes: number;
  // Tipo real que produjo el navegador para la miniatura (puede no ser webp
  // si el navegador no sabe codificarlo — ver ALLOWED_THUMBNAIL_MIME_TYPES).
  thumbnailMimeType: string;
}

interface SignedUpload {
  path: string;
  token: string;
}

interface RequestUploadResult {
  mediaId: string;
  storagePath: string;
  thumbnailPath: string;
  originalUpload: SignedUpload;
  thumbnailUpload: SignedUpload;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/**
 * Fase 1 de la subida: valida y emite URLs firmadas de Storage. El cliente
 * sube el archivo directamente a esas URLs; ningún bucket tiene INSERT
 * público, así que sin pasar por aquí no hay forma de escribir en Storage.
 */
export async function requestUpload({
  mediaType,
  mimeType,
  sizeBytes,
  thumbnailMimeType,
}: RequestUploadInput): Promise<RequestUploadResult> {
  const allowed = mediaType === "image" ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_VIDEO_MIME_TYPES;

  if (!(allowed as readonly string[]).includes(mimeType)) {
    throw new Error("Tipo de archivo no permitido.");
  }
  if (!(ALLOWED_THUMBNAIL_MIME_TYPES as readonly string[]).includes(thumbnailMimeType)) {
    throw new Error("Tipo de miniatura no permitido.");
  }
  if (mediaType === "video" && sizeBytes > MAX_VIDEO_SIZE_BYTES) {
    throw new Error("El vídeo supera el tamaño máximo permitido.");
  }
  if (sizeBytes <= 0) {
    throw new Error("Archivo vacío o inválido.");
  }

  const mediaId = randomUUID();
  const extension = EXTENSION_BY_MIME[mimeType] ?? "bin";
  const thumbnailExtension = EXTENSION_BY_MIME[thumbnailMimeType] ?? "webp";
  const storagePath = `${mediaId}/original.${extension}`;
  const thumbnailPath = `${mediaId}/thumbnail.${thumbnailExtension}`;

  const supabase = createAdminClient();

  const [originalResult, thumbnailResult] = await Promise.all([
    supabase.storage.from("media-original").createSignedUploadUrl(storagePath),
    supabase.storage.from("media-thumbnails").createSignedUploadUrl(thumbnailPath),
  ]);

  if (originalResult.error) throw originalResult.error;
  if (thumbnailResult.error) throw thumbnailResult.error;

  return {
    mediaId,
    storagePath,
    thumbnailPath,
    originalUpload: { path: originalResult.data.path, token: originalResult.data.token },
    thumbnailUpload: { path: thumbnailResult.data.path, token: thumbnailResult.data.token },
  };
}
