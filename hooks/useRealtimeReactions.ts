"use client";

import { useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchReactionCounts } from "@/lib/data/media";
import { summarizeReactionCounts } from "@/lib/reactions/summarize";
import { queryKeys } from "@/lib/queryKeys";
import type { GalleryPage } from "@/lib/data/gallery";
import type { ReactionsState } from "@/hooks/useReactions";

/**
 * Cuando cualquier dispositivo reacciona (o quita una reacción), refresca el
 * resumen de esa publicación tanto en la lista como en el visor, si está
 * abierto en esa misma publicación — sin recargar la página. Nunca se
 * suscribe a la tabla `reactions` en sí (expondría el device_id de cada
 * fila): escucha un aviso ligero ("cambió esta publicación", sólo el
 * media_id) emitido por un trigger de base de datos, y aquí vuelve a pedir
 * el recuento agregado por RPC — el mismo que ya usa la carga inicial.
 */
export function useRealtimeReactions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    async function refreshMediaReactions(mediaId: string) {
      const counts = await fetchReactionCounts(supabase, mediaId);
      const summary = summarizeReactionCounts(counts);

      queryClient.setQueryData<InfiniteData<GalleryPage>>(queryKeys.gallery(), (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === mediaId ? { ...item, ...summary } : item,
            ),
          })),
        };
      });

      // Si el visor está abierto en esta misma publicación, actualiza sus
      // recuentos sin tocar `mine` — eso sólo cambia con las reacciones del
      // propio dispositivo, ya gestionadas aparte en useReactions.
      queryClient.setQueryData<ReactionsState>(queryKeys.reactionState(mediaId), (current) =>
        current ? { ...current, counts } : current,
      );
    }

    const channel = supabase
      .channel("reactions")
      .on("broadcast", { event: "reaction_change" }, (payload) => {
        const mediaId = (payload.payload as { media_id?: string } | undefined)?.media_id;
        if (mediaId) void refreshMediaReactions(mediaId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
