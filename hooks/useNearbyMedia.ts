"use client";

import { useMemo } from "react";
import { useGalleryFeed } from "./useGalleryFeed";
import { useAlbumMedia } from "./useAlbumMedia";
import type { MediaWithReactions } from "@/types/media";

interface NearbyMedia {
  next: MediaWithReactions[];
  prev: MediaWithReactions[];
}

const PRELOAD_COUNT = 5;

/**
 * Hasta 5 elementos siguientes y 5 anteriores al actual, para precargar en
 * segundo plano (ver MediaPreloader) — nunca disparan una petición de página
 * nueva si el vecino aún no está en caché. Si se abrió desde una carpeta
 * expandida (`albumId`, ver useAdjacentMedia), la vecindad sale del contenido
 * de esa carpeta en vez del feed principal, igual que los vecinos para
 * deslizar: si no, dentro de una carpeta no se precargaba nada.
 * `prev` va del más cercano al más lejano (prev[0] es el inmediatamente
 * anterior), igual que `next`, para poder priorizar por cercanía real.
 */
export function useNearbyMedia(currentId: string, albumId?: string | null): NearbyMedia {
  const { data: galleryData } = useGalleryFeed();
  const { data: albumItems } = useAlbumMedia(albumId);

  return useMemo(() => {
    const items = albumId
      ? (albumItems ?? [])
      : (galleryData?.pages.flatMap((page) => page.items) ?? []);
    const index = items.findIndex((item) => item.id === currentId);
    if (index === -1) return { next: [], prev: [] };

    return {
      next: items.slice(index + 1, index + 1 + PRELOAD_COUNT),
      prev: items.slice(Math.max(0, index - PRELOAD_COUNT), index).reverse(),
    };
  }, [galleryData, albumItems, albumId, currentId]);
}
