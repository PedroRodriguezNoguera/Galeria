"use client";

import { useRouter } from "next/navigation";
import { MediaViewer } from "./MediaViewer";
import type { MediaRecord } from "@/types/media";

interface StandaloneMediaViewerProps {
  media: MediaRecord;
  albumId?: string;
}

/** Cuando se llega por enlace directo (sin galería previa en el historial): cerrar = ir a "/". */
export function StandaloneMediaViewer({ media, albumId }: StandaloneMediaViewerProps) {
  const router = useRouter();

  return <MediaViewer media={media} albumId={albumId} onClose={() => router.push("/")} />;
}
