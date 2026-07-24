"use client";

import { useEffect, useState } from "react";
import { motion, type Transition, type Variants } from "framer-motion";

interface ChupinazoSceneProps {
  /** Posición horizontal (% del ancho de la cabecera) del lanzamiento — la fuente/balcón se dibujan ahí mismo. */
  launchLeftPercent: number;
  /** Posición horizontal (% del ancho de la cabecera) donde explota el cohete — pensada para caer junto a "¡Felices Fiestas!". */
  targetLeftPercent: number;
}

// ---------------------------------------------------------------------------
// Fuente de San Bernardo (Gea de Albarracín) + balcón: pila de piedra en cruz
// con un pilar central del que salen los caños, y encima un balcón con una
// persona que lanza el cohete. Ambos grupos entran animados (la fuente sube
// desde abajo, el balcón baja desde arriba) y se quedan montados mientras
// dura la escena — sólo el cohete y la explosión son la parte de "un solo
// disparo".
// ---------------------------------------------------------------------------

// Stagger generoso a propósito (antes 0.3s): la fuente y el balcón entraban
// casi a la vez y la escena se sentía "toda de golpe" — con más separación
// se nota que son dos entradas distintas, cada una con su propio momento.
const ASSEMBLE_STAGGER: Transition = { staggerChildren: 0.55 };
// Mismo rebote que en DiscoStage: damping por debajo del crítico para que
// cada pieza haga un pequeño overshoot físico al entrar.
const BOUNCE_SPRING: Transition = { type: "spring", stiffness: 300, damping: 14, mass: 0.9 };

const sceneContainerVariants: Variants = {
  hidden: {},
  visible: { transition: ASSEMBLE_STAGGER },
};
const fromBottomVariants: Variants = {
  hidden: { y: 26, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: BOUNCE_SPRING },
};
const fromTopVariants: Variants = {
  hidden: { y: -26, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: BOUNCE_SPRING },
};

const WATER_ARC: Transition = { duration: 1.1, repeat: Infinity, ease: "easeInOut" };
// Centro horizontal de la fuente. La primera vez que se movió a la
// izquierda (CX 22→12) el lienzo TAMBIÉN se ensanchó ese mismo tanto por la
// izquierda, así que la posición RELATIVA apenas cambiaba — no se notaba.
// Ahora CX baja más (hasta -3) y el lienzo se ensancha más de lo que baja
// CX, así que de verdad queda más a la izquierda y con mucha más separación
// del balcón (que sigue en x=34-68).
const FOUNTAIN_CX = -3;
// Altura de la que salen los caños: a media altura del fuste (que va de
// y=-19 a y=-42), no arriba del todo — antes salían del capitel (y=-46,
// justo bajo la estatua) y cayendo desde tan arriba se veía como si el agua
// saliera de la punta de la fuente en vez de a media altura.
const FOUNTAIN_SPOUT_Y = -29;

/** Dos caños de agua saliendo del pilar, con un ligero vaivén de opacidad/altura para sugerir el chorro sin animar cientos de gotas. */
function WaterSpouts() {
  return (
    <>
      {[-1, 1].map((side) => (
        <motion.path
          key={side}
          d={`M${FOUNTAIN_CX} ${FOUNTAIN_SPOUT_Y} C${FOUNTAIN_CX + side * 8} ${FOUNTAIN_SPOUT_Y + 2}, ${FOUNTAIN_CX + side * 12} ${FOUNTAIN_SPOUT_Y + 6}, ${FOUNTAIN_CX + side * 9} ${FOUNTAIN_SPOUT_Y + 11}`}
          stroke="#bfe3f0"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ ...WATER_ARC, delay: side === -1 ? 0 : 0.3 }}
        />
      ))}
    </>
  );
}

/**
 * Estatua de piedra sobre el capitel, en vez de una simple bola: una figura
 * envuelta en un manto (silueta acampanada, típica de una talla de santo),
 * con un brazo alzado en gesto de bendición y cabeza redondeada — apropiado
 * para una fuente dedicada a un santo. Misma piedra que el resto (stoneGrad),
 * con un pedestal pequeño que la asienta sobre el capitel.
 */
