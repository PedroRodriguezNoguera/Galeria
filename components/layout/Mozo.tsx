"use client";

import { motion, type Transition } from "framer-motion";

interface MozoProps {
  className?: string;
  /** Color de la camiseta (cada corredor lleva un tono blanco/crudo ligeramente distinto, no todos idénticos). */
  shirtTone?: string;
  /**
   * Tropiezo dentro del propio encierro: un tirón hacia delante y una
   * recuperación, con `times` sincronizado a la duración TOTAL del cruce
   * (se le pasa desde fuera, ver EncierroPack) — no es un bucle propio, es un
   * único bache dentro de la misma animación de correr.
   */
  stumbleAtFraction?: number;
  crossingDurationSeconds?: number;
}

const LIMB_SAMPLES = 8;
const LIMB_TIMES = Array.from({ length: LIMB_SAMPLES + 1 }, (_, i) => i / LIMB_SAMPLES);
const LIMB_CYCLE: Transition = {
  duration: 0.3,
  repeat: Infinity,
  ease: "easeInOut",
  times: LIMB_TIMES,
};

/** Curva de vaivén muestreada: cada extremidad recibe su propia fase, nunca se mueven a la vez. */
function strideCurve(amplitude: number, center: number, phase: number): number[] {
  return LIMB_TIMES.map((t) => Math.round((center + amplitude * Math.sin(2 * Math.PI * (t + phase))) * 10) / 10);
}

interface LegProps {
  x: number;
  y: number;
  hipRotate: number[];
  kneeRotate: number[];
  thighColor: string;
  shinColor: string;
}

/** Pierna con muslo, rodilla y pie articulados. */
function Leg({ x, y, hipRotate, kneeRotate, thighColor, shinColor }: LegProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: hipRotate }} transition={LIMB_CYCLE}>
      <path d="M -1.7 0 C -1.8 1.3 -1.5 2.6 -1.1 3.9 L 1.1 3.9 C 1.5 2.6 1.8 1.3 1.7 0 Z" fill={thighColor} />
      <motion.g style={{ x: 0, y: 3.9 }} animate={{ rotate: kneeRotate }} transition={LIMB_CYCLE}>
        <circle cx="0" cy="0" r="0.85" fill={thighColor} />
        <path d="M -1 0 C -1.05 1.1 -0.9 2.2 -0.75 3.3 L 0.75 3.3 C 0.9 2.2 1.05 1.1 1 0 Z" fill={shinColor} />
        {/* alpargata blanca, no un pie desnudo */}
        <ellipse cx="0" cy="3.7" rx="1.2" ry="0.75" fill="#f2ede2" stroke="#c9c2b0" strokeWidth="0.2" />
      </motion.g>
    </motion.g>
  );
}

interface ArmProps {
  x: number;
  y: number;
  shoulderRotate: number[];
  elbowRotate: number[];
  skinColor: string;
  /** El brazo trasero lleva el periódico enrollado (detalle típico de mozo real); el delantero no. */
  carriesNewspaper?: boolean;
}

/** Brazo con hombro y codo articulados, en posición de carrera (no en alto huyendo, como RunningPerson). */
function Arm({ x, y, shoulderRotate, elbowRotate, skinColor, carriesNewspaper }: ArmProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: shoulderRotate }} transition={LIMB_CYCLE}>
      <path d="M -1.2 0 C -1.3 1.5 -1.1 3 -0.9 4.5 L 0.9 4.5 C 1.1 3 1.3 1.5 1.2 0 Z" fill={skinColor} />
      <motion.g style={{ x: 0, y: 4.5 }} animate={{ rotate: elbowRotate }} transition={LIMB_CYCLE}>
        <circle cx="0" cy="0" r="0.65" fill={skinColor} />
        <path d="M -0.85 0 C -0.9 1.3 -0.75 2.6 -0.6 3.9 L 0.6 3.9 C 0.75 2.6 0.9 1.3 0.85 0 Z" fill={skinColor} />
        <circle cx="0" cy="3.9" r="0.85" fill={skinColor} />
        {carriesNewspaper ? (
          <rect x="-0.55" y="0.5" width="1.1" height="4.2" rx="0.5" fill="#e8e1cd" stroke="#b5ac93" strokeWidth="0.2" />
        ) : null}
      </motion.g>
    </motion.g>
  );
}

