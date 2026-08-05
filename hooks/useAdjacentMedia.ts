"use client";

import { useMemo } from "react";
import { useGalleryFeed } from "./useGalleryFeed";
import { useAlbumMedia } from "./useAlbumMedia";
import type { MediaWithReactions } from "@/types/media";

interface AdjacentMedia {
  prevMedia: MediaWithReactions | null;
  nextMedia: MediaWithReactions | null;
}

/**
 * Vecinos del elemento actual, para deslizar al siguiente/anterior en el
 * visor. Si se abrió desde una carpeta expandida (`albumId`, propagado desde
 * la URL — ver AlbumsSection/GalleryTile y MediaViewer), los vecinos salen
 * del contenido de esa carpeta (useAlbumMedia, ya en caché normalmente: la
 * propia carpeta lo pidió al expandirse) en vez del feed cronológico
 * principal, del que esos elementos ya no forman parte (ver lib/data/gallery.ts).
 * Sin datos si el elemento no está entre los ya cargados (p.ej. enlace directo antiguo).
 */
export function useAdjacentMedia(currentId: string, albumId?: string | null): AdjacentMedia {
  const { data: galleryData } = useGalleryFeed();
  const { data: albumItems } = useAlbumMedia(albumId);

  return useMemo(() => {
    const items = albumId
      ? (albumItems ?? [])
      : (galleryData?.pages.flatMap((page) => page.items) ?? []);
    const index = items.findIndex((item) => item.id === currentId);
    if (index === -1) return { prevMedia: null, nextMedia: null };

    return {
      prevMedia: index > 0 ? items[index - 1] : null,
      nextMedia: index < items.length - 1 ? items[index + 1] : null,
    };
  }, [galleryData, albumItems, albumId, currentId]);
}
