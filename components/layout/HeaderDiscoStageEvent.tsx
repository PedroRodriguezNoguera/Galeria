"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { DiscoStage } from "./DiscoStage";

const VISIBLE_DURATION_MS = 5000;

interface HeaderDiscoStageEventProps {
  activeTheme: EventTheme;
}

/**
 * Escenario de discomóvil en la cabecera: a diferencia del toro/furgoneta/
 * charanga, no cruza de lado a lado — se monta por partes (ver DiscoStage),
 * se mantiene un rato, y se desmonta de golpe (todo sale a la vez, cada
 * pieza por donde entró). Fijo en `left-[30%]`, la misma posición que la
 * vajilla de la cena patronal (ver HeaderCenaPatronalEvent), en vez de
 * centrado como antes. Se dispara con actividad, ignora activaciones
 * mientras ya está montado, y sólo cuando el tema activo es "discomovil".
 */
export function HeaderDiscoStageEvent({ activeTheme }: HeaderDiscoStageEventProps) {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const discoThemeActive = activeTheme === "discomovil";

  useEffect(() => {
    if (prefersReducedMotion || !discoThemeActive) return;

    let showing = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onActivity(() => {
      if (showing) return;
      showing = true;
      setVisible(true);
      timeoutId = setTimeout(() => {
        showing = false;
        setVisible(false);
      }, VISIBLE_DURATION_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion, discoThemeActive]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {visible ? <DiscoStage className="absolute bottom-0.5 left-[30%] h-[60px] w-[125px]" /> : null}
      </AnimatePresence>
    </div>
  );
}
