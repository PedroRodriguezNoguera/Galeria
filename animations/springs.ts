import type { Transition } from "framer-motion";

/** Movimiento rápido y directo: taps, toggles, reacciones. */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

/**
 * Movimiento amplio con rebote orgánico visible: expansión de miniatura a visor.
 * damping/stiffness deliberadamente por debajo del crítico (~0.68 de ratio) para
 * que se note un pequeño overshoot físico, no un movimiento mecánico/lineal.
 */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 1,
};

/**
 * Iconos que se añaden (reacciones nuevas, elementos de un picker): pop con
 * rebote marcado (ratio ~0.49), como un pequeño resorte físico, no un fade plano.
 */
export const springPop: Transition = {
  type: "spring",
  stiffness: 480,
  damping: 18,
  mass: 0.7,
};

/** Pasar a la foto/vídeo siguiente o anterior arrastrando lateralmente. */
export const springSwipe: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.9,
};

/** Bottom sheets y paneles arrastrables. */
export const springSheet: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 32,
  mass: 1,
};

/** Sólo para prefers-reduced-motion: nunca mueve ni escala, sólo opacidad. */
export const fadeTransition: Transition = {
  duration: 0.18,
  ease: "easeOut",
};
