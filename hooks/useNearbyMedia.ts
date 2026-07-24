"use client";

import { useMemo } from "react";
import { useGalleryFeed } from "./useGalleryFeed";
import type { MediaWithReactions } from "@/types/media";

interface NearbyMedia {
  next: MediaWithReactions[];
  prev: MediaWithReactions[];
}

const PRELOAD_COUNT = 5;

/**
 * Hasta 5 elementos siguientes y 5 anteriores al actual, dentro de la lista ya
 * cargada en caché (misma query que GalleryGrid/useAdjacentMedia). Se usan
 * sólo para precargar en segundo plano (ver MediaPreloader) — nunca disparan
 * una petición de página nueva si el vecino aún no está en caché.
 * `prev` va del más cercano al más lejano (prev[0] es el inmediatamente
 * anterior), igual que `next`, para poder priorizar por cercanía real.
 */
export function useNearbyMedia(currentId: string): NearbyMedia {
  const { data } = useGalleryFeed();

  return useMemo(() => {
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const index = items.findIndex((item) => item.id === currentId);
    if (index === -1) return { next: [], prev: [] };

    return {
      next: items.slice(index + 1, index + 1 + PRELOAD_COUNT),
      prev: items.slice(Math.max(0, index - PRELOAD_COUNT), index).reverse(),
    };
  }, [data, currentId]);
}
