"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import type { MediaWithReactions } from "@/types/media";
import { MediaThumbnail } from "@/components/gallery/MediaThumbnail";
import { scaleFadeIn, iconPop, fadeIn } from "@/animations/variants";
import { springSnappy, springPop, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

interface AdminGalleryTileProps {
  media: MediaWithReactions;
  selectionMode: boolean;
  selected: boolean;
  onActivateSelection: () => void;
  onTap: () => void;
}

const LONG_PRESS_MS = 450;
// Si el dedo se mueve más de esto durante la espera, es un scroll, no una
// pulsación mantenida: se cancela (mismo criterio que GalleryTile público).
const MOVE_CANCEL_PX = 10;

export function AdminGalleryTile({
  media,
  selectionMode,
  selected,
  onActivateSelection,
  onTap,
}: AdminGalleryTileProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  // El click que sigue tras soltar el dedo llegaría justo después de activar
  // el modo selección: se marca para que onClick lo ignore esa vez.
  const longPressFiredRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }

  function handlePointerDown(event: React.PointerEvent) {
    // Ya en modo selección: cualquier pulsación (larga o corta) sólo alterna
    // esta miniatura, no hace falta el temporizador de activación.
    if (selectionMode) return;
    longPressFiredRef.current = false;
    startPosRef.current = { x: event.clientX, y: event.clientY };
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      navigator.vibrate?.(15);
      onActivateSelection();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: React.PointerEvent) {
    const start = startPosRef.current;
    if (!start || !timerRef.current) return;
    const movedPx = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (movedPx > MOVE_CANCEL_PX) clearTimer();
  }

  function handleClick() {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (selectionMode) navigator.vibrate?.(8);
    onTap();
  }

  return (
    <motion.div
      variants={scaleFadeIn}
      // Encogimiento ligero mientras está seleccionada: el mismo lenguaje
      // "presionado" que usan las apps de fotos, en vez de un simple cambio
      // de color instantáneo.
      animate={prefersReducedMotion ? undefined : { scale: selected ? 0.92 : 1 }}
      transition={springSnappy}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      className="relative aspect-square overflow-hidden rounded-glass-sm bg-glass"
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
        onContextMenu={(event) => event.preventDefault()}
        className="relative block h-full w-full [-webkit-touch-callout:none]"
        aria-label={
          selectionMode
            ? selected
              ? "Quitar de la selección"
              : "Añadir a la selección"
            : "Abrir moderación de esta publicación"
        }
      >
        <MediaThumbnail media={media} />

        {media.is_hidden ? (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-scrim backdrop-blur-[1px]",
              "text-[11px] font-medium text-white",
            )}
          >
            Oculta
          </span>
        ) : null}

        {media.is_featured ? (
          <span
            className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-[11px] backdrop-blur-md backdrop-saturate-150"
            aria-hidden="true"
          >
            ⭐
          </span>
        ) : null}

        {media.album_id ? (
          <span
            className={cn(
              "absolute top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-[11px] backdrop-blur-md backdrop-saturate-150",
              // Si ya hay insignia de destacado, se coloca al lado en vez de encima.
              media.is_featured ? "left-7" : "left-1.5",
            )}
            aria-hidden="true"
            title="Ya está en una carpeta"
          >
            📁
          </span>
        ) : null}

        <AnimatePresence>
          {selectionMode ? (
            <motion.span
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className={cn(
                "absolute inset-0 transition-colors",
                selected ? "bg-foreground/30" : "bg-transparent",
              )}
              aria-hidden="true"
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {selectionMode ? (
            <motion.span
              key="check"
              variants={prefersReducedMotion ? fadeIn : iconPop}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={prefersReducedMotion ? fadeTransition : springPop}
              className={cn(
                "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold leading-none",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-white/70 bg-black/20 text-transparent",
              )}
              aria-hidden="true"
            >
              ✓
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
