"use client";

import type { ReactNode } from "react";
import { motion, useTransform, type Transition } from "framer-motion";
import { useCenaPatronalPhysics, type PieceMotion } from "@/hooks/useCenaPatronalPhysics";
import { CUP_HEIGHT, CUP_POCKET_DEPTH, ICE_SIZE } from "@/lib/physics/cenaPatronalWorld";

interface CenaPatronalSceneProps {
  className?: string;
}

const FADE_IN: Transition = { duration: 0.15 };

// ---------------------------------------------------------------------------
// Piezas: cada una se dibuja en coordenadas LOCALES (0,0 = centro del cuerpo
// físico que le corresponde en cenaPatronalWorld.ts) y el `motion.g` que la
// envuelve traduce/rota según la simulación en marcha (`useCenaPatronalPhysics`).
// Nada de posiciones absolutas ni de rebotes/giros inventados a mano: lo único
// "de mentira" es el pequeño aplastado (`scaleY`) que dispara el propio hook
// al detectar la colisión de aterrizaje — un toque de acabado ("juice") sobre
// el movimiento real, no un sustituto de él.
// ---------------------------------------------------------------------------

function Pot() {
  return (
    <>
      <path d="M-18 -3 C-21 -3 -21 1 -18 1" stroke="#5c6368" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M18 -3 C21 -3 21 1 18 1" stroke="#5c6368" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="-14" y="-6.5" width="28" height="13" rx="2" fill="url(#potGrad)" stroke="#5c6368" strokeWidth="0.5" />
      <rect x="-15.5" y="-8" width="31" height="2" rx="1" fill="#c3c9cd" stroke="#5c6368" strokeWidth="0.4" />
      <path d="M-10 -6 L-10 4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
    </>
  );
}

function Lid() {
  return (
    <>
      <path d="M-16 2 A16 9 0 0 1 16 2 Z" fill="url(#lidGrad)" stroke="#5c6368" strokeWidth="0.5" />
      <ellipse cx="0" cy="2" rx="16" ry="3" fill="url(#lidGrad)" stroke="#5c6368" strokeWidth="0.5" />
      <rect x="-2" y="-10" width="4" height="4" rx="1" fill="#5c6368" />
      <circle cx="0" cy="-12" r="2.4" fill="#7d8489" stroke="#5c6368" strokeWidth="0.4" />
    </>
  );
}

const STEAM_RISE: Transition = { duration: 1.8, repeat: Infinity, ease: "easeInOut" };

