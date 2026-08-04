"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRealtimeBingo } from "@/hooks/useRealtimeBingo";
import type { BingoSettings } from "@/lib/data/bingoSettings";
import { Header } from "@/components/layout/Header";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { BingoBoard } from "./BingoBoard";

interface BingoGateProps {
  initial: BingoSettings;
  children: ReactNode;
}

// Sólo opacidad, nunca scale/x/y: tanto los children (UploadFab,
// EventCalendarFab, EventCountdownNotice, FeaturedCarousel) como BingoBoard
// tienen elementos `position: fixed` dentro — un `transform` en este
// envoltorio les cambiaría el bloque de contención (de la ventana al propio
// envoltorio) y rompería su posición mientras dura la transición.
const CROSSFADE_TRANSITION = { duration: 0.45, ease: "easeInOut" } as const;
const INSTANT_TRANSITION = { duration: 0 } as const;

/**
 * Decide en vivo (Realtime, ver useRealtimeBingo) si se muestra la galería
 * normal o el tablón de bingo a pantalla completa, sin recargar. El Header
 * vive aquí dentro (no en app/page.tsx) porque su texto también depende de
 * este mismo estado en vivo.
 *
 * Los children (galería, carrusel de destacados, FABs...) se quedan siempre
 * montados — sólo se ocultan con opacidad + `pointer-events: none` mientras
 * el bingo está activo, en vez de desmontarse. Si se desmontaran de verdad
 * cada vez que se activa/desactiva el bingo, el carrusel de bienvenida de
 * destacados (si está activo) se reiniciaría desde el primer slide cada vez,
 * y la galería perdería su posición de scroll.
 */
export function BingoGate({ initial, children }: BingoGateProps) {
  const { enabled, drawnNumbers, autoAssignCards, cardsResetAt, cardsPerVisitor } =
    useRealtimeBingo(initial);
  const prefersReducedMotion = usePrefersReducedMotion();
  const transition = prefersReducedMotion ? INSTANT_TRANSITION : CROSSFADE_TRANSITION;

  return (
    <>
      <Header bingoEnabled={enabled} />

      <motion.div
        animate={{ opacity: enabled ? 0 : 1 }}
        transition={transition}
        style={{ pointerEvents: enabled ? "none" : "auto" }}
        aria-hidden={enabled}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {enabled ? (
          <motion.div
            key="bingo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <BingoBoard
              drawnNumbers={drawnNumbers}
              autoAssignCards={autoAssignCards}
              cardsResetAt={cardsResetAt}
              cardsPerVisitor={cardsPerVisitor}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
