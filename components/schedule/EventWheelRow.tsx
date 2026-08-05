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
  // El encogimiento es sólo visual (transform), pero la fila que lo contiene
  // mantiene su alto fijo siempre (imprescindible para que el centrado y el
  // scroll-snap sigan siendo exactos) — así que cuanto más se encoge una
  // tarjeta, más hueco vacío deja dentro de su propia fila, y eso se veía
  // como espacio de más hacia las vecinas. Intentar compensarlo con márgenes
  // no sirve (el centrado del propio flex los absorbe), así que en vez de
  // corregir el hueco se reduce a casi nada: el rango de escala fuera del
  // centro es muy sutil, y es la opacidad — que no ocupa espacio — la que
  // lleva casi todo el peso de marcar la distancia al centro. La propia
  // tarjeta central, en cambio, sí crece por encima de 1: al ser un único
  // punto (no una caída que se repite fila a fila) no genera el mismo hueco
  // acumulado, y así resalta más sobre el resto.
  const breakpoints = [
    center - 2 * FALLOFF_STEP,
    center - FALLOFF_STEP,
    center,
    center + FALLOFF_STEP,
    center + 2 * FALLOFF_STEP,
  ];
  // Sólo vertical: si el ancho también escalara con `scale`, la central (por
  // encima de 1) se saldría por los lados de la fila y se vería recortada.
  // El ancho, en cambio, se controla aparte con una propiedad de verdad (no
  // un transform), así la central puede llegar a ocupar el 100% sin cortes.
  const scaleY = useTransform(scrollY, breakpoints, [0.94, 0.97, 1.08, 0.97, 0.94]);
  const width = useTransform(scrollY, breakpoints, ["90%", "95%", "100%", "95%", "90%"]);
  const opacity = useTransform(scrollY, breakpoints, [0.3, 0.6, 1, 0.6, 0.3]);
  // Cristal más marcado en la central (fondo y borde más presentes), en vez
  // de depender sólo del tamaño para que destaque.
  const backgroundColor = useTransform(
    scrollY,
    breakpoints,
    [
      "rgba(255,255,255,0.14)",
      "rgba(255,255,255,0.14)",
      "rgba(255,255,255,0.26)",
      "rgba(255,255,255,0.14)",
      "rgba(255,255,255,0.14)",
    ],
  );
  const borderColor = useTransform(
    scrollY,
    breakpoints,
    [
      "rgba(255,255,255,0.5)",
      "rgba(255,255,255,0.5)",
      "rgba(255,255,255,0.85)",
      "rgba(255,255,255,0.5)",
      "rgba(255,255,255,0.5)",
    ],
  );

  return (
    <div
      className="flex items-center justify-center px-1"
      style={{ height: itemHeight, scrollSnapAlign: "center" }}
      onClick={onSelect}
    >
      <motion.div
        style={{ scaleY, width, opacity, backgroundColor, borderColor, height: itemHeight - 4 }}
        className="relative flex items-center justify-between gap-3 overflow-hidden rounded-glass-md border px-3 py-2.5"
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
