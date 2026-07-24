"use client";

import { useEffect, useState } from "react";
import { onActivity } from "@/lib/events/activityBus";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { EventTheme } from "@/constants/eventThemes";

const WAVE_DURATION_MS = 4000;

/**
 * Oleada de confeti: igual que la carrera del toro, se dispara con actividad
 * (ver lib/events/activityBus) y dura un tiempo fijo — sólo cuando el tema
 * activo es "confeti". Si ya hay una oleada en curso, la actividad que llegue
 * mientras tanto se ignora (nunca se acumulan/reinician oleadas superpuestas).
 */
export function useConfettiWave(activeTheme: EventTheme): boolean {
  const [waving, setWaving] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const active = activeTheme === "confeti";

  useEffect(() => {
    if (prefersReducedMotion || !active) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onActivity(() => {
      if (timeoutId !== null) return;
      setWaving(true);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        setWaving(false);
      }, WAVE_DURATION_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion, active]);

  return waving;
}
