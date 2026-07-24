"use client";

import { useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";
import type { MediaRecord, MediaWithReactions } from "@/types/media";
import type { GalleryPage } from "@/lib/data/gallery";

/**
 * Mezcla directamente en la caché de React Query, sin refetch: las publicaciones
 * nuevas de otros dispositivos aparecen al instante. Si el canal no llega a
 * conectar, no pasa nada: el usuario las verá igual en su próxima visita/refresh.
 */
export function useRealtimeMedia() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("media-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "media", filter: "is_hidden=eq.false" },
        (payload) => {
          const newMedia = payload.new as MediaRecord;
          // Recién publicada: por definición todavía no tiene reacciones.
          const newMediaWithReactions: MediaWithReactions = {
            ...newMedia,
            topReactions: [],
            totalReactions: 0,
          };

          queryClient.setQueryData<InfiniteData<GalleryPage>>(queryKeys.gallery(), (current) => {
            if (!current) return current;

            const alreadyPresent = current.pages.some((page) =>
              page.items.some((item) => item.id === newMedia.id),
            );
            if (alreadyPresent) return current;

            const [firstPage, ...restPages] = current.pages;
            const updatedFirstPage: GalleryPage = {
              ...firstPage,
              items: [newMediaWithReactions, ...firstPage.items],
            };

            return { ...current, pages: [updatedFirstPage, ...restPages] };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