function FountainStatue() {
  const cx = FOUNTAIN_CX;
  return (
    <>
      {/* pedestal sobre el capitel */}
      <rect x={cx - 1.6} y="-46" width="3.2" height="1.3" rx="0.3" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.3" />
      {/* manto: silueta acampanada, más ancha abajo */}
      <path
        d={`M${cx - 2.3} -46 C${cx - 2.6} -48.5 ${cx - 1.6} -50.5 ${cx - 1} -52 L${cx + 1} -52 C${cx + 1.6} -50.5 ${cx + 2.3} -48.5 ${cx + 2.1} -46 Z`}
        fill="url(#stoneGrad)"
        stroke="#7a7264"
        strokeWidth="0.3"
      />
      {/* brazo alzado, gesto de bendición */}
      <path
        d={`M${cx + 1.4} -50.5 C${cx + 2.4} -51.2 ${cx + 2.7} -52.4 ${cx + 2.5} -53.6`}
        stroke="#948c7c"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
      />
      {/* cabeza */}
      <circle cx={cx} cy="-53.2" r="1.3" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.3" />
    </>
  );
}

/**
 * Pila en cruz + pilar central, aproximando la Fuente de San Bernardo.
 * Modelo revisado: el pilar ya no es un bloque uniforme, sino tramos
 * reconocibles (peana, fuste ligeramente cónico, capitel y una estatua de
 * piedra en la punta, ver FountainStatue), la pila tiene un reborde tallado
 * (una franja más clara en el canto superior) y una sombra de apoyo en el
 * suelo para que no "flote". Sube hasta cerca de y=-54.5 (antes hasta -33.4,
 * bastante más de un 50% más alta contando la estatua) — sigue quedando
 * margen hasta el balcón, que empieza en y=-58.
 */
function Fountain() {
  const cx = FOUNTAIN_CX;
  return (
    <motion.g variants={fromBottomVariants}>
      {/* sombra de apoyo */}
      <ellipse cx={cx} cy="-1" rx="19" ry="1.6" fill="#000" opacity="0.15" />
      {/* brazos laterales de la pila en cruz */}
      <rect x={cx - 21} y="-11" width="12" height="9" rx="1.4" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.4" />
      <rect x={cx + 9} y="-11" width="12" height="9" rx="1.4" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.4" />
      {/* cuerpo central de la pila */}
      <rect x={cx - 13} y="-14" width="26" height="12" rx="1.6" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.4" />
      {/* reborde tallado: franja más clara en el canto superior de la pila */}
      <rect x={cx - 13} y="-14" width="26" height="1.4" rx="0.7" fill="#ddd6c8" opacity="0.7" />
      {/* agua en la pila */}
      <ellipse cx={cx} cy="-7.4" rx="10" ry="2.1" fill="#8fc4dd" opacity="0.85" />
      {/* peana del pilar */}
      <rect x={cx - 5.5} y="-19" width="11" height="5" rx="1" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.35" />
      {/* fuste, ligeramente cónico en vez de un bloque recto */}
      <path d={`M${cx - 3} -19 L${cx + 3} -19 L${cx + 2} -42 L${cx - 2} -42 Z`} fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.35" />
      {/* capitel, remata el fuste bajo la estatua */}
      <rect x={cx - 4.5} y="-45" width="9" height="3" rx="0.8" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.35" />
      <FountainStatue />
      <WaterSpouts />
    </motion.g>
  );
}

const ARM_THROW: Transition = { duration: 0.35, ease: "easeOut" };

/**
 * Persona DE PIE SOBRE LA REPISA del balcón (repisa en y=-40, ver Balcony) —
 * antes estas coordenadas estaban pensadas para el suelo (cerca de y=0), así
 * que la persona aparecía debajo del balcón en vez de encima; todo el cuerpo
 * está ahora desplazado -43 en `y` para apoyarse justo en la repisa, con la
 * cabeza asomando por encima de la balaustrada (que remata en y=-46.6).
 */
function BalconyPerson({ throwing }: { throwing: boolean }) {
  return (
    <g transform="translate(50 0)">
      <circle cx="0" cy="-47.5" r="2.1" fill="#e8b98a" />
      <rect x="-2.2" y="-45.6" width="4.4" height="5.4" rx="1.6" fill="#3b6fa8" />
      <motion.path
        d="M1.6 -45 C2.6 -46 3.2 -47.2 3.4 -48.6"
        stroke="#e8b98a"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: throwing ? -55 : -10 }}
        transition={ARM_THROW}
      />
    </g>
  );
}

