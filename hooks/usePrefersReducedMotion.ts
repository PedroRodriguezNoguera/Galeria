"use client";

import { useReducedMotion } from "framer-motion";

/** Punto único de import: si `prefers-reduced-motion` está activo, desactivar spring/scale/drag. */
export function usePrefersReducedMotion() {
  return useReducedMotion() ?? false;
}
