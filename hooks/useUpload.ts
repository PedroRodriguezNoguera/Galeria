"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { validateFile } from "@/lib/media/validateFile";
import { compressImage } from "@/lib/media/compressImage";
import { getImageDimensions } from "@/lib/media/getImageDimensions";
import { generateImageThumbnail } from "@/lib/media/generateImageThumbnail";
import { extractExifTakenAt } from "@/lib/media/extractExifTakenAt";
import { extractExifGps } from "@/lib/media/extractExifGps";
import { captureVideoPoster } from "@/lib/media/captureVideoPoster";
import { requestUpload } from "@/lib/actions/requestUpload";
import { confirmUpload } from "@/lib/actions/confirmUpload";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/contexts/ToastProvider";
import { emitActivity } from "@/lib/events/activityBus";
import type { GpsCoords } from "@/lib/media/getBrowserLocation";

export type UploadStatus = "idle" | "uploading";

/** Comprime/genera miniatura, sube a las URLs firmadas y confirma un único archivo. */
async function uploadOneFile(
  file: File,
  fallbackLocation: GpsCoords | undefined,
  onProgress: (value: number) => void,
) {
  const validation = validateFile(file);
  if (!validation.valid || !validation.mediaType) {
    throw new Error(validation.error ?? "Archivo no válido");
  }

  const mediaType = validation.mediaType;
  let uploadFile: File | Blob = file;
  let thumbnailBlob: Blob;
  let width: number;
  let height: number;
  let durationMs: number | undefined;
  let takenAt: string | undefined;
  let gps: GpsCoords | undefined;

  if (mediaType === "image") {
    // El EXIF (fecha y GPS) se lee del archivo ORIGINAL, antes de comprimir:
    // la compresión puede eliminarlo. En paralelo porque son dos lecturas
    // independientes del mismo archivo.
    const [exifTakenAt, exifGps] = await Promise.all([
      extractExifTakenAt(file),
      extractExifGps(file),
    ]);
    takenAt = exifTakenAt;
    gps = exifGps ?? fallbackLocation;
    uploadFile = await compressImage(file);
    const dimensions = await getImageDimensions(uploadFile);
    width = dimensions.width;
    height = dimensions.height;
    thumbnailBlob = await generateImageThumbnail(file);
  } else {
    // Los vídeos nunca pasan por lectura de EXIF (ver captureVideoPoster):
    // el respaldo de geolocalización es la única fuente posible de ubicación.
    gps = fallbackLocation;
    const poster = await captureVideoPoster(file);
    width = poster.width;
    height = poster.height;
    durationMs = poster.durationMs;
    thumbnailBlob = poster.thumbnail;
  }
  const latitude = gps?.latitude;
  const longitude = gps?.longitude;

  // El tipo real que produjo el navegador, no el que se le pidió: si no sabe
  // codificar webp (Safari <17, algunos Android), cae solo a PNG y hay que
  // declarar eso al servidor, o Storage rechaza la subida.
  const mimeType = mediaType === "image" ? uploadFile.type : file.type;

  const { mediaId, storagePath, thumbnailPath, originalUpload, thumbnailUpload } =
    await requestUpload({
      mediaType,
      mimeType,
      sizeBytes: uploadFile.size,
      thumbnailMimeType: thumbnailBlob.type,
    });

  const supabase = createClient();

  onProgress(0.1);
  const { error: originalUploadError } = await supabase.storage
    .from("media-original")
    .uploadToSignedUrl(originalUpload.path, originalUpload.token, uploadFile);
  if (originalUploadError) throw originalUploadError;

  onProgress(0.7);
  const { error: thumbnailUploadError } = await supabase.storage
    .from("media-thumbnails")
    .uploadToSignedUrl(thumbnailUpload.path, thumbnailUpload.token, thumbnailBlob);
  if (thumbnailUploadError) throw thumbnailUploadError;

  onProgress(0.9);
  await confirmUpload({
    mediaId,
    storagePath,
    thumbnailPath,
    mediaType,
    mimeType,
    width,
    height,
    durationMs,
    takenAt,
    latitude,
    longitude,
  });
  onProgress(1);
}

export function useUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [fileProgress, setFileProgress] = useState(0);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Secuencial, no en paralelo: evita saturar la subida de datos móviles del invitado.
  const upload = useCallback(
    async (files: File[], location?: GpsCoords) => {
      if (files.length === 0) return;

      setStatus("uploading");
      setTotal(files.length);
      setCompleted(0);

      let successCount = 0;
      let firstErrorMessage: string | undefined;

      for (const file of files) {
        setFileProgress(0);
        try {
          await uploadOneFile(file, location, setFileProgress);
          successCount += 1;
        } catch (error) {
          console.error(error);
          firstErrorMessage ??= error instanceof Error ? error.message : undefined;
        }
        setCompleted((current) => current + 1);
      }

      setStatus("idle");
      queryClient.invalidateQueries({ queryKey: queryKeys.gallery() });

      if (successCount > 0) {
        emitActivity();
      }

      if (successCount === files.length) {
        showToast({
          title: files.length === 1 ? "Publicado" : `${successCount} publicadas`,
          description: "Ya se ve en la galería.",
          variant: "success",
        });
      } else if (successCount > 0) {
        showToast({
          title: `${successCount} de ${files.length} publicadas`,
          description: firstErrorMessage ?? "El resto no se pudo subir.",
          variant: "error",
        });
      } else {
        showToast({
          title: files.length === 1 ? "No se pudo subir" : "No se pudo subir nada",
          description: firstErrorMessage,
          variant: "error",
        });
      }
    },
    [queryClient, showToast],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTotal(0);
    setCompleted(0);
    setFileProgress(0);
  }, []);

  return { upload, status, total, completed, fileProgress, reset };
}
