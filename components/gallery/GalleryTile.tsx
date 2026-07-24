"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion } from "framer-motion";
import type { MediaWithReactions } from "@/types/media";
import { MediaThumbnail } from "./MediaThumbnail";
import { scaleFadeIn } from "@/animations/variants";

interface GalleryTileProps {
  media: MediaWithReactions;
}

// Mínimo viable: por debajo de esto no da tiempo a que llegue ni un
// pointermove antes de disparar, así que un scroll real ya no se detectaría
// a tiempo para cancelarse (ver MOVE_CANCEL_PX).
const LONG_PRESS_MS = 100;
// Si el dedo se mueve más de esto durante la espera, es un scroll, no una
// pulsación mantenida: se cancela.
const MOVE_CANCEL_PX = 10;
const HAPTIC_MS = 15;

export function GalleryTile({ media }: GalleryTileProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  // El click sintético del navegador tras soltar el dedo llegaría después de
  // esta navegación: se marca para que el propio onClick lo ignore.
  const longPressFiredRef = useRef(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }

  function handlePointerDown(event: React.PointerEvent) {
    longPressFiredRef.current = false;
    startPosRef.current = { x: event.clientX, y: event.clientY };
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      navigator.vibrate?.(HAPTIC_MS);
      // scroll: false — es una ruta interceptada (se abre como modal encima
      // de la lista, no una página nueva): sin esto Next igualmente sube el
      // fondo al principio como si fuera una navegación real, y el salto se
      // nota doble (al abrir y otra vez al cerrar, al corregirlo).
      router.push(`/media/${media.id}`, { scroll: false });
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: React.PointerEvent) {
    const start = startPosRef.current;
    if (!start || !timerRef.current) return;
    const movedPx = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (movedPx > MOVE_CANCEL_PX) clearTimer();
  }

  function handleClick(event: React.MouseEvent) {
    if (longPressFiredRef.current) {
      event.preventDefault();
      longPressFiredRef.current = false;
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleFadeIn}
      layoutId={`media-${media.id}`}
      className="relative aspect-square overflow-hidden rounded-glass-sm bg-glass"
    >
      <Link
        href={`/media/${media.id}`}
        scroll={false}
        className="relative block h-full w-full [-webkit-touch-callout:none]"
        onClick={handleClick}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
      >
        <MediaThumbnail media={media} />
      </Link>
    </motion.div>
  );
}
