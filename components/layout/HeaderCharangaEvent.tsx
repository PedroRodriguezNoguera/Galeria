"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { Charanga } from "./Charanga";

const CROSS_DURATION_SECONDS = 8;

interface HeaderCharangaEventProps {
  activeTheme: EventTheme;
}

/**
 * Charanga cruzando la cabecera de lado a lado: mismo patrón que
 * HeaderRunEvent/HeaderPartyVanEvent (se dispara con actividad, ignora
 * activaciones mientras ya hay una en curso), pero sólo cuando el tema
 * activo es "charanga".
 */
export function HeaderCharangaEvent({ activeTheme }: HeaderCharangaEventProps) {
  const [runId, setRunId] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const charangaThemeActive = activeTheme === "charanga";

  useEffect(() => {
    if (prefersReducedMotion || !charangaThemeActive) return;
    return onActivity(() => {
      setRunId((current) => current ?? Date.now());
    });
  }, [prefersReducedMotion, charangaThemeActive]);

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
            transition={{ duration: CROSS_DURATION_SECONDS, ease: "easeInOut" }}
            onAnimationComplete={() => setRunId(null)}
          >
            <Charanga className="h-[52px] w-[140px] shrink-0" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
