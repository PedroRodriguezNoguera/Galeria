"use client";

import { useRouter } from "next/navigation";
import { MediaViewer } from "./MediaViewer";
import type { MediaRecord } from "@/types/media";

interface InterceptedMediaModalProps {
  media: MediaRecord;
  albumId?: string;
}

/** Cierre = volver atrás en el historial: recupera la galería tal y como estaba (scroll incluido). */
export function InterceptedMediaModal({ media, albumId }: InterceptedMediaModalProps) {
  const router = useRouter();

  return <MediaViewer media={media} albumId={albumId} onClose={() => router.back()} />;
}
