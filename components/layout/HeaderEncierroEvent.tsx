"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { RunningBull } from "./RunningBull";
import { Mozo } from "./Mozo";
import { EncierroFence } from "./EncierroFence";

// Más rápido y más apretado que el toro suelto (HeaderRunEvent, 6s): un
// encierro de verdad es una manada pegada a los talones de los corredores,
// no una persecución de uno contra uno.
const RUN_DURATION_SECONDS = 5;
// El mozo que va EN CABEZA se cae a mitad de CABECERA. Dos cosas a tener en
// cuenta para que esto sea así de verdad (la primera se nos pasó la vez
// anterior, por eso seguía cayendo casi al final):
//
// 1) El mozo que tropieza es el ÚLTIMO de los 6 elementos de la fila
//    (cabestro, 2 toros, 2 mozos, y él) — no va pegado al ancla del grupo
//    (`left`, que posiciona el borde izquierdo del cabestro), sino unos
//    ~170px más a la derecha (suma de anchos/márgenes de todo lo que va
//    delante de él: 56+36+72+16+16... con las clases actuales, su borde
//    izquierdo cae unos 168px después del ancla). Ese desplazamiento es
//    FIJO en píxeles, así que en una cabecera estrecha es un % grande del
//    ancho y en una ancha es un % pequeño — no hay un valor que cuadre
//    perfecto en todos los tamaños, así que se calcula para un ancho de
//    cabecera típico (~430px), donde 170px son ~40% del ancho.
// 2) `ease: "linear"` en vez de "easeInOut" (ver más abajo): así el % de
//    tiempo transcurrido se corresponde EXACTAMENTE con el % de `left`
//    recorrido, sin la curva en S de antes metiendo más incertidumbre.
//
// Con eso: para que el mozo (ancla + ~40%) esté al 50% real, el ancla debe
// estar al 50-40=10% en ese instante. El grupo va de -28% a 118% (rango de
// 146 puntos), así que el 10% cae en la fracción de tiempo (10+28)/146≈0.26.
// La ventana de caída dura 0.13 (ver times en Mozo) y queremos su CENTRO —
// no el arranque — en ese punto: 0.26-0.13/2 ≈ 0.195.
const STUMBLE_AT_FRACTION = 0.195;
const FENCE_FADE_SECONDS = 0.3;

interface HeaderEncierroEventProps {
  activeTheme: EventTheme;
}

/**
 * Encierro: dos toros + un cabestro (con cencerro, ver RunningBull variant
 * "cabestro") pegados entre sí, con un hueco real (no solape) hasta tres
 * mozos que corren delante — todo el grupo cruza la cabecera de lado a lado
 * más rápido y más apretado que el toro suelto. El mozo que va en cabeza se
 * cae a mitad de carrera y pasa a última posición (ver Mozo). Mientras dura
 * la carrera, una valla de madera enmarca la cabecera arriba y abajo para
 * que se sienta como una calle encajonada, no gente corriendo sobre el
 * cristal. Se lanza con actividad, ignora activaciones mientras ya hay una
 * carrera en curso, y sólo cuando el tema activo es "encierro".
 */
export function HeaderEncierroEvent({ activeTheme }: HeaderEncierroEventProps) {
  const [runId, setRunId] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const encierroThemeActive = activeTheme === "encierro";

  useEffect(() => {
    if (prefersReducedMotion || !encierroThemeActive) return;
    return onActivity(() => {
      setRunId((current) => current ?? Date.now());
    });
  }, [prefersReducedMotion, encierroThemeActive]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {runId !== null ? (
          <>
            {/* vallas: encajan la cabecera arriba y abajo mientras dura la carrera */}
            <motion.div
              key={`fence-top-${runId}`}
              className="absolute inset-x-0 top-0 z-[4] h-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FENCE_FADE_SECONDS }}
            >
              <EncierroFence className="h-full w-full" />
            </motion.div>
            <motion.div
              key={`fence-bottom-${runId}`}
              className="absolute inset-x-0 bottom-0 z-[4] h-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FENCE_FADE_SECONDS }}
            >
              <EncierroFence className="h-full w-full -scale-y-100" />
            </motion.div>

            {/* la manada: toros+cabestro detrás (izquierda), mozos huyendo delante (derecha) */}
            <motion.div
              key={runId}
              className="absolute bottom-0.5 flex items-end"
              initial={{ left: "-28%" }}
              animate={{ left: "118%" }}
              // "linear", no "easeInOut": así el % de tiempo transcurrido se
              // corresponde EXACTAMENTE con el % de recorrido, necesario para
              // que el cálculo de STUMBLE_AT_FRACTION de arriba sea fiable.
              transition={{ duration: RUN_DURATION_SECONDS, ease: "linear" }}
              onAnimationComplete={() => setRunId(null)}
            >
              {/* el cabestro (marrón) va el último del todo, más atrás que los dos toros negros */}
              <RunningBull variant="cabestro" className="h-8 w-14 shrink-0" />
              <RunningBull variant="normal" className="-ml-5 h-8 w-14 shrink-0" />
              <RunningBull variant="normal" className="-ml-5 h-8 w-14 shrink-0" />
              {/* más separación entre la manada y los mozos: hueco real, no solape */}
              <Mozo shirtTone="#efe9da" className="ml-4 h-7 w-4 shrink-0" />
              <Mozo shirtTone="#f7f3e8" className="-ml-1 h-7 w-4 shrink-0" />
              {/* el mozo en cabeza (el último en el DOM = el más adelantado): se cae a mitad de carrera y pasa a última posición */}
              <Mozo
                shirtTone="#f5f1e6"
                className="-ml-1 h-7 w-4 shrink-0"
                stumbleAtFraction={STUMBLE_AT_FRACTION}
                crossingDurationSeconds={RUN_DURATION_SECONDS}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
