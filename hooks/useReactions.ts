"use client";

import { useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchReactionCounts } from "@/lib/data/media";
import { toggleReaction } from "@/lib/actions/toggleReaction";
import { getMyReactionEmojis } from "@/lib/actions/getMyReactionEmojis";
import { summarizeReactionCounts } from "@/lib/reactions/summarize";
import { MAX_REACTIONS_PER_MEDIA } from "@/constants/limits";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/contexts/ToastProvider";
import { queueActivity } from "@/lib/events/activityBus";
import type { GalleryPage } from "@/lib/data/gallery";
import type { ReactionEmoji } from "@/constants/reactions";
import type { ReactionCounts } from "@/types/reaction";

export interface ReactionsState {
  counts: ReactionCounts;
  mine: Set<string>;
}

export function useReactions(
  mediaId: string,
  initialCounts?: ReactionCounts,
  initialMine?: string[],
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = queryKeys.reactionState(mediaId);

  const query = useQuery<ReactionsState>({
    queryKey,
    queryFn: async () => {
      const [counts, mine] = await Promise.all([
        fetchReactionCounts(createClient(), mediaId),
        getMyReactionEmojis(mediaId),
      ]);
      return { counts, mine: new Set(mine) };
    },
    // Los dos vienen siempre juntos del servidor (ver app/media/[id]/page.tsx):
    // si sólo se sembrara `counts` y `mine` se quedara vacío hasta el primer
    // fetch, tocar una reacción propia durante esa ventana la trataba como
    // nueva (sube a 2) y sólo se corregía al llegar el fetch real.
    initialData: initialCounts
      ? { counts: initialCounts, mine: new Set(initialMine ?? []) }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (emoji: ReactionEmoji) => toggleReaction({ mediaId, emoji }),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReactionsState>(queryKey);
      const previousGallery = queryClient.getQueryData<InfiniteData<GalleryPage>>(
        queryKeys.gallery(),
      );

      const state = previous ?? { counts: {}, mine: new Set<string>() };
      const alreadyMine = state.mine.has(emoji);
      const nextMine = new Set(state.mine);
      const nextCounts = { ...state.counts };

      if (alreadyMine) {
        nextMine.delete(emoji);
        nextCounts[emoji] = Math.max(0, (nextCounts[emoji] ?? 1) - 1);
      } else {
        nextMine.add(emoji);
        nextCounts[emoji] = (nextCounts[emoji] ?? 0) + 1;
      }

      queryClient.setQueryData<ReactionsState>(queryKey, { counts: nextCounts, mine: nextMine });

      // Misma reacción, reflejada también en la miniatura de la galería (aunque
      // esté abierta debajo del visor): sin esto, sólo se actualizaba el propio visor.
      const summary = summarizeReactionCounts(nextCounts);
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

      return { previous, previousGallery };
    },
    onError: (_err, _emoji, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      if (context?.previousGallery) {
        queryClient.setQueryData(queryKeys.gallery(), context.previousGallery);
      }
      showToast({ title: "No se pudo enviar la reacción", variant: "error" });
    },
    onSuccess: (data) => {
      // Sólo al añadir, nunca al quitar una reacción — y no se lanza aquí
      // mismo: se encola, porque esto pasa con el visor abierto (tapando la
      // cabecera) y no se vería.
      if (data.active) queueActivity();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const mine = query.data?.mine ?? new Set<string>();

  return {
    counts: query.data?.counts ?? {},
    mine,
    maxReached: mine.size >= MAX_REACTIONS_PER_MEDIA,
    react: (emoji: ReactionEmoji) => {
      if (mutation.isPending) return;
      if (!mine.has(emoji) && mine.size >= MAX_REACTIONS_PER_MEDIA) {
        showToast({
          title: `Máximo ${MAX_REACTIONS_PER_MEDIA} reacciones por publicación`,
          description: "Quita una de tus reacciones para poder añadir otra.",
          variant: "error",
        });
        return;
      }
      mutation.mutate(emoji);
    },
  };
}
