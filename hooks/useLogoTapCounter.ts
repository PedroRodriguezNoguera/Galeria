"use client";

import { useCallback, useRef } from "react";

const REQUIRED_TAPS = 7;
const TAP_WINDOW_MS = 1500;

/** Detecta N toques consecutivos dentro de una ventana de tiempo; sin rastro visible en la UI. */
export function useLogoTapCounter(onUnlock: () => void) {
  const tapCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerTap = useCallback(() => {
    tapCountRef.current += 1;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, TAP_WINDOW_MS);

    if (tapCountRef.current >= REQUIRED_TAPS) {
      tapCountRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      onUnlock();
    }
  }, [onUnlock]);

  return registerTap;
}
