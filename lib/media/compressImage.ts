import imageCompression from "browser-image-compression";
import { IMAGE_MAX_DIMENSION_PX, IMAGE_COMPRESSION_MAX_MB } from "@/constants/limits";

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: IMAGE_MAX_DIMENSION_PX,
    maxSizeMB: IMAGE_COMPRESSION_MAX_MB,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
  });
}
