"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { RunningBull } from "./RunningBull";
import { RunningPerson } from "./RunningPerson";

const RUN_DURATION_SECONDS = 6;

interface HeaderRunEventProps {
  activeTheme: EventTheme;
}

/**
 * Toro persiguiendo a una persona de lado a lado de la cabecera: se lanza
 * cada vez que alguien sube una foto/vídeo o reacciona a una (ver
 * lib/events/activityBus). Si ya hay una carrera en curso, los eventos que
 * lleguen mientras tanto se ignoran — nunca se acumulan carreras superpuestas.
 * El aspecto del toro (normal o embolado) depende del tema activo recibido
 * de Header (ver hooks/useActiveEventTheme).
 */
export function HeaderRunEvent({ activeTheme }: HeaderRunEventProps) {
  const [runId, setRunId] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // El toro sólo corre cuando el tema activo es de la familia "toro": si hay
  // programada una oleada de confeti (o cualquier otro tema no-toro), la
  // actividad no debe sacar al toro a escena.
  const bullThemeActive = activeTheme === "toro" || activeTheme === "toro_embolado";

  useEffect(() => {
    if (prefersReducedMotion || !bullThemeActive) return;
    return onActivity(() => {
      setRunId((current) => current ?? Date.now());
    });
  }, [prefersReducedMotion, bullThemeActive]);

  if (prefersReducedMotion) return null;

  const bullVariant = activeTheme === "toro_embolado" ? "embolado" : "normal";

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {runId !== null ? (
          <motion.div
            key={runId}
            // `left` es relativo al ancho del CONTENEDOR (la cabecera), a diferencia de un
            // transform `x` en porcentaje, que sería relativo al propio (estrecho) grupo y
            // apenas se movería. Así sí recorre la cabecera de punta a punta.
            className="absolute bottom-0.5 flex items-end"
            initial={{ left: "-20%" }}
            animate={{ left: "115%" }}
            transition={{ duration: RUN_DURATION_SECONDS, ease: "easeInOut" }}
            onAnimationComplete={() => setRunId(null)}
          >
            {/* El toro va detrás (izquierda); la persona huye delante (derecha). */}
            <RunningBull variant={bullVariant} className="h-9 w-[4.5rem] shrink-0" />
            <RunningPerson className="-ml-1.5 h-8 w-5 shrink-0" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