/** Tres hilos de vapor, escalonados para que no suban a la vez. Gris (no blanco) y nunca del todo transparente: sobre el cristal claro de la cabecera, el vapor blanco puro se fundía con el fondo. */
function Steam() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${-3 + i * 3} -1 C${-5 + i * 3} -5, ${-1 + i * 3} -7, ${-3 + i * 3} -13`}
          stroke="#8b93a1"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          initial={{ opacity: 0.2, y: 5 }}
          animate={{ opacity: [0.2, 0.85, 0.2], y: [5, -3, -8] }}
          transition={{ ...STEAM_RISE, delay: i * 0.55 }}
        />
      ))}
    </>
  );
}

/**
 * Guarnición de la sopa: dos trozos de zanahoria, un trozo de patata, fideos
 * finos, perejil picado, un brillo de superficie y una onda sutil — para que
 * deje de ser un círculo de color plano y se lea como un caldo de verdad.
 */
function SoupGarnish() {
  return (
    <>
      {/* onda muy sutil, apenas un cerco más claro */}
      <ellipse cx="0" cy="0.2" rx="7.5" ry="1.9" fill="none" stroke="#f0a15c" strokeWidth="0.35" opacity="0.3" />
      {/* trozos de zanahoria */}
      <rect x="-5.8" y="-1.2" width="2.6" height="1.8" rx="0.5" fill="#e8952f" stroke="#b96e1c" strokeWidth="0.2" transform="rotate(-18 -4.5 -0.3)" />
      <rect x="3.2" y="0.4" width="2.3" height="1.6" rx="0.5" fill="#e8952f" stroke="#b96e1c" strokeWidth="0.2" transform="rotate(14 4.3 1.2)" />
      {/* trozo de patata */}
      <ellipse cx="-0.5" cy="1.6" rx="1.7" ry="1.2" fill="#ecdcb0" stroke="#c9b483" strokeWidth="0.2" />
      {/* fideos finos */}
      <path d="M-3 -1.8 C-2 -1.2 -1.2 -1.9 -0.2 -1.3" stroke="#f2d98a" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      <path d="M0.5 -2.1 C1.5 -1.5 2.2 -2.2 3.1 -1.6" stroke="#f2d98a" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      {/* perejil picado */}
      <circle cx="-2" cy="0.6" r="0.35" fill="#4a7a3a" />
      <circle cx="-1.2" cy="1" r="0.3" fill="#588a45" />
      <circle cx="-1.8" cy="1.3" r="0.32" fill="#4a7a3a" />
      {/* brillo de superficie */}
      <path d="M-6 -1.4 A9 2.4 0 0 1 -1 -2.5" stroke="#ffd9a8" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.45" />
    </>
  );
}

function SoupBowl() {
  return (
    <>
      <ellipse cx="0" cy="1" rx="15" ry="4" fill="url(#plateGrad)" stroke="#c7c7c7" strokeWidth="0.5" />
      <ellipse cx="0" cy="0.2" rx="10.5" ry="2.6" fill="url(#soupGrad)" />
      <SoupGarnish />
      <Steam />
    </>
  );
}

const cupHalfTop = 8;
const cupHalfBottom = 5;
const cupTopY = -CUP_HEIGHT / 2;
const cupBottomY = CUP_HEIGHT / 2;
// Altura real del hueco físico por el que caen los hielos (ver
// cenaPatronalWorld.ts) menos un pelín, para que la bebida se vea justo por
// debajo de esa línea en vez de exactamente sobre ella (como si los hielos
// quedaran algo sumergidos, no apoyados en seco).
const liquidSurfaceY = cupTopY + CUP_POCKET_DEPTH - 1.5;

/**
 * Vaso de plástico rojo OPACO (nada de transparencias): el rojo es el propio
 * plástico, no el líquido. Dentro se ve la bebida (ámbar, no roja, para que
 * no se confunda con el vaso) justo por debajo del borde blanco, y los
 * hielos (piezas físicas aparte) caen encima de esa superficie.
 */
function Cup() {
  return (
    <>
      <path
        d={`M${-cupHalfTop} ${cupTopY} L${cupHalfTop} ${cupTopY} L${cupHalfBottom} ${cupBottomY} L${-cupHalfBottom} ${cupBottomY} Z`}
        fill="url(#cupGrad)"
        stroke="#8a1717"
        strokeWidth="0.4"
      />
      {/* brillo lateral fino: sugiere plástico, no cristal — una sola tira, no un tinte general */}
      <path d={`M${-cupHalfTop + 2.2} ${cupTopY + 2} L${-cupHalfBottom + 1.4} ${cupBottomY - 2}`} stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.22" />
      {/* bebida: superficie ámbar, opaca, a la altura real del hueco físico por el que caen los hielos (CUP_POCKET_DEPTH), con una línea de espuma clara arriba */}
      <ellipse cx="0" cy={liquidSurfaceY} rx={cupHalfTop - 1.5} ry="1.8" fill="url(#drinkGrad)" />
      <path d={`M${-cupHalfTop + 2} ${liquidSurfaceY - 0.9} A${cupHalfTop - 1.5} 1.8 0 0 1 ${cupHalfTop - 2} ${liquidSurfaceY - 0.9}`} stroke="#ffe8b8" strokeWidth="0.5" fill="none" opacity="0.6" />
      {/* borde superior blanco, típico del vaso de fiesta */}
      <rect x={-cupHalfTop} y={cupTopY - 0.4} width={cupHalfTop * 2} height="2.2" rx="1" fill="#fff" stroke="#c9c9c9" strokeWidth="0.3" />
    </>
  );
}

function IceCube({ size }: { size: number }) {
  const half = size / 2;
  return (
    <>
      <rect
        x={-half}
        y={-half}
        width={size}
        height={size}
        rx={size * 0.18}
        fill="url(#iceGrad)"
        stroke="#a9d4e6"
        strokeWidth="0.35"
        opacity="0.92"
      />
      {/* dos facetas internas + un brillo, para que se lea como hielo y no como un cuadrado azul */}
      <path d={`M${-half * 0.5} ${-half * 0.6} L${half * 0.15} ${half * 0.05}`} stroke="#fff" strokeWidth="0.4" strokeLinecap="round" opacity="0.55" />
      <path d={`M${-half * 0.1} ${-half * 0.7} L${half * 0.55} ${half * 0.35}`} stroke="#8fbdd1" strokeWidth="0.35" strokeLinecap="round" opacity="0.5" />
      <path d={`M${-half * 0.5} ${-half * 0.55} L${-half * 0.1} ${-half * 0.55}`} stroke="#fff" strokeWidth="0.55" strokeLinecap="round" opacity="0.85" />
    </>
  );
}

const SPLASH_TRANSITION: Transition = { duration: 0.5, ease: "easeOut" };

/** Salpicadura puntual (no ligada a ningún cuerpo físico): se dibuja una vez, en el punto exacto donde la física detectó el impacto del hielo. */
function Splash({ x, y }: { x: number; y: number }) {
  return (
    <>
      <motion.ellipse
        cx={x}
        cy={y + 1.5}
        rx="1.3"
        ry="0.8"
        fill="none"
        stroke="#a9d4e6"
        strokeWidth="0.6"
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={SPLASH_TRANSITION}
      />
      {[-1.6, -0.8, 0, 0.8, 1.6].map((dir) => (
        <motion.path
          key={dir}
          d={`M${x + dir * 1.2} ${y} L${x + dir * 2.6} ${y - 5 + Math.abs(dir) * 0.8}`}
          stroke="#bfe3f0"
          strokeWidth="0.75"
          strokeLinecap="round"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -2 }}
          transition={{ ...SPLASH_TRANSITION, delay: Math.abs(dir) * 0.03 }}
        />
      ))}
    </>
  );
}

/** Envuelve una pieza con su transform físico (x/y/rotate/scaleY) + un breve fade de opacidad al aparecer. */
function PhysicsPiece({ motion: m, children }: { motion: PieceMotion; children: ReactNode }) {
  return (
    <motion.g
      style={{ x: m.x, y: m.y, rotate: m.rotate, scaleY: m.scaleY }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={FADE_IN}
    >
      {children}
    </motion.g>
  );
}

/**
 * Escena de la cena patronal, gobernada por un mundo físico real
 * (`useCenaPatronalPhysics` + `lib/physics/cenaPatronalWorld.ts`): cae la
 * cacerola, luego la tapa (choca de verdad contra ella, rebota y su giro se
 * frena por fricción angular, no por un keyframe), un plato de sopa humeante,
 * un vaso ancho y opaco con su bebida dentro, y por último dos hielos que
 * caen y salpican al tocar el vaso.
 */
export function CenaPatronalScene({ className }: CenaPatronalSceneProps) {
  const { pieces, releasedPieces, splashes } = useCenaPatronalPhysics();

  // La parte de un hielo que queda "dentro" del vaso (por debajo de la línea
  // de la bebida) no debe verse, como si el propio vaso la tapara — de ahí
  // este recorte, que sigue al vaso cada frame (mismo motivo que el hueco
  // físico: el vaso puede posarse en cualquier `y`, no es un valor fijo).
  const iceClipRectHeight = useTransform(pieces.cup.y, (cupY) => cupY + liquidSurfaceY + 1000);

  return (
    <motion.svg
      viewBox="0 -36 115 44"
      fill="none"
      className={className}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE_IN}
    >
      <defs>
        <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7dde1" />
          <stop offset="1" stopColor="#7d8489" />
        </linearGradient>
        <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e9ec" />
          <stop offset="1" stopColor="#9aa1a6" />
        </linearGradient>
        <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dcdcdc" />
        </linearGradient>
        <radialGradient id="soupGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f3934a" />
          <stop offset="60%" stopColor="#d97328" />
          <stop offset="100%" stopColor="#a4491a" />
        </radialGradient>
        <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#a91d1d" />
        </linearGradient>
        <linearGradient id="drinkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2b23c" />
          <stop offset="1" stopColor="#c07e14" />
        </linearGradient>
        <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7f6fb" />
          <stop offset="1" stopColor="#bfe3f0" />
        </linearGradient>
        {/* recorta los hielos justo en la línea de la bebida: lo que quedaría "dentro" del vaso no se dibuja */}
        <clipPath id="cupOpeningClip" clipPathUnits="userSpaceOnUse">
          <motion.rect x="-20" y="-1000" width="160" height={iceClipRectHeight} />
        </clipPath>
      </defs>

      {releasedPieces.pot ? (
        <PhysicsPiece motion={pieces.pot}>
          <Pot />
        </PhysicsPiece>
      ) : null}

      {releasedPieces.lid ? (
        <PhysicsPiece motion={pieces.lid}>
          <Lid />
        </PhysicsPiece>
      ) : null}

      {releasedPieces.plate ? (
        <PhysicsPiece motion={pieces.plate}>
          <SoupBowl />
        </PhysicsPiece>
      ) : null}

      {releasedPieces.cup ? (
        <PhysicsPiece motion={pieces.cup}>
          <Cup />
        </PhysicsPiece>
      ) : null}

      <g clipPath="url(#cupOpeningClip)">
        {releasedPieces.ice1 ? (
          <PhysicsPiece motion={pieces.ice1}>
            <IceCube size={ICE_SIZE} />
          </PhysicsPiece>
        ) : null}
        {splashes.ice1 ? <Splash x={splashes.ice1.x} y={splashes.ice1.y} /> : null}

        {releasedPieces.ice2 ? (
          <PhysicsPiece motion={pieces.ice2}>
            <IceCube size={ICE_SIZE - 0.5} />
          </PhysicsPiece>
        ) : null}
        {splashes.ice2 ? <Splash x={splashes.ice2.x} y={splashes.ice2.y} /> : null}
      </g>
    </motion.svg>
  );
}
