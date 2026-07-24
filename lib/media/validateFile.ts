import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/constants/limits";
import type { MediaType } from "@/types/media";

export interface FileValidationResult {
  valid: boolean;
  mediaType?: MediaType;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  const isImage = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
  const isVideo = (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type);

  if (!isImage && !isVideo) {
    return { valid: false, error: "Formato no admitido. Sube una foto o un vídeo." };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    const limitMb = Math.round(MAX_VIDEO_SIZE_BYTES / (1024 * 1024));
    return { valid: false, error: `El vídeo supera el límite de ${limitMb} MB.` };
  }

  return { valid: true, mediaType: isImage ? "image" : "video" };
}
