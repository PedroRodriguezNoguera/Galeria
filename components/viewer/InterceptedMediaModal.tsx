"use client";

import { useRouter } from "next/navigation";
import { MediaViewer } from "./MediaViewer";
import type { MediaRecord } from "@/types/media";
import type { ReactionCounts } from "@/types/reaction";

interface InterceptedMediaModalProps {
  media: MediaRecord;
  initialReactionCounts: ReactionCounts;
  initialMyReactionEmojis: string[];
}

/** Cierre = volver atrás en el historial: recupera la galería tal y como estaba (scroll incluido). */
export function InterceptedMediaModal({
  media,
  initialReactionCounts,
  initialMyReactionEmojis,
}: InterceptedMediaModalProps) {
  const router = useRouter();

  return (
    <MediaViewer
      media={media}
      initialReactionCounts={initialReactionCounts}
      initialMyReactionEmojis={initialMyReactionEmojis}
      onClose={() => router.back()}
    />
  );
}