// Caída real (no un simple traspié): gira casi 90° hacia el suelo, se
// recupera, y de paso se desplaza hacia ATRÁS (x negativo) lo suficiente
// para acabar detrás de los otros dos mozos — a diferencia de rotate/y (que
// vuelven a 0, de pie otra vez), el último valor de `x` NO vuelve a 0: se
// queda desplazado el resto de la carrera, ya en última posición.
const FALL_ROTATE = [0, 0, 82, 98, 18, 0];
const FALL_Y = [0, 0, 4, 4.6, 0.8, 0];
const FALL_X = [0, 0, -9, -21, -30, -30];

/**
 * Mozo estilizado (nada de emojis) corriendo el encierro: camiseta blanca,
 * pañuelico y faja rojos, alpargatas, y el clásico periódico enrollado en el
 * brazo trasero. Piernas y brazos articulados con fase propia, igual que
 * RunningPerson — pero con la vestimenta y la postura de un mozo de verdad,
 * no huyendo con los brazos en alto.
 *
 * Si `stumbleAtFraction` está definido, todo el cuerpo (no sólo las
 * piernas) se cae de verdad — un giro brusco hacia el suelo y una
 * recuperación, situado en ese punto exacto de la carrera — y de la caída
 * sale desplazado hacia atrás, pasando a última posición (el desplazamiento
 * en `x` no se deshace, se queda).
 */
export function Mozo({ className, shirtTone = "#f5f1e6", stumbleAtFraction, crossingDurationSeconds = 5 }: MozoProps) {
  const bodyWrapperProps =
    stumbleAtFraction !== undefined
      ? {
          animate: { rotate: FALL_ROTATE, y: FALL_Y, x: FALL_X },
          transition: {
            duration: crossingDurationSeconds,
            // Toda la caída (tirón, suelo, recuperación) cabe en una ventana
            // CORTA (0.13 de la duración total) a partir de `stumbleAtFraction`
            // — antes esa ventana era casi el doble (0.19) y, como el grupo
            // sigue avanzando todo el rato con `easeInOut`, para cuando
            // terminaba de levantarse ya casi había cruzado toda la cabecera.
            // Estrechándola, la caída entera queda centrada de verdad en el
            // punto que se le pida (ver STUMBLE_AT_FRACTION en
            // HeaderEncierroEvent, calculado para que el CENTRO de esta
            // ventana caiga a mitad de cabecera, no sólo el arranque).
            times: [0, stumbleAtFraction, stumbleAtFraction + 0.03, stumbleAtFraction + 0.075, stumbleAtFraction + 0.13, 1],
            ease: "easeOut" as const,
          },
        }
      : {};

  return (
    <motion.svg viewBox="0 -9 26 43" fill="none" className={className} aria-hidden="true" {...bodyWrapperProps}>
        {/* pierna trasera */}
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

        {/* brazo trasero, con el periódico — se dibuja antes que el torso para que quede oculto tras él salvo cuando lo supera */}
        <Arm
          x={11.5}
          y={8.3}
          shoulderRotate={strideCurve(24, 170, 0)}
          elbowRotate={strideCurve(16, 20, 0.12)}
          skinColor="#c98f61"
          carriesNewspaper
        />

        {/* faja roja a la cintura */}
        <rect x="8.2" y="17.6" width="8.4" height="2.4" rx="1" fill="#c0272d" transform="rotate(-12 12.5 18.8)" />
        {/* torso / camiseta blanca */}
        <rect x="8.5" y="8" width="8" height="12.4" rx="3.4" fill={shirtTone} stroke="#d9d2bf" strokeWidth="0.3" transform="rotate(-12 12.5 14.5)" />

        {/* brazo delantero */}
        <Arm
          x={15}
          y={8}
          shoulderRotate={strideCurve(24, 170, 0.5)}
          elbowRotate={strideCurve(16, 20, 0.62)}
          skinColor="#e8b48a"
        />

        {/* pañuelico rojo al cuello, con nudo */}
        <path d="M13.4 7 L18.2 5.6 L16.6 9.4 Z" fill="#c0272d" />
        <circle cx="15.2" cy="6.7" r="1" fill="#a3181d" />

        {/* cabeza y pelo */}
        <circle cx="16" cy="6" r="3.6" fill="#e8b48a" />
        <path d="M12.6 5.2 C12.4 2 15 0.6 18 2 C19.2 2.6 19.4 4 19 5 Z" fill="#3b2413" />
    </motion.svg>
  );
}
