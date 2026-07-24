"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";
import { ChupinazoScene } from "./Chupinazo";

// La secuencia interna (montar con pausas + preparar el brazo + vuelo +
// explosión con 7 subexplosiones escalonadas y caída lenta, ver
// Chupinazo.tsx) tarda ahora ~7.8s; se deja un margen de reposo después
// antes de desmontar toda la escena.
const VISIBLE_DURATION_MS = 9600;

// La escena entera (fuente+balcón) se ancla aquí; mover la fuente sola
// dentro de su propio lienzo no bastaba (el lienzo se ensancha a la vez que
// el borde izquierdo se queda fijo en este mismo porcentaje, así que el
// desplazamiento en píxeles reales era casi nulo) — para que se note de
// verdad, se baja este ancla completo. Antes 35%; el cohete vuela hasta el
// 74% y explota ahí.
const LAUNCH_LEFT_PERCENT = 20;
const TARGET_LEFT_PERCENT = 74;

interface HeaderChupinazoEventProps {
  activeTheme: EventTheme;
}

/**
 * Chupinazo: la fuente de San Bernardo sube desde abajo y un balcón con una
 * persona baja desde arriba (mismo patrón de montaje por partes que
 * DiscoStage); pasado un instante, la persona lanza un cohete que cruza la
 * cabecera y estalla en una explosión de colores junto al texto. Se dispara
 * con actividad y se desmonta de golpe pasado el tiempo visible, igual que
 * la discomóvil o la cena patronal — sólo activo cuando el tema es
 * "chupinazo".
 */
export function HeaderChupinazoEvent({ activeTheme }: HeaderChupinazoEventProps) {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const chupinazoThemeActive = activeTheme === "chupinazo";

  useEffect(() => {
    if (prefersReducedMotion || !chupinazoThemeActive) return;

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
  }, [prefersReducedMotion, chupinazoThemeActive]);

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        {visible ? (
          <ChupinazoScene launchLeftPercent={LAUNCH_LEFT_PERCENT} targetLeftPercent={TARGET_LEFT_PERCENT} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
