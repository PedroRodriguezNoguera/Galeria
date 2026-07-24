"use client";

import { motion, type Transition } from "framer-motion";

const LIMB_SAMPLES = 8;
const LIMB_TIMES = Array.from({ length: LIMB_SAMPLES + 1 }, (_, i) => i / LIMB_SAMPLES);
const LIMB_CYCLE: Transition = {
  duration: 0.34,
  repeat: Infinity,
  ease: "easeInOut",
  times: LIMB_TIMES,
};

/** Curva de vaivén muestreada: cada extremidad recibe su propia fase, nunca se mueven a la vez. */
function strideCurve(amplitude: number, center: number, phase: number): number[] {
  return LIMB_TIMES.map(
    (t) => Math.round((center + amplitude * Math.sin(2 * Math.PI * (t + phase))) * 10) / 10,
  );
}

interface RunningPersonProps {
  className?: string;
}

interface LegProps {
  x: number;
  y: number;
  hipRotate: number[];
  kneeRotate: number[];
  thighColor: string;
  shinColor: string;
}

/** Pierna con muslo, rodilla y pie articulados (no un simple palo). */
function Leg({ x, y, hipRotate, kneeRotate, thighColor, shinColor }: LegProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: hipRotate }} transition={LIMB_CYCLE}>
      <path
        d="M -1.7 0 C -1.8 1.3 -1.5 2.6 -1.1 3.9 L 1.1 3.9 C 1.5 2.6 1.8 1.3 1.7 0 Z"
        fill={thighColor}
      />
      {/* la rodilla nunca vuelve a 0: mantiene siempre un ángulo visible con el muslo */}
      <motion.g style={{ x: 0, y: 3.9 }} animate={{ rotate: kneeRotate }} transition={LIMB_CYCLE}>
        <circle cx="0" cy="0" r="0.85" fill={thighColor} />
        <path
          d="M -1 0 C -1.05 1.1 -0.9 2.2 -0.75 3.3 L 0.75 3.3 C 0.9 2.2 1.05 1.1 1 0 Z"
          fill={shinColor}
        />
        <ellipse cx="0" cy="3.7" rx="1.15" ry="0.7" fill="#111111" />
      </motion.g>
    </motion.g>
  );
}

interface ArmProps {
  x: number;
  y: number;
  shoulderRotate: number[];
  elbowRotate: number[];
  upperColor: string;
  foreColor: string;
}

/** Brazo levantado, hombro y codo articulados. Bien estirado: claramente supera la cabeza. */
function Arm({ x, y, shoulderRotate, elbowRotate, upperColor, foreColor }: ArmProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: shoulderRotate }} transition={LIMB_CYCLE}>
      <path
        d="M -1.3 0 C -1.4 1.7 -1.2 3.3 -1 5 L 1 5 C 1.2 3.3 1.4 1.7 1.3 0 Z"
        fill={upperColor}
      />
      <motion.g style={{ x: 0, y: 5 }} animate={{ rotate: elbowRotate }} transition={LIMB_CYCLE}>
        <circle cx="0" cy="0" r="0.7" fill={upperColor} />
        <path
          d="M -0.9 0 C -0.95 1.4 -0.8 2.8 -0.65 4.2 L 0.65 4.2 C 0.8 2.8 0.95 1.4 0.9 0 Z"
          fill={foreColor}
        />
        <circle cx="0" cy="4.2" r="0.95" fill={foreColor} />
      </motion.g>
    </motion.g>
  );
}

/**
 * Silueta con color y sombreado (nada de emojis): corre con los brazos en
 * alto, huyendo hacia la derecha. Brazos y piernas articulados, cada uno
 * con su propia fase (nunca se mueven todos a la vez).
 */
export function RunningPerson({ className }: RunningPersonProps) {
  return (
    <svg viewBox="0 -9 26 43" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="personShirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5aa4ff" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* piernas: alternancia bípeda, nunca sincronizadas */}
      <Leg
        x={10.5}
        y={19}
        hipRotate={strideCurve(26, -2, 0)}
        kneeRotate={strideCurve(20, 28, 0.12)}
        thighColor="#c98f61"
        shinColor="#b17c50"
      />
      <Leg
        x={14.5}
        y={19}
        hipRotate={strideCurve(26, -2, 0.5)}
        kneeRotate={strideCurve(20, 28, 0.62)}
        thighColor="#e8b48a"
        shinColor="#d29f6e"
      />

      {/* brazo trasero: se dibuja ANTES que el torso, así queda oculto tras él salvo cuando lo supera por arriba */}
      <Arm
        x={11.5}
        y={8.3}
        shoulderRotate={strideCurve(20, 178, 0)}
        elbowRotate={strideCurve(10, 12, 0.12)}
        upperColor="#c98f61"
        foreColor="#b17c50"
      />

      {/* torso / camiseta */}
      <rect
        x="8.5"
        y="8"
        width="8"
        height="13"
        rx="3.6"
        fill="url(#personShirt)"
        transform="rotate(-12 12.5 14.5)"
      />

      {/* brazo delantero: se pinta después del torso, siempre visible por delante */}
      <Arm
        x={15}
        y={8}
        shoulderRotate={strideCurve(20, 178, 0.5)}
        elbowRotate={strideCurve(10, 12, 0.62)}
        upperColor="#e8b48a"
        foreColor="#d29f6e"
      />

      {/* cabeza y pelo */}
      <circle cx="16" cy="6" r="3.6" fill="#e8b48a" />
      <path d="M12.6 5.2 C12.4 2 15 0.6 18 2 C19.2 2.6 19.4 4 19 5 Z" fill="#3b2413" />
    </svg>
  );
}
