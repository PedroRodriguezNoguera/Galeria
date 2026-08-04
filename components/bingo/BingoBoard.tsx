"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BINGO_MAX_NUMBER } from "@/constants/limits";
import { springGentle, springPop, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { MyBingoCard } from "./MyBingoCard";

interface BingoBoardProps {
  drawnNumbers: number[];
  autoAssignCards: boolean;
  cardsResetAt: string | null;
  cardsPerVisitor: number;
}

const ALL_NUMBERS = Array.from({ length: BINGO_MAX_NUMBER }, (_, i) => i + 1);
const ANNOUNCE_MS = 1300;

function cellLayoutId(n: number) {
  return `bingo-cell-${n}`;
}

/**
 * Los números nuevos no se tachan de golpe: se encolan (en un ref — no hace
 * falta re-render sólo por encolar) y se "cantan" uno a uno, grandes en el
 * centro, antes de asentarse en su celda. El número grande y la celda final
 * comparten `layoutId` — Framer Motion anima solo la transición de
 * tamaño/posición entre ambos (magic move), sin calcular coordenadas a mano.
 *
 * Cada actualización de estado ocurre dentro de un timer (aunque sea de
 * 0ms): los efectos aquí sólo sincronizan con el mundo exterior (la cola,
 * los timers), nunca llaman a setState de forma síncrona en su propio
 * cuerpo — así una prop nueva no dispara una cascada de renders.
 */
export function BingoBoard({
  drawnNumbers,
  autoAssignCards,
  cardsResetAt,
  cardsPerVisitor,
}: BingoBoardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [settled, setSettled] = useState<Set<number>>(() => new Set(drawnNumbers));
  const [announcing, setAnnouncing] = useState<number | null>(null);
  const [queueTick, setQueueTick] = useState(0);

  const queueRef = useRef<number[]>([]);
  // Sin valor inicial: se siembra dentro del efecto de abajo (mutar un ref
  // ahí está permitido; hacerlo en el cuerpo del render, no — ver más abajo).
  const knownRef = useRef<Set<number> | undefined>(undefined);

  // Detecta números nuevos/quitados frente al último drawnNumbers visto.
  useEffect(() => {
    const drawnNow = new Set(drawnNumbers);
    // Primera vez: siembra silenciosa, sin encolar nada — todo lo ya
    // marcado se muestra asentado de golpe vía el estado inicial de
    // `settled`, no hace falta "cantarlo" otra vez.
    if (knownRef.current === undefined) {
      knownRef.current = drawnNow;
      return;
    }
    const newlyDrawn: number[] = [];
    for (const n of drawnNumbers) if (!knownRef.current.has(n)) newlyDrawn.push(n);
    const removed: number[] = [];
    for (const n of knownRef.current) if (!drawnNow.has(n)) removed.push(n);
    knownRef.current = drawnNow;
    if (newlyDrawn.length === 0 && removed.length === 0) return;

    if (removed.length > 0) {
      queueRef.current = queueRef.current.filter((n) => !removed.includes(n));
    }
    if (newlyDrawn.length > 0 && !prefersReducedMotion) {
      queueRef.current.push(...newlyDrawn);
    }

    const timer = setTimeout(() => {
      setSettled((current) => {
        let changed = false;
        const next = new Set(current);
        for (const n of removed) if (next.delete(n)) changed = true;
        if (prefersReducedMotion) {
          for (const n of newlyDrawn) {
            if (!next.has(n)) {
              next.add(n);
              changed = true;
            }
          }
        }
        return changed ? next : current;
      });
      setQueueTick((t) => t + 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [drawnNumbers, prefersReducedMotion]);

  // Arranca el siguiente de la cola en cuanto hay hueco (nada cantándose).
  useEffect(() => {
    if (announcing !== null || queueRef.current.length === 0) return;
    const timer = setTimeout(() => {
      const next = queueRef.current.shift();
      if (next !== undefined) setAnnouncing(next);
    }, 0);
    return () => clearTimeout(timer);
  }, [announcing, queueTick]);

  // Mantiene el número grande visible un rato y luego lo asienta en la
  // rejilla — salvo que el admin lo haya destachado mientras tanto (comprueba
  // knownRef, la fuente de verdad más reciente): si no, un número corregido a
  // tiempo podía "resucitar" igualmente al terminar su propia animación.
  useEffect(() => {
    if (announcing === null) return;
    const timer = setTimeout(() => {
      if (knownRef.current?.has(announcing)) {
        setSettled((current) => new Set(current).add(announcing));
      }
      setAnnouncing(null);
    }, ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [announcing]);

  const lastAnnounced = announcing ?? drawnNumbers.at(-1);

  return (
    // Sin animación de entrada/salida propia: la lleva el motion.div que la
    // envuelve en BingoGate (el cruce con la galería). Ocupa toda la
    // pantalla (no empieza debajo de la cabecera) y compensa con
    // padding-top — igual que el <main> de la galería: así el contenido
    // pasa por detrás de la cabecera (semitransparente) al hacer scroll, en
    // vez de quedar recortado justo antes de llegar a ella. El z-index se
    // queda por debajo del de la cabecera (z-40) a propósito, para que esta
    // se siga viendo por encima en vez de taparla.
    <div className="fixed inset-0 z-30 flex flex-col items-center overflow-y-auto px-3 pb-10 pt-[calc(env(safe-area-inset-top)+7rem)]">
      <div className="mx-auto w-full max-w-2xl">
        <MyBingoCard
          autoAssignCards={autoAssignCards}
          cardsResetAt={cardsResetAt}
          cardsPerVisitor={cardsPerVisitor}
        />

        <GlassPanel elevation="md" className="grid grid-cols-9 gap-1.5 p-3 sm:grid-cols-10 sm:gap-2">
          {ALL_NUMBERS.map((n) => {
            const drawn = settled.has(n);
            return (
              <motion.div
                // La key cambia justo al tacharse: fuerza un remount real de
                // este nodo (no un simple cambio de prop en el de siempre),
                // que es lo que hace que Framer Motion reconozca "aquí
                // aparece un elemento nuevo con este layoutId" y anime el
                // vuelo desde el círculo grande en vez de aparecer en su sitio.
                key={`${n}-${drawn}`}
                layoutId={drawn ? cellLayoutId(n) : undefined}
                transition={prefersReducedMotion ? fadeTransition : springGentle}
                className={`flex aspect-square items-center justify-center rounded-glass-sm text-xs font-semibold transition-colors sm:text-sm ${
                  drawn
                    ? "bg-foreground text-background line-through decoration-2"
                    : "bg-glass text-foreground-muted"
                }`}
              >
                {n}
              </motion.div>
            );
          })}
        </GlassPanel>

        <GlassPanel strong elevation="lg" className="mt-4 px-4 py-3 text-center">
          <p className="text-sm text-foreground-muted">
            {lastAnnounced !== undefined
              ? `Último número cantado: ${lastAnnounced}`
              : "Esperando al primer número…"}
          </p>
        </GlassPanel>
      </div>

      {announcing !== null ? (
        <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center">
          <motion.div
            layoutId={cellLayoutId(announcing)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springPop}
            className="flex h-32 w-32 items-center justify-center rounded-full bg-foreground text-5xl font-extrabold text-background shadow-glass-lg sm:h-40 sm:w-40 sm:text-6xl"
          >
            {announcing}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
