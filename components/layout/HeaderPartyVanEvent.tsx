"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { PartyVan } from "./PartyVan";

const DRIVE_DURATION_SECONDS = 6;

interface HeaderPartyVanEventProps {
  activeTheme: EventTheme;
}

/**
 * Furgoneta con equipo de DJ cruzando la cabecera de lado a lado: mismo
 * patrón que HeaderRunEvent (se dispara con actividad, ignora activaciones
 * mientras ya hay una en curso), pero sólo cuando el tema activo es
 * "furgoneta" — igual que el toro sólo corre con su propia familia de temas.
 */
export function HeaderPartyVanEvent({ activeTheme }: HeaderPartyVanEventProps) {
  const [runId, setRunId] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const vanThemeActive = activeTheme === "furgoneta";

  useEffect(() => {
    if (prefersReducedMotion || !vanThemeActive) return;
    return onActivity(() => {
      setRunId((current) => current ?? Date.now());
    });
  }, [prefersReducedMotion, vanThemeActive]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {runId !== null ? (
          <motion.div
            key={runId}
            // Igual que en HeaderRunEvent: `left` relativo al ancho de la cabecera,
            // para recorrerla de punta a punta.
            className="absolute bottom-0.5"
            initial={{ left: "-25%" }}
            animate={{ left: "115%" }}
            transition={{ duration: DRIVE_DURATION_SECONDS, ease: "easeInOut" }}
            onAnimationComplete={() => setRunId(null)}
          >
            <PartyVan className="h-12 w-44 shrink-0" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
