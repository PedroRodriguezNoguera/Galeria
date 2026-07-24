"use client";

import { useRouter } from "next/navigation";
import { MediaViewer } from "./MediaViewer";
import type { MediaRecord } from "@/types/media";
import type { ReactionCounts } from "@/types/reaction";

interface StandaloneMediaViewerProps {
  media: MediaRecord;
  initialReactionCounts: ReactionCounts;
  initialMyReactionEmojis: string[];
}

/** Cuando se llega por enlace directo (sin galería previa en el historial): cerrar = ir a "/". */
export function StandaloneMediaViewer({
  media,
  initialReactionCounts,
  initialMyReactionEmojis,
}: StandaloneMediaViewerProps) {
  const router = useRouter();

  return (
    <MediaViewer
      media={media}
      initialReactionCounts={initialReactionCounts}
      initialMyReactionEmojis={initialMyReactionEmojis}
      onClose={() => router.push("/")}
    />
  );
}