/** Balcón de piedra con balaustrada sencilla, colgado en lo alto de la escena. */
function Balcony({ throwing }: { throwing: boolean }) {
  return (
    <motion.g variants={fromTopVariants}>
      {/* muro tras el balcón */}
      <rect x="34" y="-58" width="34" height="20" fill="url(#wallGrad)" />
      {/* repisa: la persona se apoya justo en su borde superior (y=-40) */}
      <rect x="33" y="-40" width="36" height="3" rx="0.8" fill="url(#stoneGrad)" stroke="#7a7264" strokeWidth="0.4" />
      {/* balaustrada */}
      {[36, 40, 44, 48, 52, 56, 60, 64].map((x) => (
        <rect key={x} x={x} y="-46" width="1.6" height="6.2" fill="#c7c0b2" />
      ))}
      <rect x="34.5" y="-46.6" width="33" height="1.4" rx="0.6" fill="#c7c0b2" />
      <BalconyPerson throwing={throwing} />
    </motion.g>
  );
}

// Paleta "metalizada": cada partícula es un degradado radial (brillo claro en
// una esquina) en vez de un color plano, más un halo de `box-shadow` del
// mismo color — eso es lo que da el brillo/resplandor, no el color en sí.
// ---------------------------------------------------------------------------

// Paleta de colores VIVOS y saturados (nada de tonos metálicos apagados):
// rojo, naranja, amarillo dorado, verde, cian, azul, violeta y magenta.
const VIVID_COLORS = [
  "#ff3b30", // rojo
  "#ff9500", // naranja
  "#ffd60a", // amarillo dorado
  "#34d399", // verde esmeralda
  "#00e5ff", // cian eléctrico
  "#3b82f6", // azul vivo
  "#a855f7", // violeta
  "#ff2d9c", // magenta
];

interface SparkSpec {
  dx: number;
  dy: number;
  /** Cuánto más cae (sólo hacia abajo, se SUMA a `dy`) durante la fase lenta final, como si la gravedad tirara de ella después del estallido. */
  fallDistance: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  isStreak: boolean;
}

// Fracción de la duración en la que ocurre el estallido (rápido): el resto
// del tiempo (1 - BURST_PORTION) es la caída lenta. Un mismo `times` para
// x/y/opacity/scale, así que las cuatro pasan por su fase rápida y su fase
// lenta exactamente a la vez.
const BURST_PORTION = 0.2;
const BURST_TIMES = [0, BURST_PORTION, 1];

/**
 * Una chispa de la explosión: núcleo blanco que funde hacia el color vivo
 * (como una brasa incandescente, no un disco de color plano) más un halo de
 * `box-shadow` del mismo color — la combinación de las dos cosas es lo que
 * la hace leerse como brillante en vez de un simple punto de color.
 *
 * Movimiento en dos fases dentro de la MISMA animación (no dos animaciones
 * encadenadas): en el primer `BURST_PORTION` del tiempo sale disparada hasta
 * su posición de estallido (rápido); en el resto del tiempo, mucho más
 * largo, sigue cayendo despacio sólo hacia abajo (`fallDistance`, siempre
 * positivo, se sencilla porque ahí no importa el ángulo original: la
 * gravedad tira igual para todas). Se reutiliza tanto en el estallido
 * principal como en las subexplosiones.
 */
function FireworkSpark({ spec }: { spec: SparkSpec }) {
  const width = spec.isStreak ? spec.size * 0.4 : spec.size;
  const height = spec.isStreak ? spec.size * 1.9 : spec.size;
  const transition: Transition = {
    duration: spec.duration,
    delay: spec.delay,
    times: BURST_TIMES,
    ease: "easeOut",
  };
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width,
        height,
        background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${spec.color} 55%, ${spec.color} 100%)`,
        boxShadow: `0 0 ${spec.size * 1.4}px ${spec.size * 0.35}px ${spec.color}, 0 0 ${spec.size * 0.5}px #fff`,
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
      animate={{
        x: [0, spec.dx, spec.dx * 1.06],
        y: [0, spec.dy, spec.dy + spec.fallDistance],
        opacity: [0, 1, 0],
        scale: [0.3, 1.2, 0.5],
      }}
      transition={transition}
    />
  );
}

const MAIN_BURST_DURATION = 2.4; // más lenta que antes (1.8s) para dar tiempo a la fase de caída
const MAIN_PARTICLE_COUNT = 54; // muchas más partículas que antes (28)

