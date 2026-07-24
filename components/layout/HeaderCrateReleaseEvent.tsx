"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { BullCrate } from "./BullCrate";
import { CrateTruck } from "./CrateTruck";
import { RunningBull } from "./RunningBull";

interface HeaderCrateReleaseEventProps {
  activeTheme: EventTheme;
}

const OFFSCREEN_LEFT = "-25%";
const CRATE_PARK_LEFT = "30%";
const BULL_EXIT_LEFT = "125%";

// La barra de empuje del camión (h-8 w-[70px]) debe llegar justo hasta la
// pared trasera del cajón (h-9 w-[50px], cuyo dibujo empieza ~3.5px dentro
// de su propio ancho) — de ahí el offset en px fijo en vez de un % suelto,
// así se tocan de verdad sea cual sea el ancho real de la cabecera.
// Los cuatro fotogramas usan SIEMPRE el mismo operador "+" (con el número en
// negativo cuando hace falta restar) a propósito: al mezclar valores complejos,
// Framer reconstruye cada tramo con la plantilla del fotograma DE DESTINO,
// operador incluido — mezclar "calc(A - B)" con "calc(A + B)" hacía que, justo
// al empezar el tramo de vuelta, se reconstruyera como "+B" en vez de "-B" (un
// salto de 2×65px hacia la derecha en el instante en que el camión retrocede).
const TRUCK_LEFT_KEYFRAMES = [
  "calc(-25% + 0px)",
  `calc(${CRATE_PARK_LEFT} + -65px)`,
  `calc(${CRATE_PARK_LEFT} + -65px)`,
  "calc(-25% + 0px)",
];

const TRUCK_CYCLE_SECONDS = 5.2;
const TRUCK_REVERSE_TIMES: number[] = [0, 0.48, 0.62, 1];
const TRUCK_REVERSE_START_MS = TRUCK_CYCLE_SECONDS * TRUCK_REVERSE_TIMES[2] * 1000;
const DOOR_OPEN_AT_MS = TRUCK_CYCLE_SECONDS * 1000; // justo cuando el camión termina de retroceder
const BULL_OUT_AT_MS = DOOR_OPEN_AT_MS + 800; // deja un respiro a la puerta para abrirse antes de que salga el toro
const BULL_RUN_SECONDS = 3.2;
const CRATE_FADE_AT_MS = BULL_OUT_AT_MS + BULL_RUN_SECONDS * 1000 - 800; // poco antes de que el toro termine de cruzar

// Objetos `transition` estables (fuera del render): esta escena tiene varios
// `useState` (bullOut/crateVisible aquí, reversing/doorOpen ya aislados
// dentro de CrateTruck/BullCrate) que cambian en momentos distintos, y cada
// cambio re-renderiza los `motion.div`. Si `transition` fuera un objeto
// inline, cada uno de esos renders le pasaría una instancia nueva a Framer
// en pleno vuelo — con un array de keyframes como el del camión, eso se leía
// como "vuelve a empezar", y se veía tele-transportado en vez de seguir su curva.
const TRUCK_TRANSITION: Transition = {
  duration: TRUCK_CYCLE_SECONDS,
  times: TRUCK_REVERSE_TIMES,
  ease: "easeInOut",
};
const CRATE_TRANSITION: Transition = {
  left: { duration: 2.5, ease: "easeInOut" },
  opacity: { duration: 0.7, ease: "easeIn" },
};
const BULL_TRANSITION: Transition = { duration: BULL_RUN_SECONDS, ease: "easeInOut" };

/**
 * Escena completa de la desencajonada: se monta entera y se coordina por
 * dentro con temporizadores (igual que ActiveEventConfetti) — el camión
 * entra empujando el cajón, lo deja hacia un tercio del recorrido, sale
 * marcha atrás, la puerta del cajón se abre hacia arriba y el toro sale
 * corriendo hacia la derecha hasta cruzar la cabecera. Al terminar la
 * carrera del toro, avisa al padre para desmontar toda la escena.
 */
export function CrateReleaseScene({ onComplete }: { onComplete: () => void }) {
  const [bullOut, setBullOut] = useState(false);
  const [crateVisible, setCrateVisible] = useState(true);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => setBullOut(true), BULL_OUT_AT_MS));
    timeouts.push(setTimeout(() => setCrateVisible(false), CRATE_FADE_AT_MS));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <>
      {/* camión: empuja el cajón hasta su sitio, se detiene un instante y sale marcha atrás */}
      <motion.div
        className="absolute bottom-0.5"
        initial={{ left: TRUCK_LEFT_KEYFRAMES[0] }}
        animate={{ left: TRUCK_LEFT_KEYFRAMES }}
        transition={TRUCK_TRANSITION}
      >
        <CrateTruck className="h-8 w-[70px] shrink-0" reverseDelayMs={TRUCK_REVERSE_START_MS} />
      </motion.div>

      {/* cajón: entra a la vez que el camión, se queda parado a un tercio del recorrido y se desvanece justo antes de que el toro termine de cruzar */}
      <motion.div
        className="absolute bottom-0.5"
        initial={{ left: OFFSCREEN_LEFT, opacity: 1 }}
        animate={{ left: CRATE_PARK_LEFT, opacity: crateVisible ? 1 : 0 }}
        transition={CRATE_TRANSITION}
      >
        <BullCrate className="h-9 w-[50px] shrink-0" openDelayMs={DOOR_OPEN_AT_MS} />
      </motion.div>

      {/* el toro sale desde donde quedó el cajón y cruza el resto de la cabecera */}
      {bullOut ? (
        <motion.div
          className="absolute bottom-0.5"
          initial={{ left: CRATE_PARK_LEFT }}
          animate={{ left: BULL_EXIT_LEFT }}
          transition={BULL_TRANSITION}
          onAnimationComplete={onComplete}
        >
          <RunningBull className="h-9 w-[4.5rem] shrink-0" />
        </motion.div>
      ) : null}
    </>
  );
}

/**
 * Desencajonada de toro: un camión entra empujando un cajón verde desde
 * atrás, lo deja hacia un tercio del recorrido de la cabecera y sale marcha
 * atrás; al salir, el cajón abre su puerta delantera hacia arriba y el toro
 * (mismo modelo que en el tema "toro") sale corriendo hacia la derecha.
 * Mismo patrón de disparo por actividad que el resto de temas: sólo activo
 * cuando el tema de la cabecera es "desencajonada", ignora activaciones
 * mientras ya hay una escena en curso.
 */
export function HeaderCrateReleaseEvent({ activeTheme }: HeaderCrateReleaseEventProps) {
  const [runId, setRunId] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const crateThemeActive = activeTheme === "desencajonada";

  useEffect(() => {
    if (prefersReducedMotion || !crateThemeActive) return;
    return onActivity(() => {
      setRunId((current) => current ?? Date.now());
    });
  }, [prefersReducedMotion, crateThemeActive]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {runId !== null ? <CrateReleaseScene key={runId} onComplete={() => setRunId(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}
