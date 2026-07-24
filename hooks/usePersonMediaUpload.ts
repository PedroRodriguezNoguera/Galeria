"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateFile } from "@/lib/media/validateFile";
import { compressImage } from "@/lib/media/compressImage";
import { getImageDimensions } from "@/lib/media/getImageDimensions";
import { generateImageThumbnail } from "@/lib/media/generateImageThumbnail";
import { captureVideoPoster } from "@/lib/media/captureVideoPoster";
import { requestPersonMediaUpload, confirmPersonMediaUpload } from "@/lib/actions/people";
import { useToast } from "@/contexts/ToastProvider";

export type PersonUploadStatus = "idle" | "uploading" | "error";

/**
 * Mismo pipeline en dos fases que la subida pública (hooks/useUpload.ts):
 * comprimir/generar miniatura en el propio navegador, subir a URLs firmadas,
 * confirmar contra Storage. La diferencia es de destino, no de mecanismo:
 * aquí el archivo queda asignado en privado a un dispositivo concreto.
 */
export function usePersonMediaUpload(deviceId: string) {
  const [status, setStatus] = useState<PersonUploadStatus>("idle");
  const router = useRouter();
  const { showToast } = useToast();

  const upload = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid || !validation.mediaType) {
        showToast({ title: validation.error ?? "Archivo no válido", variant: "error" });
        setStatus("error");
        return;
      }

      setStatus("uploading");

      try {
        const mediaType = validation.mediaType;
        let uploadFile: File | Blob = file;
        let thumbnailBlob: Blob;
        let width: number;
        let height: number;
        let durationMs: number | undefined;

        if (mediaType === "image") {
          uploadFile = await compressImage(file);
          const dimensions = await getImageDimensions(uploadFile);
          width = dimensions.width;
          height = dimensions.height;
          thumbnailBlob = await generateImageThumbnail(file);
        } else {
          const poster = await captureVideoPoster(file);
          width = poster.width;
          height = poster.height;
          durationMs = poster.durationMs;
          thumbnailBlob = poster.thumbnail;
        }

        // El tipo real que produjo el navegador, no el que se le pidió: si no
        // sabe codificar webp (Safari <17, algunos Android), cae a PNG solo,
        // y hay que declarar eso o Storage rechaza la subida.
        const mimeType = mediaType === "image" ? uploadFile.type : file.type;

        const { mediaId, storagePath, thumbnailPath, originalUpload, thumbnailUpload } =
          await requestPersonMediaUpload({
            mediaType,
            mimeType,
            sizeBytes: uploadFile.size,
            thumbnailMimeType: thumbnailBlob.type,
          });

        const supabase = createClient();

        const { error: originalUploadError } = await supabase.storage
          .from("media-original")
          .uploadToSignedUrl(originalUpload.path, originalUpload.token, uploadFile);
        if (originalUploadError) throw originalUploadError;

        const { error: thumbnailUploadError } = await supabase.storage
          .from("media-thumbnails")
          .uploadToSignedUrl(thumbnailUpload.path, thumbnailUpload.token, thumbnailBlob);
        if (thumbnailUploadError) throw thumbnailUploadError;

        await confirmPersonMediaUpload({
          deviceId,
          mediaId,
          storagePath,
          thumbnailPath,
          mediaType,
          mimeType,
          width,
          height,
          durationMs,
        });

        setStatus("idle");
        router.refresh();
        showToast({ title: "Asignada", description: "Ya tiene su publicación.", variant: "success" });
      } catch (error) {
        console.error(error);
        setStatus("error");
        showToast({
          title: "No se pudo asignar",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      }
    },
    [deviceId, router, showToast],
  );

  return { upload, status };
}
