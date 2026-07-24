import { THUMBNAIL_DIMENSION_PX } from "@/constants/limits";

/** Recorte "cover" a cuadrado, igual que una miniatura de galería de fotos nativa. */
export async function generateImageThumbnail(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = THUMBNAIL_DIMENSION_PX;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el contexto de canvas.");

    const scale = Math.max(size / bitmap.width, size / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    const dx = (size - drawWidth) / 2;
    const dy = (size - drawHeight) / 2;

    ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la miniatura."))),
        "image/webp",
        0.82,
      );
    });
  } finally {
    bitmap.close();
  }
}
