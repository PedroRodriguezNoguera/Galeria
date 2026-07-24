"use client";

import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";

interface CrateTruckProps {
  className?: string;
  /**
   * A partir de este retraso, el piloto trasero pasa a blanco fijo (marcha
   * atrás). Se maneja con un temporizador PROPIO en vez de recibir un
   * `reversing: boolean` del padre a propósito: si ese booleano viviera en el
   * mismo componente que anima la posición del camión, cada cambio
   * re-renderizaría también ese `motion.div` con un `animate` recién creado
   * en pleno vuelo, y Framer lo interpretaba como "empezar de cero" — el
   * camión se veía tele-transportado en vez de seguir su curva.
   */
  reverseDelayMs?: number;
}

const WHEEL_SPIN: Transition = { duration: 0.45, repeat: Infinity, ease: "linear" };
const BODY_BOUNCE: Transition = { duration: 0.3, repeat: Infinity, ease: "easeInOut" };
const HEADLIGHT_CYCLE: Transition = { duration: 1, repeat: Infinity, ease: "easeInOut" };
const TAILLIGHT_CYCLE: Transition = { duration: 1.1, repeat: Infinity, ease: "easeInOut" };
const SMOKE_BASE: Transition = { duration: 0.9, repeat: Infinity, ease: "easeOut" };

const SMOKE_PUFFS = [
  { cx: 2, cy: 24, r: 1.7, delay: 0 },
  { cx: -1.5, cy: 23, r: 1.4, delay: 0.16 },
  { cx: -5, cy: 24.5, r: 1.1, delay: 0.32 },
];

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <motion.g style={{ x: cx, y: cy }} animate={{ rotate: 360 }} transition={WHEEL_SPIN}>
      <circle r="5.4" fill="#0a0a0a" />
      <circle r="2.9" fill="#5a5a5a" />
      <circle r="1" fill="#0a0a0a" />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="0"
          y1="0"
          x2={Math.cos((deg * Math.PI) / 180) * 2.9}
          y2={Math.sin((deg * Math.PI) / 180) * 2.9}
          stroke="#8a8a8a"
          strokeWidth="0.6"
        />
      ))}
    </motion.g>
  );
}

/**
 * Camioneta utilitaria (sin nada de equipo de fiesta) con una barra de
 * empuje reforzada en el morro, pensada para arrastrar/empujar el cajón del
 * toro. Mirando a la derecha, igual que el resto de vehículos/criaturas —
 * al retroceder no se da la vuelta, simplemente invierte el sentido.
 */
export function CrateTruck({ className, reverseDelayMs }: CrateTruckProps) {
  const [reversing, setReversing] = useState(false);

  useEffect(() => {
    if (reverseDelayMs === undefined) return;
    const timeout = setTimeout(() => setReversing(true), reverseDelayMs);
    return () => clearTimeout(timeout);
  }, [reverseDelayMs]);

  return (
    <svg viewBox="0 -4 70 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="truckBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a3c" />
          <stop offset="1" stopColor="#5c3a24" />
        </linearGradient>
        <linearGradient id="truckWindshield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dcecf5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#96bed2" stopOpacity="0.72" />
        </linearGradient>
        <filter id="truckSmokeBlur" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* sombra de apoyo */}
      <ellipse cx="32" cy="26" rx="32" ry="2" fill="#000" opacity="0.18" />

      {/* rastro de humo del tubo de escape */}
      {SMOKE_PUFFS.map((p) => (
        <motion.circle
          key={p.cx}
          cx={p.cx}
          r={p.r}
          fill="#7a7a76"
          filter="url(#truckSmokeBlur)"
          initial={{ opacity: 0, cy: p.cy + 0.4 }}
          animate={{
            opacity: [0, 0.5, 0],
            cy: [p.cy + 0.4, p.cy - 3],
            cx: [p.cx, p.cx - 2.5],
            r: [p.r * 0.6, p.r * 1.6],
          }}
          transition={{ ...SMOKE_BASE, delay: p.delay }}
        />
      ))}

      <motion.g animate={{ y: [0, -0.5, 0] }} transition={BODY_BOUNCE}>
        <Wheel cx={20} cy={22} />
        <Wheel cx={52} cy={22} />

        {/* tubo de escape */}
        <rect x="1" y="19" width="3.5" height="1.8" rx="0.5" fill="#1a1a1a" />

        {/* piloto trasero: parpadeo rojo normalmente, blanco fijo al retroceder */}
        <motion.circle
          cx="4.5"
          cy="17"
          r="1.1"
          fill={reversing ? "#f5f5f0" : "#ff3b3b"}
          animate={reversing ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
          transition={reversing ? undefined : TAILLIGHT_CYCLE}
        />

        {/* caja trasera baja, donde se apoya la barra de empuje */}
        <rect x="4" y="14" width="16" height="8" rx="1" fill="url(#truckBody)" />

        {/* cabina + capó */}
        <path
          d="M20 22 L20 5.5 C20 4.2 21 3.2 22.4 3.2 L40 3.2
             C41.4 3.2 42.5 3.9 43.2 5 L47 12.5
             L58 12.5 C60.6 12.5 62.5 14.6 62.5 17.2 L62.5 21
             C62.5 21.8 61.7 22.5 60.9 22.5 Z"
          fill="url(#truckBody)"
        />
        {/* parabrisas */}
        <path d="M29 6.2 L40 6.2 C40.8 6.2 41.4 6.6 41.8 7.3 L45 12.5 L30.5 12.5 Z" fill="url(#truckWindshield)" />
        {/* piloto (conductor), silueta */}
        <circle cx="35.5" cy="9.4" r="2.3" fill="#141414" />
        <path d="M32 12.5 C32.8 10.6 34.5 9.6 35.5 9.6 C36.7 9.6 38.4 10.6 39 12.5 Z" fill="#141414" />

        {/* barra de empuje reforzada en el morro: dos barras + travesaño, a la altura del cajón */}
        <rect x="60" y="15" width="9" height="1.6" rx="0.6" fill="#2a2a2a" />
        <rect x="60" y="20" width="9" height="1.6" rx="0.6" fill="#2a2a2a" />
        <rect x="66.5" y="14" width="1.8" height="8.4" rx="0.6" fill="#2a2a2a" />

        {/* faro delantero */}
        <motion.circle
          cx="63"
          cy="17.5"
          r="1.6"
          fill="#fff4c2"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={HEADLIGHT_CYCLE}
        />
      </motion.g>
    </svg>
  );
}
