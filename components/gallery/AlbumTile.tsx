"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { AlbumWithStats } from "@/types/album";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";
import { springGentle, springSnappy, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

interface AlbumTileProps {
  album: AlbumWithStats;
  expanded: boolean;
  onTap: () => void;
}

function peekUrl(cover: AlbumWithStats["covers"][number]) {
  return getPublicStorageUrl("media-thumbnails", cover.thumbnail_path);
}

// Cerrada: las fotos quedan totalmente recogidas dentro (nada asoma por
// encima de la solapa — por eso bajan hasta pasado su borde, y las de los
// lados también se acercan al centro y encogen), como guardadas de verdad.
// Abierta: se separan y asoman bastante más — el aspecto que ya tenía antes.
const FRONT_POS = { open: { top: "3%", scale: 1 }, closed: { top: "46%", scale: 0.9 } };
const MID_POS = { open: { top: "11%", left: "6%", scale: 1 }, closed: { top: "50%", left: "24%", scale: 0.68 } };
const BACK_POS = { open: { top: "13%", right: "6%", scale: 1 }, closed: { top: "52%", right: "24%", scale: 0.68 } };

// Relleno de la solapa: bastante más marcada cerrada (se nota que guarda las
// fotos dentro) y con un punto de gris, en vez de blanco puro, para que se
// distinga aún más de las fotos de detrás; bastante más suave y blanca
// abierta — el estado que ya se veía.
const FILL_TOP = { open: "rgba(255,255,255,0.38)", closed: "rgba(210,212,216,0.72)" };
const FILL_BOTTOM = { open: "rgba(255,255,255,0.62)", closed: "rgba(180,183,188,0.86)" };
// Borde en degradado, igual que el relleno (más claro arriba, más oscuro
// abajo): blanco brillante abierta (como ya se veía), gris cerrada — si no,
// un borde blanco liso desentonaba sobre el gris nuevo del relleno.
const BORDER_TOP = { open: "rgba(255,255,255,0.95)", closed: "rgba(205,207,211,0.95)" };
const BORDER_BOTTOM = { open: "rgba(255,255,255,0.7)", closed: "rgba(140,143,148,0.9)" };

/**
 * Silueta de carpeta a medio abrir, con 1-3 fotos reales de la propia carpeta
 * (las más recientes) asomando por arriba y tapadas desde abajo por la solapa
 * delantera — para que se distinga de un tile de foto normal a simple vista,
 * en vez de usar una sola miniatura como fondo. Cerrada/abierta son dos
 * estados animados (no dos componentes distintos): la posición de las fotos
 * y la opacidad de la solapa se interpolan con un resorte orgánico al pulsar.
 */
export function AlbumTile({ album, expanded, onTap }: AlbumTileProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const transition = prefersReducedMotion ? fadeTransition : springGentle;
  const state = expanded ? "open" : "closed";
  const [front, mid, back] = album.covers;

  return (
    <motion.button
      type="button"
      // No usa `variants` heredadas del padre (staggerChildren en AlbumsSection):
      // mezclar esa orquestación con el `animate` de objeto de abajo (variables
      // CSS del color de la solapa) hacía que framer-motion interpolara mal
      // ambas cosas a la vez. Se resuelve la entrada aquí mismo, en vez de con
      // la variante compartida `scaleFadeIn`.
      initial={{ opacity: 0, scale: 0.96 }}
      whileTap={{ scale: 0.96, transition: springSnappy }}
      animate={{
        opacity: 1,
        scale: 1,
        "--folder-fill-top": FILL_TOP[state],
        "--folder-fill-bottom": FILL_BOTTOM[state],
        "--folder-border-top": BORDER_TOP[state],
        "--folder-border-bottom": BORDER_BOTTOM[state],
      }}
      transition={transition}
      onClick={onTap}
      aria-pressed={expanded}
      aria-label={`Carpeta ${album.name}, ${album.memberCount} elemento${album.memberCount === 1 ? "" : "s"}`}
      className={cn(
        "relative aspect-square overflow-hidden rounded-glass-sm bg-glass",
        expanded && "ring-2 ring-foreground/70",
      )}
    >
      {back ? (
        <motion.div
          animate={BACK_POS[state]}
          transition={transition}
          className="absolute h-[34%] w-[34%] rotate-[16deg] overflow-hidden rounded-[3px] border border-white/50 shadow-sm"
        >
          <Image src={peekUrl(back)} alt="" fill sizes="120px" className="object-cover" />
        </motion.div>
      ) : null}

      {mid ? (
        <motion.div
          animate={MID_POS[state]}
          transition={transition}
          className="absolute h-[36%] w-[36%] -rotate-[14deg] overflow-hidden rounded-[3px] border border-white/50 shadow-sm"
        >
          <Image src={peekUrl(mid)} alt="" fill sizes="120px" className="object-cover" />
        </motion.div>
      ) : null}

      {front ? (
        <motion.div
          animate={FRONT_POS[state]}
          transition={transition}
          className="absolute left-1/2 h-[42%] w-[42%] -translate-x-1/2 overflow-hidden rounded-[3px] border border-white/60 shadow-md"
        >
          <Image src={peekUrl(front)} alt="" fill sizes="120px" className="object-cover" />
        </motion.div>
      ) : null}

      {/* Solapa delantera: tapa la parte inferior de las fotos que asoman, como una carpeta
          entreabierta. El degradado usa las variables --folder-fill-* del botón (arriba),
          así que la propia transición de color la anima framer-motion, no algo aparte. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full drop-shadow-[0_3px_8px_rgba(0,0,0,0.3)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`folder-fill-${album.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--folder-fill-top)" />
            <stop offset="100%" stopColor="var(--folder-fill-bottom)" />
          </linearGradient>
          <linearGradient id={`folder-border-${album.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--folder-border-top)" />
            <stop offset="100%" stopColor="var(--folder-border-bottom)" />
          </linearGradient>
        </defs>
        <path
          d="M6,44 L6,34 Q6,30 10,30 L36,30 Q40,30 42,34 L46,42 L92,42 Q96,42 96,46 L96,90 Q96,94 92,94 L10,94 Q6,94 6,90 Z"
          fill={`url(#folder-fill-${album.id})`}
          stroke={`url(#folder-border-${album.id})`}
          strokeWidth="2"
        />
      </svg>

      <div className="absolute inset-x-2 bottom-1.5 text-center">
        <span className="text-[12px] font-semibold leading-none text-foreground [text-shadow:0_1px_3px_rgba(0,0,0,0.2)]">
          {album.name}
        </span>
      </div>
    </motion.button>
  );
}