/** Partículas del estallido principal: ángulos repartidos con jitter, distancia bastante mayor que antes (explosión más grande), tamaño variable y color vivo rotando por la paleta. */
const MAIN_PARTICLES: SparkSpec[] = Array.from({ length: MAIN_PARTICLE_COUNT }, (_, i) => {
  const angle = (i / MAIN_PARTICLE_COUNT) * Math.PI * 2 + (i % 2 === 0 ? 0.09 : -0.07);
  const distance = (24 + (i % 6) * 3.4) * 4.5;
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    fallDistance: 34 + (i % 5) * 9,
    color: VIVID_COLORS[i % VIVID_COLORS.length],
    size: 5 + (i % 3) * 1.6,
    delay: (i % 6) * 0.045,
    duration: MAIN_BURST_DURATION,
    isStreak: i % 4 === 0,
  };
});

interface SubBurstSpec {
  id: number;
  /** Centro de la subexplosión, desplazado respecto al punto de la explosión principal. */
  originX: number;
  originY: number;
  /** A qué tiempo (tras el estallido principal) revienta ESTA subexplosión — escalonadas para que no salten todas a la vez. */
  delay: number;
  count: number;
  distance: number;
}

// Siete subexplosiones más pequeñas (antes 3), cada una en un momento
// distinto y en un punto ligeramente desplazado — como el "crepitar"
// secundario de un cohete de verdad, escalonado en el tiempo en vez de
// saltar todo junto.
const SUB_BURSTS: SubBurstSpec[] = [
  { id: 0, originX: -20, originY: -14, delay: 0.4, count: 12, distance: 10 },
  { id: 1, originX: 22, originY: 6, delay: 0.7, count: 11, distance: 9 },
  { id: 2, originX: -6, originY: 18, delay: 1.0, count: 13, distance: 10.5 },
  { id: 3, originX: 15, originY: -20, delay: 1.35, count: 10, distance: 8.5 },
  { id: 4, originX: -26, originY: 8, delay: 1.7, count: 12, distance: 9.5 },
  { id: 5, originX: 7, originY: 24, delay: 2.05, count: 9, distance: 8 },
  { id: 6, originX: -12, originY: -22, delay: 2.4, count: 11, distance: 9 },
];

const SUB_BURST_DURATION = 1.3; // también con su fase lenta de caída, ver FireworkSpark

/** Una subexplosión pequeña: mismo mecanismo que el estallido principal (destello + chispas vivas y brillantes, con su misma fase de caída) pero más reducida y con su propio `delay`. */
function SubBurst({ spec }: { spec: SubBurstSpec }) {
  const particles: SparkSpec[] = Array.from({ length: spec.count }, (_, i) => {
    const angle = (i / spec.count) * Math.PI * 2 + (i % 2 === 0 ? 0.15 : -0.12);
    return {
      dx: Math.cos(angle) * spec.distance * 3.2,
      dy: Math.sin(angle) * spec.distance * 3.2,
      fallDistance: 16 + (i % 4) * 5,
      color: VIVID_COLORS[(i + spec.id * 3) % VIVID_COLORS.length],
      size: 4.5 + (i % 3),
      delay: spec.delay,
      duration: SUB_BURST_DURATION,
      isStreak: i % 3 === 0,
    };
  });

  return (
    <div className="absolute flex items-center justify-center" style={{ left: spec.originX, top: spec.originY }}>
      <motion.div
        className="absolute h-2 w-2 rounded-full bg-white"
        style={{ boxShadow: "0 0 6px 2px #fff" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2.2, opacity: [0, 1, 0] }}
        transition={{ duration: 0.4, delay: spec.delay, ease: "easeOut" }}
      />
      {particles.map((p, i) => (
        <FireworkSpark key={i} spec={p} />
      ))}
    </div>
  );
}

/**
 * Explosión del cohete: un destello central grande + ~54 chispas (ver
 * `FireworkSpark`: núcleo blanco fundiendo a color vivo + halo de
 * `box-shadow`, no discos de color plano) saliendo disparadas en todas
 * direcciones, más tres subexplosiones pequeñas que revientan en momentos
 * distintos (no todas a la vez). Se monta sólo cuando el cohete llega a su
 * destino (ver `ChupinazoScene`) — nada de `delay` largo dentro de una
 * animación que empiece visible desde el montaje, que es justo el bug que
 * ya nos encontramos con la salpicadura de los hielos en la cena patronal;
 * aquí cada chispa parte de `opacity: 0` explícito, así que un `delay`
 * (incluso largo, para escalonar las subexplosiones) es seguro.
 */
