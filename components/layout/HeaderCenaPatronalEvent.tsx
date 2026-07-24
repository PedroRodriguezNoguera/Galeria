"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";

// Import dinámico (sin SSR): esta escena arrastra matter-js para la física
// real de cacerola/tapa/hielos — no tiene sentido meter ese peso en el bundle
// principal de CADA página cuando sólo hace falta si el tema activo es
// "cena_patronal" y además hay actividad que la dispare.
const CenaPatronalScene = dynamic(() => import("./CenaPatronal").then((m) => m.CenaPatronalScene), {
  ssr: false,
});

const VISIBLE_DURATION_MS = 5600;

interface HeaderCenaPatronalEventProps {
  activeTheme: EventTheme;
}

/**
 * Vajilla de la cena patronal cayendo en la cabecera: a diferencia del
 * toro/furgoneta/charanga, no cruza de lado a lado — se queda fija (misma
 * posición, `left-[30%]`, en la que aparca el cajón en la desencajonada; ver
 * CRATE_PARK_LEFT en HeaderCrateReleaseEvent) y se desmonta de golpe pasado
 * el tiempo visible. Mismo patrón de disparo por actividad que el resto de
 * temas: sólo activo cuando el tema activo es "cena_patronal", ignora
 * activaciones mientras ya está en pantalla.
 */
export function HeaderCenaPatronalEvent({ activeTheme }: HeaderCenaPatronalEventProps) {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const dinnerThemeActive = activeTheme === "cena_patronal";

  useEffect(() => {
    if (prefersReducedMotion || !dinnerThemeActive) return;

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
  }, [prefersReducedMotion, dinnerThemeActive]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {visible ? <CenaPatronalScene className="absolute bottom-0.5 left-[30%] h-12 w-[126px]" /> : null}
      </AnimatePresence>
    </div>
  );
}
