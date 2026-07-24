"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchEventSchedule, fetchDefaultTheme, isEventActiveNow } from "@/lib/data/eventSchedule";
import { queryKeys } from "@/lib/queryKeys";
import { useGalleryFeed } from "./useGalleryFeed";
import type { EventTheme } from "@/constants/eventThemes";

const RECHECK_INTERVAL_MS = 30_000;

/**
 * Tema que debe mostrarse en la cabecera: el del evento que estaba en curso
 * en el momento de la publicación más reciente, no el del reloj del
 * dispositivo — así la cabecera refleja lo que de verdad se está
 * compartiendo, sin depender de que alguien mantenga el horario ajustado en
 * tiempo real. Ese "momento" es el mismo `sort_date` por el que ya se ordena
 * la galería (coalesce(taken_at, created_at): la fecha EXIF de la foto/vídeo
 * si la trae, si no la de subida — ver fetchGalleryPage), así que basta con
 * mirar el primer elemento de la galería ya cargada (comparte caché con
 * useGalleryFeed, misma queryKey: no dispara ninguna petición extra, y se
 * actualiza sola en cuanto llega una publicación nueva por realtime, ver
 * useRealtimeMedia). Si todavía no hay ninguna publicación, cae al reloj
 * real como único punto de partida posible.
 */
export function useActiveEventTheme(): EventTheme {
  const { data: events } = useQuery({
    queryKey: queryKeys.eventSchedule(),
    queryFn: () => fetchEventSchedule(createClient()),
    refetchInterval: RECHECK_INTERVAL_MS,
  });

  const { data: defaultTheme } = useQuery({
    queryKey: queryKeys.headerSettings(),
    queryFn: () => fetchDefaultTheme(createClient()),
    refetchInterval: RECHECK_INTERVAL_MS,
  });

  const { data: gallery } = useGalleryFeed();
  const latestMoment = gallery?.pages[0]?.items[0]?.sort_date;
  const momentToCheck = latestMoment ? new Date(latestMoment) : new Date();

  const activeEvent = events?.find((event) => isEventActiveNow(event, momentToCheck));
  return (activeEvent?.theme as EventTheme | undefined) ?? defaultTheme ?? "toro";
}
