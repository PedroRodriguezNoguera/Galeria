"use client";

import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";

interface BullCrateProps {
  className?: string;
  /**
   * A partir de este retraso, la puerta se abre hacia arriba. Temporizador
   * propio en vez de un `doorOpen: boolean` del padre, por la misma razón
   * que `CrateTruck.reverseDelayMs`: aísla esta animación de los re-renders
   * de la escena completa.
   */
  openDelayMs?: number;
}

const DOOR_TRANSITION: Transition = { type: "spring", stiffness: 130, damping: 13 };

/**
 * Cajón de madera verde para transporte de toros: tablones verticales,
 * refuerzos metálicos en las esquinas, tejadillo y un par de rejillas de
 * ventilación. La puerta delantera (a la derecha, mismo lado por el que sale
 * el toro) tapa un hueco oscuro — al abrirse, gira hacia arriba desde una
 * bisagra en su borde superior, como el portón de un remolque de ganado.
 */
export function BullCrate({ className, openDelayMs }: BullCrateProps) {
  const [doorOpen, setDoorOpen] = useState(false);

  useEffect(() => {
    if (openDelayMs === undefined) return;
    const timeout = setTimeout(() => setDoorOpen(true), openDelayMs);
    return () => clearTimeout(timeout);
  }, [openDelayMs]);

  return (
    <svg viewBox="0 0 42 30" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="crateWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4c9a4c" />
          <stop offset="1" stopColor="#2e6b30" />
        </linearGradient>
        <linearGradient id="crateRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a7d3c" />
          <stop offset="1" stopColor="#245524" />
        </linearGradient>
      </defs>

      {/* sombra de apoyo */}
      <ellipse cx="21" cy="28.5" rx="19" ry="1.8" fill="#000" opacity="0.18" />

      {/* hueco oscuro tras la puerta: siempre presente, sólo se ve al abrirse */}
      <rect x="29.5" y="7" width="8" height="19" rx="1" fill="#0a0a0a" />

      {/* cuerpo del cajón */}
      <rect x="3" y="6" width="34" height="21" rx="1.4" fill="url(#crateWood)" stroke="#1e4a20" strokeWidth="0.5" />
      {/* tablones verticales */}
      {[9, 15, 21, 27].map((x) => (
        <line key={x} x1={x} y1="6.5" x2={x} y2="26.5" stroke="#1e4a20" strokeWidth="0.5" opacity="0.6" />
      ))}
      {/* listones horizontales (traviesas) */}
      <rect x="3.5" y="10" width="33" height="1.6" fill="#1e4a20" opacity="0.35" />
      <rect x="3.5" y="21" width="33" height="1.6" fill="#1e4a20" opacity="0.35" />

      {/* refuerzos metálicos en las esquinas */}
      {[
        [3, 6],
        [34, 6],
        [3, 23.5],
        [34, 23.5],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3.5" rx="0.5" fill="#4b4b4b" opacity="0.85" />
      ))}

      {/* rejillas de ventilación */}
      <circle cx="9" cy="14.5" r="1.1" fill="#0a0a0a" opacity="0.7" />
      <circle cx="15" cy="14.5" r="1.1" fill="#0a0a0a" opacity="0.7" />

      {/* aviso: triángulo de peligro, carga viva */}
      <g transform="translate(19.5 15)">
        <path d="M0 -3.2 L3 2.4 L-3 2.4 Z" fill="#fbbf24" stroke="#4a3400" strokeWidth="0.4" />
        <line x1="0" y1="-1.1" x2="0" y2="0.9" stroke="#2a1c00" strokeWidth="0.6" strokeLinecap="round" />
        <circle cx="0" cy="1.7" r="0.4" fill="#2a1c00" />
      </g>

      {/* tejadillo, ligeramente volado */}
      <rect x="1.5" y="3.5" width="38" height="3" rx="1" fill="url(#crateRoof)" />

      {/* puerta delantera: bisagra en la esquina superior (29.5, 7), gira hacia arriba y atrás */}
      <motion.g
        style={{ x: 29.5, y: 7 }}
        animate={{ rotate: doorOpen ? -108 : 0 }}
        transition={DOOR_TRANSITION}
      >
        <rect x="0" y="0" width="8" height="19" rx="1" fill="url(#crateWood)" stroke="#1e4a20" strokeWidth="0.5" />
        <line x1="2.7" y1="0.5" x2="2.7" y2="18.5" stroke="#1e4a20" strokeWidth="0.4" opacity="0.6" />
        <line x1="5.3" y1="0.5" x2="5.3" y2="18.5" stroke="#1e4a20" strokeWidth="0.4" opacity="0.6" />
        {/* bisagra y tirador */}
        <circle cx="0.6" cy="1" r="0.7" fill="#3a3a3a" />
        <circle cx="0.6" cy="18" r="0.7" fill="#3a3a3a" />
        <rect x="6" y="8.5" width="1.6" height="3" rx="0.4" fill="#3a3a3a" />
      </motion.g>
    </svg>
  );
}
