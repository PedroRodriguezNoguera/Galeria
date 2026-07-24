"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { EventScheduleRow } from "@/lib/data/eventSchedule";
import { ActiveEventConfetti } from "./ActiveEventConfetti";

// Distancia de referencia (en px de scroll) para la atenuación de
// escala/opacidad — independiente de la altura real de cada fila, que varía
// cuando el evento en curso ocupa más espacio que el resto.
const FALLOFF_STEP = 68;

interface EventWheelRowProps {
  event: EventScheduleRow;
  active: boolean;
  itemHeight: number;
  center: number;
  scrollY: MotionValue<number>;
  onSelect: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "2-digit",
  month: "short",
});

function formatDate(eventDate: string) {
  const [year, month, day] = eventDate.split("-").map(Number);
  const formatted = dateFormatter.format(new Date(year, month - 1, day));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Una fila de la rueda: su tamaño y opacidad dependen de lo lejos que está
 * su centro del centro del contenedor (ver `scrollY`), igual que la rueda
 * de selección de hora de iOS — cuanto más lejos, más pequeña y tenue.
 * `itemHeight` ya viene resuelto por el padre (más alto si `active`), y la
 * tarjeta interior siempre se ajusta a esa altura con `overflow-hidden` y
 * texto truncado, así ninguna fila puede crecer más de lo que le corresponde
 * ni pisar a la de al lado.
 */
export function EventWheelRow({
  event,
  active,
  itemHeight,
  center,
  scrollY,
  onSelect,
}: EventWheelRowProps) {
  const scale = useTransform(
    scrollY,
    [center - 2 * FALLOFF_STEP, center - FALLOFF_STEP, center, center + FALLOFF_STEP, center + 2 * FALLOFF_STEP],
    [0.74, 0.88, 1, 0.88, 0.74],
  );
  const opacity = useTransform(
    scrollY,
    [center - 2 * FALLOFF_STEP, center - FALLOFF_STEP, center, center + FALLOFF_STEP, center + 2 * FALLOFF_STEP],
    [0.32, 0.62, 1, 0.62, 0.32],
  );

  return (
    <div
      className="flex items-center px-1"
      style={{ height: itemHeight, scrollSnapAlign: "center" }}
      onClick={onSelect}
    >
      <motion.div
        style={{ scale, opacity, height: itemHeight - 4 }}
        className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-glass-md border border-glass-border bg-glass px-3 py-2.5"
      >
        {active ? <ActiveEventConfetti /> : null}
        <div className="relative z-10 min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-foreground">{event.name}</p>
          <p className="truncate text-[13px] text-foreground-muted">
            {formatDate(event.event_date)} · {event.start_time.slice(0, 5)}–
            {event.end_time.slice(0, 5)}
          </p>
        </div>
        {active ? (
          <span className="relative z-10 shrink-0 rounded-glass-pill border border-glass-border bg-glass-strong px-2 py-1 text-[11px] font-medium leading-none text-foreground backdrop-blur-md backdrop-saturate-150">
            En curso ahora
          </span>
        ) : null}
      </motion.div>
    </div>
  );
}
