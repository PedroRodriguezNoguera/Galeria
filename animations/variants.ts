import type { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleFadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

/** Para iconos que "aparecen": arranca mucho más pequeño, pensado para ir con springPop. */
export const iconPop: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: { opacity: 1, scale: 1 },
};

export const slideUpSheet: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
};

/** Carrusel horizontal del visor: entra/sale por el lado que corresponda al gesto. */
export const slideHorizontal: Variants = {
  enter: (direction: "next" | "prev") => ({
    x: direction === "next" ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: "next" | "prev") => ({
    x: direction === "next" ? "-100%" : "100%",
    opacity: 0,
  }),
};

export const scrimFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};