function FireworkBurst() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        className="absolute h-5 w-5 rounded-full bg-white"
        initial={{ scale: 0.3, opacity: 1 }}
        animate={{ scale: 5, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {MAIN_PARTICLES.map((p, i) => (
        <FireworkSpark key={i} spec={p} />
      ))}
      {SUB_BURSTS.map((spec) => (
        <SubBurst key={spec.id} spec={spec} />
      ))}
    </div>
  );
}

// Reparto de tiempos pensado para que la escena respire, no para que pase
// todo de golpe: primero un hueco largo tras montarse (para que se vea la
// fuente+balcón ya quietos), luego el brazo se levanta y SE QUEDA un rato
// en alto antes de soltar el cohete, y el vuelo en sí dura más que al
// principio. Cada fase tiene su propio momento en vez de encadenarse todo
// seguido.
const WIND_UP_AT_MS = 2200; // pausa de calma tras montarse, antes de que la persona empiece a prepararse
const LAUNCH_AT_MS = WIND_UP_AT_MS + 750; // el brazo se queda levantado un momento antes de soltar
const ROCKET_FLIGHT_DURATION_S = 1.1;
const EXPLODE_AT_MS = LAUNCH_AT_MS + ROCKET_FLIGHT_DURATION_S * 1000;

// Línea recta de verdad: `left` y `bottom` comparten exactamente la misma
// duración y easing (sin fotogramas intermedios como el arco de antes), así
// que avanzan siempre en la misma proporción entre sí — cualquier curva de
// easing distinta entre los dos, aunque fuera sutil, dibujaría un arco.
const ROCKET_TRANSITION: Transition = { duration: ROCKET_FLIGHT_DURATION_S, ease: "linear" };
// Altura a la que "aterriza" el cohete (coincide con la de la explosión, ver
// el div que envuelve <FireworkBurst /> en ChupinazoScene).
const ROCKET_TARGET_BOTTOM = "58px";

// Geometría de la escena fuente+balcón (viewBox "-28 -62 97 68" dentro de una
// caja fija de 92x64px) — hace falta para convertir la posición de la mano
// de la persona (en unidades del viewBox) a un `left`/`bottom` en píxeles
// reales, y así el cohete sale EXACTAMENTE de la mano en vez de un punto
// adivinado a ojo. La caja ya NO es cuadrada (se ensanchó a la izquierda
// para hacer sitio a la fuente, ahora en CX=-3), así que ancho y alto usan
// cada uno su propia escala de conversión.
const SCENE_BOX_WIDTH_PX = 92;
const SCENE_BOX_HEIGHT_PX = 64;
const SCENE_VIEWBOX_MIN_X = -28;
const SCENE_VIEWBOX_WIDTH = 97;
const SCENE_VIEWBOX_MAX_Y = 6;
const SCENE_VIEWBOX_HEIGHT = 68;
// Mano/hombro de la persona que lanza (ver BalconyPerson: `translate(50 0)`
// + el brazo, que sube hasta ~y=-47 en su versión levantada) — sin cambios,
// el balcón no se movió.
const PERSON_HAND_X = 53;
const PERSON_HAND_Y = -47;

/** Convierte el punto de la mano (coordenadas del viewBox de la escena) al `left`/`bottom` en CSS que le corresponde, anclado al mismo `launchLeftPercent` de la escena. */
function launchPointFrom(launchLeftPercent: number) {
  const leftPx = ((PERSON_HAND_X - SCENE_VIEWBOX_MIN_X) / SCENE_VIEWBOX_WIDTH) * SCENE_BOX_WIDTH_PX;
  const bottomPx = ((SCENE_VIEWBOX_MAX_Y - PERSON_HAND_Y) / SCENE_VIEWBOX_HEIGHT) * SCENE_BOX_HEIGHT_PX + 2; // +2px del propio bottom-0.5 de la escena
  return { left: `calc(${launchLeftPercent}% + ${leftPx.toFixed(1)}px)`, bottom: `${bottomPx.toFixed(1)}px` };
}

const FLAME_FLICKER: Transition = { duration: 0.16, repeat: Infinity, ease: "easeInOut" };

