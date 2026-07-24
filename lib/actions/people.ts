"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "./requireAdminSession";
import { hashIp } from "@/lib/security/hashIp";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_THUMBNAIL_MIME_TYPES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/constants/limits";
import type { MediaType } from "@/types/media";

const PEOPLE_PATH = "/admin/people";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export async function updatePersonName(deviceId: string, name: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const trimmed = name.trim();
  const { error } = await supabase
    .from("people")
    .update({ name: trimmed.length > 0 ? trimmed : null })
    .eq("device_id", deviceId);
  if (error) throw error;
  revalidatePath(PEOPLE_PATH);
}

/** Borra de Storage + la fila `media` una foto/vídeo asignado a una persona (nunca se comparte con nada más). */
async function deletePersonMedia(mediaId: string) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("media")
    .select("storage_path, thumbnail_path")
    .eq("id", mediaId)
    .maybeSingle();

  if (existing) {
    await supabase.storage.from("media-original").remove([existing.storage_path]);
    await supabase.storage.from("media-thumbnails").remove([existing.thumbnail_path]);
  }
  await supabase.from("media").delete().eq("id", mediaId);
}

export async function unassignPersonMedia(deviceId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { data: person } = await supabase
    .from("people")
    .select("assigned_media_id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (person?.assigned_media_id) {
    // Al borrar la fila `media`, el FK (on delete set null) limpia
    // assigned_media_id automáticamente.
    await deletePersonMedia(person.assigned_media_id);
  }

  revalidatePath(PEOPLE_PATH);
}

interface RequestPersonUploadInput {
  mediaType: MediaType;
  mimeType: string;
  sizeBytes: number;
  thumbnailMimeType: string;
}

interface SignedUpload {
  path: string;
  token: string;
}

interface RequestPersonUploadResult {
  mediaId: string;
  storagePath: string;
  thumbnailPath: string;
  originalUpload: SignedUpload;
  thumbnailUpload: SignedUpload;
}

/**
 * Igual que requestUpload (fase 1: URLs firmadas), pero exclusivo de admin y
 * sin rate limiting — este archivo nunca pasa por el feed público, es
 * privado a una persona concreta.
 */
export async function requestPersonMediaUpload({
  mediaType,
  mimeType,
  sizeBytes,
  thumbnailMimeType,
}: RequestPersonUploadInput): Promise<RequestPersonUploadResult> {
  await requireAdminSession();

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

function splitPath(path: string): { dir: string; name: string } {
  const segments = path.split("/");
  const name = segments.pop() ?? path;
  return { dir: segments.join("/"), name };
}

interface ConfirmPersonUploadInput {
  deviceId: string;
  mediaId: string;
  storagePath: string;
  thumbnailPath: string;
  mediaType: MediaType;
  mimeType: string;
  width: number;
  height: number;
  durationMs?: number;
}

/**
 * Fase 2: verifica el archivo subido igual que confirmUpload, lo inserta
 * como `is_unlisted` (nunca aparece en la galería pública ni en el panel
 * de moderación general) y lo asigna a esa persona de un solo paso,
 * sustituyendo lo que tuviera asignado antes si lo había.
 */
export async function confirmPersonMediaUpload(input: ConfirmPersonUploadInput) {
  await requireAdminSession();

  const { deviceId, mediaId, storagePath, thumbnailPath, mediaType, mimeType, width, height, durationMs } =
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
    is_unlisted: true,
  });
  if (insertError) throw insertError;

  const { data: person } = await supabase
    .from("people")
    .select("assigned_media_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  const previousMediaId = person?.assigned_media_id;

  const { error: assignError } = await supabase
    .from("people")
    .update({ assigned_media_id: mediaId })
    .eq("device_id", deviceId);
  if (assignError) throw assignError;

  if (previousMediaId) {
    await deletePersonMedia(previousMediaId);
  }

  revalidatePath(PEOPLE_PATH);
  return { mediaId };
}
