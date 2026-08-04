"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { springSnappy } from "@/animations/springs";
import {
  setBingoEnabled,
  setAutoAssignCards,
  setCardsPerVisitor,
  toggleBingoNumber,
  resetBingo,
  resetBingoCards,
} from "@/lib/actions/bingo";
import { useRealtimeBingo } from "@/hooks/useRealtimeBingo";
import { BINGO_MAX_NUMBER } from "@/constants/limits";

interface BingoScreenProps {
  initialEnabled: boolean;
  initialDrawnNumbers: number[];
  initialAutoAssignCards: boolean;
  initialCardsResetAt: string | null;
  initialCardsPerVisitor: number;
}

const ALL_NUMBERS = Array.from({ length: BINGO_MAX_NUMBER }, (_, i) => i + 1);
const CARD_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];

export function BingoScreen({
  initialEnabled,
  initialDrawnNumbers,
  initialAutoAssignCards,
  initialCardsResetAt,
  initialCardsPerVisitor,
}: BingoScreenProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [drawnNumbers, setDrawnNumbers] = useState(new Set(initialDrawnNumbers));
  const [pendingNumber, setPendingNumber] = useState<number | null>(null);
  const [resetPending, setResetPending] = useState(false);
  const [autoAssignCards, setAutoAssignCardsState] = useState(initialAutoAssignCards);
  const [autoAssignError, setAutoAssignError] = useState<string | null>(null);
  const [resetCardsPending, setResetCardsPending] = useState(false);
  const [resetCardsError, setResetCardsError] = useState<string | null>(null);
  const [cardsPerVisitor, setCardsPerVisitorState] = useState(initialCardsPerVisitor);
  const [cardsPerVisitorError, setCardsPerVisitorError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Si hay otro panel de admin abierto a la vez (otra pestaña, otro
  // dispositivo) marcando números, este se mantiene al día por Realtime en
  // vez de quedarse con su copia local desactualizada — mismo canal que usa
  // la vista pública.
  const live = useRealtimeBingo({
    enabled: initialEnabled,
    drawnNumbers: initialDrawnNumbers,
    autoAssignCards: initialAutoAssignCards,
    cardsResetAt: initialCardsResetAt,
    cardsPerVisitor: initialCardsPerVisitor,
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(live.enabled);
      setDrawnNumbers(new Set(live.drawnNumbers));
      setAutoAssignCardsState(live.autoAssignCards);
      setCardsPerVisitorState(live.cardsPerVisitor);
    }, 0);
    return () => clearTimeout(timer);
  }, [live.enabled, live.drawnNumbers, live.autoAssignCards, live.cardsPerVisitor]);

  function handleToggle() {
    const previous = enabled;
    const next = !enabled;
    setEnabled(next);
    setToggleError(null);
    startTransition(async () => {
      try {
        await setBingoEnabled(next);
      } catch (err) {
        setEnabled(previous);
        setToggleError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  function handleToggleAutoAssign() {
    const previous = autoAssignCards;
    const next = !autoAssignCards;
    setAutoAssignCardsState(next);
    setAutoAssignError(null);
    startTransition(async () => {
      try {
        await setAutoAssignCards(next);
      } catch (err) {
        setAutoAssignCardsState(previous);
        setAutoAssignError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  function handleSetCardsPerVisitor(count: number) {
    const previous = cardsPerVisitor;
    setCardsPerVisitorState(count);
    setCardsPerVisitorError(null);
    startTransition(async () => {
      try {
        await setCardsPerVisitor(count);
      } catch (err) {
        setCardsPerVisitorState(previous);
        setCardsPerVisitorError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  function handleToggleNumber(n: number) {
    const wasDrawn = drawnNumbers.has(n);
    setDrawnNumbers((current) => {
      const next = new Set(current);
      if (wasDrawn) next.delete(n);
      else next.add(n);
      return next;
    });
    setPendingNumber(n);
    startTransition(async () => {
      try {
        await toggleBingoNumber(n);
      } catch {
        setDrawnNumbers((current) => {
          const next = new Set(current);
          if (wasDrawn) next.add(n);
          else next.delete(n);
          return next;
        });
      } finally {
        setPendingNumber(null);
      }
    });
  }

  function handleReset() {
    const confirmed = window.confirm("¿Reiniciar el bingo? Se destacharán todos los números.");
    if (!confirmed) return;
    const previous = drawnNumbers;
    setDrawnNumbers(new Set());
    setResetPending(true);
    startTransition(async () => {
      try {
        await resetBingo();
      } catch {
        setDrawnNumbers(previous);
      } finally {
        setResetPending(false);
      }
    });
  }

  function handleResetCards() {
    const confirmed = window.confirm(
      "¿Reiniciar las papeletas? Se borran todas las asignadas — cada visitante recibirá una nueva.",
    );
    if (!confirmed) return;
    setResetCardsError(null);
    setResetCardsPending(true);
    startTransition(async () => {
      try {
        await resetBingoCards();
      } catch (err) {
        setResetCardsError(err instanceof Error ? err.message : "No se pudo reiniciar.");
      } finally {
        setResetCardsPending(false);
      }
    });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Bingo</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Al activarlo, la vista principal se sustituye por el tablón de números para todos los
          visitantes. Toca un número para tacharlo/destacharlo — se refleja al instante.
        </p>
      </div>

      <GlassPanel className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium text-foreground">Modo bingo</span>
        <Button
          variant={enabled ? "primary" : "glass"}
          size="sm"
          disabled={isPending}
          onClick={handleToggle}
        >
          {enabled ? "Activado" : "Desactivado"}
        </Button>
        {toggleError ? <span className="text-xs text-red-500">{toggleError}</span> : null}

        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleReset}
          className="ml-auto"
        >
          {resetPending ? <Spinner size={14} /> : null}
          Reiniciar
        </Button>
      </GlassPanel>

      <GlassPanel className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-foreground">Papeleta automática</span>
          <p className="text-xs text-foreground-muted">
            Cada visitante recibe su propio cartón (3x9) al entrar, además del tablón de números.
          </p>
        </div>
        <Button
          variant={autoAssignCards ? "primary" : "glass"}
          size="sm"
          disabled={isPending}
          onClick={handleToggleAutoAssign}
          className="ml-auto"
        >
          {autoAssignCards ? "Activada" : "Desactivada"}
        </Button>
        {autoAssignError ? <span className="text-xs text-red-500">{autoAssignError}</span> : null}

        <div className="flex w-full flex-wrap items-center gap-3 border-t border-foreground/10 pt-3">
          <div>
            <span className="text-sm font-medium text-foreground">Cartones por visitante</span>
            <p className="text-xs text-foreground-muted">
              Cuántas papeletas recibe cada visitante con la asignación automática.
            </p>
          </div>
          <div className="ml-auto flex gap-1.5">
            {CARD_COUNT_OPTIONS.map((count) => (
              <Button
                key={count}
                type="button"
                variant={cardsPerVisitor === count ? "primary" : "glass"}
                size="sm"
                disabled={isPending}
                onClick={() => handleSetCardsPerVisitor(count)}
                className="w-9 px-0"
              >
                {count}
              </Button>
            ))}
          </div>
          {cardsPerVisitorError ? (
            <span className="w-full text-xs text-red-500">{cardsPerVisitorError}</span>
          ) : null}
        </div>

        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleResetCards}
          className="w-full sm:w-auto"
        >
          {resetCardsPending ? <Spinner size={14} /> : null}
          Reiniciar papeletas
        </Button>
        {resetCardsError ? <span className="text-xs text-red-500">{resetCardsError}</span> : null}
      </GlassPanel>

      {/* Sólo 5 por fila (frente a las 9-10 de la vista pública): celdas más
          grandes, para tocar sin equivocarse de número vecino. */}
      <GlassPanel elevation="md" className="grid grid-cols-5 gap-2.5 p-3">
        {ALL_NUMBERS.map((n) => {
          const drawn = drawnNumbers.has(n);
          const isNumberPending = pendingNumber === n;
          return (
            <motion.button
              key={n}
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={() => handleToggleNumber(n)}
              disabled={isNumberPending}
              aria-pressed={drawn}
              aria-label={`Número ${n}${drawn ? ", marcado" : ""}`}
              className={`flex aspect-square items-center justify-center rounded-glass-sm text-base font-semibold transition-colors disabled:opacity-60 sm:text-lg ${
                drawn
                  ? "bg-foreground text-background line-through decoration-2"
                  : "bg-glass text-foreground-muted"
              }`}
            >
              {n}
            </motion.button>
          );
        })}
      </GlassPanel>
    </>
  );
}
