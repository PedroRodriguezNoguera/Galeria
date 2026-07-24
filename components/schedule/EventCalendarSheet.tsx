"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useScroll } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Spinner } from "@/components/ui/Spinner";
import { useEventSchedule } from "@/hooks/useEventSchedule";
import { isEventActiveNow, type EventScheduleRow } from "@/lib/data/eventSchedule";
import { EventWheelRow } from "./EventWheelRow";

interface EventCalendarSheetProps {
  open: boolean;
  onClose: () => void;
}

const ITEM_HEIGHT = 68;
const ACTIVE_ITEM_HEIGHT = 96; // el evento en curso se destaca más alto que el resto
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

/** El evento en curso si lo hay; si no, el próximo futuro más cercano; si no hay ninguno futuro, el primero. */
function findInitialIndex(events: EventScheduleRow[], active: boolean[]): number {
  const activeIndex = active.findIndex(Boolean);
  if (activeIndex >= 0) return activeIndex;

  const nowMs = Date.now();
  let nearestIndex = 0;
  let nearestDiff = Infinity;
  events.forEach((event, index) => {
    const startMs = new Date(`${event.event_date}T${event.start_time}`).getTime();
    const diff = startMs - nowMs;
    if (diff >= 0 && diff < nearestDiff) {
      nearestDiff = diff;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

export function EventCalendarSheet({ open, onClose }: EventCalendarSheetProps) {
  const { data: events, isPending } = useEventSchedule(open);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-2 pb-2 pt-1">
        <h2 className="px-1 text-[17px] font-semibold text-foreground">Calendario de eventos</h2>
      </div>

      <div className="px-2 pb-2">
        {isPending ? (
          <div className="flex justify-center py-10 text-foreground-muted">
            <Spinner size={24} />
          </div>
        ) : !events || events.length === 0 ? (
          <p className="px-1 py-6 text-sm text-foreground-muted">
            Todavía no hay eventos programados.
          </p>
        ) : (
          <EventWheel events={events} />
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * Rueda de selección estilo iOS: el evento centrado se ve grande y nítido, el
 * resto se encoge y se atenúa cuanto más lejos está del centro al deslizar.
 * Las filas no son todas iguales: el evento en curso ocupa más alto que el
 * resto para destacar sobre los demás, así que los centros de cada fila se
 * calculan sobre alturas acumuladas en vez de un múltiplo fijo.
 */
function EventWheel({ events }: { events: EventScheduleRow[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const [hasCentered, setHasCentered] = useState(false);

  const active = useMemo(
    () => events.map((event) => isEventActiveNow(event, new Date())),
    [events],
  );
  const heights = useMemo(
    () => active.map((isActive) => (isActive ? ACTIVE_ITEM_HEIGHT : ITEM_HEIGHT)),
    [active],
  );

  // Posición (sin contar el padding superior) del centro de cada fila: la
  // suma de las alturas de todas las filas anteriores más la mitad de la suya.
  const centers = useMemo(
    () =>
      heights.map((height, index) => {
        const before = heights.slice(0, index).reduce((sum, h) => sum + h, 0);
        return before + height / 2;
      }),
    [heights],
  );

  // El padding es justo el necesario para que la primera/última fila puedan
  // llegar al centro de la rueda, según su propia altura (puede ser la fila
  // más alta si el evento en curso es el primero o el último de la lista).
  const paddingTop = WHEEL_HEIGHT / 2 - heights[0] / 2;
  const paddingBottom = WHEEL_HEIGHT / 2 - heights[heights.length - 1] / 2;

  // scrollTop necesario para que el centro de la fila i coincida con el
  // centro del viewport (scrollTop + WHEEL_HEIGHT/2).
  const centerScrollTops = useMemo(
    () => centers.map((center) => paddingTop + center - WHEEL_HEIGHT / 2),
    [centers, paddingTop],
  );

  useEffect(() => {
    if (hasCentered || !scrollRef.current) return;
    const index = findInitialIndex(events, active);
    scrollRef.current.scrollTo({ top: centerScrollTops[index], behavior: "auto" });
    setHasCentered(true);
  }, [events, active, centerScrollTops, hasCentered]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="glass-scrollbar overflow-y-auto"
        style={{ height: WHEEL_HEIGHT, scrollSnapType: "y mandatory" }}
      >
        <div style={{ paddingTop, paddingBottom }}>
          {events.map((event, index) => (
            <EventWheelRow
              key={event.id}
              event={event}
              active={active[index]}
              itemHeight={heights[index]}
              center={centerScrollTops[index]}
              scrollY={scrollY}
              onSelect={() =>
                scrollRef.current?.scrollTo({ top: centerScrollTops[index], behavior: "smooth" })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
