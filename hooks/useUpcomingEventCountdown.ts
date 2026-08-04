"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchEventSchedule,
  secondsRelativeToEventStart,
  type EventScheduleRow,
} from "@/lib/data/eventSchedule";
import { queryKeys } from "@/lib/queryKeys";

const WARNING_WINDOW_SECONDS = 60 * 60;
const RECHECK_INTERVAL_MS = 30_000;
/** Tras arrancar, el evento se sigue devolviendo este rato (secondsRemaining <= 0): ver EventCountdownNotice, que usa ese margen para el remate visual antes de cerrarse. */
const GRACE_SECONDS = 3;

export interface UpcomingEventCountdown {
  event: EventScheduleRow;
  /** Positivo mientras falta para que empiece; <= 0 durante el margen de gracia justo después de arrancar. */
  secondsRemaining: number;
}

/**
 * Evento (de hoy) que empieza antes de 1 hora, o que acaba de arrancar
 * hace menos de GRACE_SECONDS — el más cercano si hubiera varios (siempre
 * gana el que ya está en su margen de gracia sobre cualquier otro futuro,
 * porque su `secondsRemaining` es negativo y por tanto menor). El horario se
 * reutiliza de la misma queryKey que useActiveEventTheme/useEventSchedule
 * (sin petición extra); lo único propio de aquí es el segundero, que corre
 * en un timer local de 1s para que la cuenta atrás se vea viva sin tener que
 * volver a pedir nada a la red.
 */
export function useUpcomingEventCountdown(): UpcomingEventCountdown | null {
  const { data: events } = useQuery({
    queryKey: queryKeys.eventSchedule(),
    queryFn: () => fetchEventSchedule(createClient()),
    refetchInterval: RECHECK_INTERVAL_MS,
  });

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // now empieza en null y tarda hasta 1s en fijarse (primer tick del
  // intervalo) para que el primer render en el servidor y en el cliente
  // coincidan: la hora del visitante no se conoce hasta hidratar, así que
  // antes de eso no hay nada que mostrar.
  if (!events || !now) return null;

  let closest: UpcomingEventCountdown | null = null;
  for (const event of events) {
    const secondsRemaining = secondsRelativeToEventStart(event, now);
    if (
      secondsRemaining === null ||
      secondsRemaining > WARNING_WINDOW_SECONDS ||
      secondsRemaining < -GRACE_SECONDS
    ) {
      continue;
    }
    if (!closest || secondsRemaining < closest.secondsRemaining) {
      closest = { event, secondsRemaining };
    }
  }
  return closest;
}
