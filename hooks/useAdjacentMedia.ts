"use client";

import { useMemo } from "react";
import { useGalleryFeed } from "./useGalleryFeed";
import type { MediaWithReactions } from "@/types/media";

interface AdjacentMedia {
  prevMedia: MediaWithReactions | null;
  nextMedia: MediaWithReactions | null;
}

/**
 * Vecinos del elemento actual dentro de la lista de la galería ya cargada en
 * caché (misma query que usa GalleryGrid) — sin petición extra, y sin datos
 * si el elemento no está entre los ya cargados (p.ej. enlace directo antiguo).
 */
export function useAdjacentMedia(currentId: string): AdjacentMedia {
  const { data } = useGalleryFeed();

  return useMemo(() => {
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const index = items.findIndex((item) => item.id === currentId);
    if (index === -1) return { prevMedia: null, nextMedia: null };

    return {
      prevMedia: index > 0 ? items[index - 1] : null,
      nextMedia: index < items.length - 1 ? items[index + 1] : null,
    };
  }, [data, currentId]);
}
