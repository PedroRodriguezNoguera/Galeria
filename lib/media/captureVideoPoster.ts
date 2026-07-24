import { THUMBNAIL_DIMENSION_PX } from "@/constants/limits";

export interface VideoPosterResult {
  thumbnail: Blob;
  width: number;
  height: number;
  durationMs: number;
}

/** Captura el primer frame de un vídeo como miniatura cuadrada, sin transcodificar en servidor. */
export function captureVideoPoster(file: File): Promise<VideoPosterResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    function cleanup() {
      URL.revokeObjectURL(url);
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration / 2);
    };

    video.onseeked = () => {
      const size = THUMBNAIL_DIMENSION_PX;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("No se pudo crear el contexto de canvas."));
        return;
      }

      const scale = Math.max(size / video.videoWidth, size / video.videoHeight);
      const drawWidth = video.videoWidth * scale;
      const drawHeight = video.videoHeight * scale;
      const dx = (size - drawWidth) / 2;
      const dy = (size - drawHeight) / 2;

      ctx.drawImage(video, dx, dy, drawWidth, drawHeight);

      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            reject(new Error("No se pudo generar la miniatura del vídeo."));
            return;
          }
          resolve({
            thumbnail: blob,
            width: video.videoWidth,
            height: video.videoHeight,
            durationMs: Math.round(video.duration * 1000),
          });
        },
        "image/webp",
        0.82,
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("No se pudo leer el vídeo."));
    };
  });
}