/**
 * Cohete TUMBADO (de lado, no en pie): apunta hacia la derecha (su dirección
 * de vuelo), con la llama saliendo por detrás (a la izquierda). Más pequeño
 * que la primera versión y centrado exactamente en el punto de la mano —
 * `-translate-x-1/2` para centrar en horizontal y `translate-y-1/2` (sin
 * signo negativo: el elemento usa `bottom`, no `top`, así que hay que
 * desplazarlo hacia ABAJO medio alto para que el centro quede en el punto,
 * no el borde inferior) para centrarlo en vertical.
 */
function Rocket({ from, toPercent }: { from: { left: string; bottom: string }; toPercent: number }) {
  return (
    <motion.div
      className="absolute"
      initial={{ left: from.left, bottom: from.bottom }}
      animate={{ left: `${toPercent}%`, bottom: ROCKET_TARGET_BOTTOM }}
      transition={ROCKET_TRANSITION}
    >
      <svg viewBox="-11 -4 22 8" className="h-2.5 w-6 -translate-x-1/2 translate-y-1/2" aria-hidden="true">
        {/* llama saliendo por detrás, dos lenguas parpadeando fuera de fase */}
        <motion.path
          d="M-6 0 L-11 -1.6 L-8 0 L-11 1.6 Z"
          fill="#fbbf24"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={FLAME_FLICKER}
        />
        <motion.path
          d="M-6 0 L-9.3 -0.9 L-7.3 0 L-9.3 0.9 Z"
          fill="#fde68a"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ ...FLAME_FLICKER, delay: 0.08 }}
        />
        {/* cuerpo, apuntando a la derecha */}
        <path d="M-6 -2.1 C-2 -2.5 3 -1.9 6 0 C3 1.9 -2 2.5 -6 2.1 Z" fill="#e2413a" stroke="#8f1f1a" strokeWidth="0.35" />
        {/* aletas traseras */}
        <path d="M-4.6 -1.9 L-7.8 -3.2 L-4 -1.4 Z" fill="#8f1f1a" />
        <path d="M-4.6 1.9 L-7.8 3.2 L-4 1.4 Z" fill="#8f1f1a" />
      </svg>
    </motion.div>
  );
}

type RocketPhase = "assembling" | "winding_up" | "flying" | "exploded";

/**
 * Escena completa del chupinazo: la fuente sube desde abajo y el balcón baja
 * desde arriba, con separación entre una entrada y otra (ver
 * ASSEMBLE_STAGGER); tras una pausa de calma, la persona levanta el brazo y
 * lo mantiene un momento antes de soltar el cohete, que vuela hasta el punto
 * indicado (pensado para caer a la altura de "¡Felices Fiestas!") y allí
 * estalla en una explosión de colores. El padre (HeaderChupinazoEvent)
 * decide cuánto dura toda la escena en pantalla, igual que en
 * DiscoStage/CenaPatronal — aquí sólo se coordina la secuencia interna.
 */
export function ChupinazoScene({ launchLeftPercent, targetLeftPercent }: ChupinazoSceneProps) {
  const [phase, setPhase] = useState<RocketPhase>("assembling");

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setPhase("winding_up"), WIND_UP_AT_MS),
      setTimeout(() => setPhase("flying"), LAUNCH_AT_MS),
      setTimeout(() => setPhase("exploded"), EXPLODE_AT_MS),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <>
      <motion.svg
        viewBox="-28 -62 97 68"
        fill="none"
        className="absolute bottom-0.5 h-16 w-[92px]"
        style={{ left: `${launchLeftPercent}%` }}
        aria-hidden="true"
        variants={sceneContainerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <defs>
          <linearGradient id="stoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9c2b4" />
            <stop offset="1" stopColor="#948c7c" />
          </linearGradient>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffab91" />
            <stop offset="1" stopColor="#f47a63" />
          </linearGradient>
        </defs>
        <Fountain />
        <Balcony throwing={phase === "winding_up" || phase === "flying" || phase === "exploded"} />
      </motion.svg>

      {phase === "flying" ? <Rocket from={launchPointFrom(launchLeftPercent)} toPercent={targetLeftPercent} /> : null}
      {phase === "exploded" ? (
        <div className="absolute bottom-[58px]" style={{ left: `${targetLeftPercent}%` }}>
          <FireworkBurst />
        </div>
      ) : null}
    </>
  );
}
