"use client";

import { motion, type Transition } from "framer-motion";

interface RunningBullProps {
  className?: string;
  /**
   * "embolado": bola de fuego encendida en la punta de cada cuerno (toros
   * embolados). "cabestro": el buey manso que guía a los toros en el
   * encierro — capa clara en vez de negra, y un cencerro colgando del cuello.
   */
  variant?: "normal" | "embolado" | "cabestro";
}

const LEG_SAMPLES = 8;
const LEG_TIMES = Array.from({ length: LEG_SAMPLES + 1 }, (_, i) => i / LEG_SAMPLES);
const LEG_CYCLE: Transition = {
  duration: 0.55,
  repeat: Infinity,
  ease: "easeInOut",
  times: LEG_TIMES,
};

/** Curva de vaivén muestreada (nunca las 4 patas van en el mismo punto del ciclo). */
function strideCurve(amplitude: number, center: number, phase: number): number[] {
  return LEG_TIMES.map(
    (t) => Math.round((center + amplitude * Math.sin(2 * Math.PI * (t + phase))) * 10) / 10,
  );
}

const BODY_CYCLE: Transition = { duration: 0.3, repeat: Infinity, ease: "easeInOut" };
const DUST_BASE: Transition = { duration: 0.85, repeat: Infinity, ease: "easeOut" };
const TAIL_BASE_CYCLE: Transition = {
  duration: 0.5,
  repeat: Infinity,
  ease: "easeInOut",
  times: [0, 0.35, 0.75, 1],
};
const TAIL_TIP_CYCLE: Transition = {
  duration: 0.5,
  repeat: Infinity,
  ease: "easeInOut",
  times: [0, 0.45, 0.8, 1],
};

const FIRE_FLICKER_CYCLE: Transition = {
  duration: 0.45,
  repeat: Infinity,
  ease: "easeInOut",
  times: [0, 0.3, 0.6, 1],
};

/** Lengua de llama puntiaguda, reutilizada varias veces por bola para dar textura (no un blob liso). */
const FLAME_TONGUE_PATH =
  "M0,0 C 0.8,-0.5 1.1,-1.5 0.7,-2.6 C 0.5,-3.3 0.2,-3.8 0,-4.4 C -0.2,-3.8 -0.5,-3.3 -0.7,-2.6 C -1.1,-1.5 -0.8,-0.5 0,0 Z";

interface FlameTongueSpec {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  color: string;
  delay: number;
}

const FLAME_TONGUES: FlameTongueSpec[] = [
  { x: 0, y: 0.5, scale: 1.5, rotate: -5, color: "#ff7a1a", delay: 0 },
  { x: -0.75, y: 0.7, scale: 1.05, rotate: -20, color: "#ffa233", delay: 0.09 },
  { x: 0.7, y: 0.7, scale: 1, rotate: 16, color: "#ff9226", delay: 0.17 },
  { x: 0, y: 0.35, scale: 0.62, rotate: 3, color: "#fff2b8", delay: 0.05 },
];

interface FireballProps {
  cx: number;
  cy: number;
  delay: number;
}

/**
 * Bola de fuego en la punta de un cuerno: halo difuminado, lenguas de llama en
 * capas (con flicker independiente entre sí, para que se lea con textura y no
 * como un blob liso), un núcleo brillante, chispas y humo ascendiendo.
 */
function Fireball({ cx, cy, delay }: FireballProps) {
  return (
    <motion.g
      style={{ x: cx, y: cy }}
      animate={{ scale: [1, 1.1, 0.96, 1], rotate: [-3, 2, -1, -3] }}
      transition={{ ...FIRE_FLICKER_CYCLE, delay }}
    >
      <circle r="3.8" fill="url(#fireGlow)" filter="url(#fireBlur)" />

      {FLAME_TONGUES.map((tongue, index) => (
        <motion.path
          key={index}
          d={FLAME_TONGUE_PATH}
          fill={tongue.color}
          style={{ x: tongue.x, y: tongue.y }}
          animate={{
            scale: [tongue.scale, tongue.scale * 1.12, tongue.scale * 0.9, tongue.scale],
            rotate: [tongue.rotate - 4, tongue.rotate + 5, tongue.rotate - 3, tongue.rotate - 4],
          }}
          transition={{ ...FIRE_FLICKER_CYCLE, delay: delay + tongue.delay }}
        />
      ))}

      <circle cy="-0.5" r="1.4" fill="url(#fireCore)" opacity="0.9" />

      {/* humo ascendiendo desde la punta de la llama */}
      {[0, 0.6, 1.2].map((puffDelay, index) => (
        <motion.circle
          key={index}
          r="1.1"
          fill="#5c5c57"
          filter="url(#smokeBlur)"
          initial={{ opacity: 0, cx: index % 2 === 0 ? -0.3 : 0.4, cy: -3 }}
          animate={{
            opacity: [0, 0.68, 0],
            cx: [index % 2 === 0 ? -0.3 : 0.4, index % 2 === 0 ? -1.6 : 1.8],
            cy: [-3, -10.5],
            r: [1.1, 3.2],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
            delay: delay + puffDelay,
          }}
        />
      ))}

      <motion.circle
        r="0.34"
        fill="#ffd27a"
        initial={{ opacity: 0, cx: -0.8, cy: 0.4 }}
        animate={{ opacity: [0, 0.9, 0], cx: [-0.8, -1.3], cy: [0.4, -3.2] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut", delay: delay + 0.15 }}
      />
      <motion.circle
        r="0.28"
        fill="#ffb347"
        initial={{ opacity: 0, cx: 0.9, cy: 0.3 }}
        animate={{ opacity: [0, 0.85, 0], cx: [0.9, 1.3], cy: [0.3, -2.8] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut", delay: delay + 0.45 }}
      />
    </motion.g>
  );
}

const DUST_PUFFS = [
  { cx: -2, cy: 29, r: 3.6, delay: 0 },
  { cx: -7, cy: 30.5, r: 3.1, delay: 0.16 },
  { cx: -12, cy: 28.5, r: 2.6, delay: 0.32 },
  { cx: -16.5, cy: 30, r: 2, delay: 0.48 },
];

const BELL_SWING: Transition = { duration: 0.42, repeat: Infinity, ease: "easeInOut" };

/** Cencerro del cabestro: correa de cuero + campana metálica con badajo, balanceándose al trote (no fijo). */
function CowBell({ x, y }: { x: number; y: number }) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: [-9, 11, -9] }} transition={BELL_SWING}>
      <path d="M0 -2.4 L0 0.6" stroke="#5c4326" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M-1.7 0.6 L1.7 0.6 L2.1 3.6 C2.1 4.5 -2.1 4.5 -2.1 3.6 Z" fill="url(#bellMetal)" stroke="#3a3a3a" strokeWidth="0.25" />
      <line x1="-1.4" y1="1.5" x2="1.4" y2="1.5" stroke="#3a3a3a" strokeWidth="0.2" opacity="0.5" />
      <circle cx="0" cy="4.1" r="0.55" fill="#2a2a2a" />
    </motion.g>
  );
}

interface LegProps {
  x: number;
  y: number;
  hipRotate: number[];
  kneeRotate: number[];
  thighColor: string;
  shinColor: string;
}

/** Pata con muslo, rodilla y pezuña articulados (no un simple palo). */
function Leg({ x, y, hipRotate, kneeRotate, thighColor, shinColor }: LegProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: hipRotate }} transition={LEG_CYCLE}>
      {/* muslo, más ancho y redondeado para que se lea como un segmento propio */}
      <path
        d="M -2.3 0 C -2.5 1.8 -2 3.6 -1.5 5.2 L 1.5 5.2 C 2 3.6 2.5 1.8 2.3 0 Z"
        fill={thighColor}
      />
      {/* la rodilla nunca vuelve a 0: mantiene siempre un ángulo visible con el muslo */}
      <motion.g style={{ x: 0, y: 5.2 }} animate={{ rotate: kneeRotate }} transition={LEG_CYCLE}>
        {/* marca de la articulación */}
        <circle cx="0" cy="0" r="1.15" fill={thighColor} />
        {/* espinilla, más estrecha que el muslo para marcar el segundo segmento */}
        <path
          d="M -1.15 0 C -1.2 1.3 -1 2.6 -0.85 3.9 L 0.85 3.9 C 1 2.6 1.2 1.3 1.15 0 Z"
          fill={shinColor}
        />
        {/* pezuña */}
        <path d="M -1.15 3.9 L 1.15 3.9 L 1.45 4.9 C 1.45 5.3 -1.45 5.3 -1.45 4.9 Z" fill="#040404" />
        <line x1="0" y1="4.2" x2="0" y2="5.1" stroke="#000" strokeWidth="0.25" />
      </motion.g>
    </motion.g>
  );
}

/**
 * Toro de lidia estilizado (nada de emojis) en plena embestida: capa negra,
 * morrillo musculoso, cabeza y cuernos volcados hacia delante, galope a
 * cuatro patas y una nube de polvo dejada atrás. Cuerpo entero animado
 * (no sólo las patas), mirando a la derecha (perseguidor).
 */
// Patas más oscuras (toro/embolado) o en tonos cálidos de buey (cabestro) —
// mismas cuatro parejas muslo/espinilla, sólo cambia la paleta.
const LEG_COLORS_DARK = [
  { thigh: "#050505", shin: "#000000" },
  { thigh: "#0d0d0d", shin: "#050505" },
  { thigh: "#242424", shin: "#141414" },
  { thigh: "#3a3a3a", shin: "#242424" },
];
const LEG_COLORS_CABESTRO = [
  { thigh: "#6b4f2e", shin: "#4a341c" },
  { thigh: "#7a5c34", shin: "#5c4326" },
  { thigh: "#967248", shin: "#7a5c34" },
  { thigh: "#ad8a5c", shin: "#8a6a3e" },
];

export function RunningBull({ className, variant = "normal" }: RunningBullProps) {
  const isCabestro = variant === "cabestro";
  const bodyGradientId = isCabestro ? "cabestroBody" : "bullBody";
  const legColors = isCabestro ? LEG_COLORS_CABESTRO : LEG_COLORS_DARK;

  return (
    <svg viewBox="-20 0 68 34" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bullBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3d3d" />
          <stop offset="1" stopColor="#070707" />
        </linearGradient>
        {isCabestro ? (
          <>
            <linearGradient id="cabestroBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c99a5b" />
              <stop offset="1" stopColor="#8a6234" />
            </linearGradient>
            <linearGradient id="bellMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e8e2d0" />
              <stop offset="1" stopColor="#a89a72" />
            </linearGradient>
          </>
        ) : null}
        {variant === "embolado" ? (
          <>
            <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb347" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ff7a00" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="fireOuter" cx="50%" cy="65%" r="60%">
              <stop offset="0%" stopColor="#ff9d2e" />
              <stop offset="100%" stopColor="#e8390b" />
            </radialGradient>
            <radialGradient id="fireCore" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fff6d8" />
              <stop offset="100%" stopColor="#ffb02e" />
            </radialGradient>
            <filter id="fireBlur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="0.7" />
            </filter>
            <filter id="smokeBlur" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="0.6" />
            </filter>
          </>
        ) : null}
      </defs>

      {/* sombra de apoyo, fija en el suelo */}
      <ellipse cx="19" cy="30" rx="15" ry="2" fill="#000" opacity="0.18" />

      {/* nube de polvo base, siempre visible bajo el rastro animado */}
      <ellipse cx="-8" cy="30" rx="11" ry="2.8" fill="#d8cdb0" opacity="0.28" />

      {/* rastro de polvo levantado tras la embestida */}
      {DUST_PUFFS.map((p) => (
        <motion.circle
          key={p.cx}
          cx={p.cx}
          r={p.r}
          fill="#e6ddc6"
          initial={{ opacity: 0, cy: p.cy + 0.6 }}
          animate={{
            opacity: [0, 0.85, 0],
            cy: [p.cy + 0.6, p.cy - 3],
            r: [p.r * 0.5, p.r * 1.5],
          }}
          transition={{ ...DUST_BASE, delay: p.delay }}
        />
      ))}

      {/* cuerpo entero animado: no sólo las patas, todo el torso cabecea al galopar */}
      <motion.g animate={{ y: [0, -1.6, 0], rotate: [-4, 1, -4] }} transition={BODY_CYCLE}>
        {/* patas traseras — cada una con su propia fase, nunca sincronizadas */}
        <Leg
          x={10}
          y={19.5}
          hipRotate={strideCurve(28, -2, 0)}
          kneeRotate={strideCurve(14, 34, 0.12)}
          thighColor={legColors[0].thigh}
          shinColor={legColors[0].shin}
        />
        <Leg
          x={14.5}
          y={19.5}
          hipRotate={strideCurve(28, -2, 0.25)}
          kneeRotate={strideCurve(14, 34, 0.37)}
          thighColor={legColors[1].thigh}
          shinColor={legColors[1].shin}
        />

        {/* patas delanteras — galope a cuatro tiempos: cada pata a 1/4 de ciclo de la anterior */}
        <Leg
          x={25}
          y={19.5}
          hipRotate={strideCurve(28, -2, 0.5)}
          kneeRotate={strideCurve(14, 34, 0.62)}
          thighColor={legColors[2].thigh}
          shinColor={legColors[2].shin}
        />
        <Leg
          x={29}
          y={19.5}
          hipRotate={strideCurve(28, -2, 0.75)}
          kneeRotate={strideCurve(14, 34, 0.87)}
          thighColor={legColors[3].thigh}
          shinColor={legColors[3].shin}
        />

        {/* cuerpo, cruz y cuello como una única silueta continua (grupa → lomo → morrillo → cuello) */}
        <path
          d="M 6 21
             C 3.5 19 3 15.5 5 13
             C 6.5 10.5 10 9.8 14 9.5
             C 18 9.2 20 8 22 7
             C 24 5.5 25.5 4 28 3.5
             C 30.5 3 32 4.5 33 6.5
             C 34 8.5 35 9 35.5 10
             C 35 12 34.8 13 34.5 14
             C 34 16.5 32.5 18 31 19.5
             C 28 21 23 21.8 18 21.5
             C 12 21.2 8 21.5 6 21
             Z"
          fill={`url(#${bodyGradientId})`}
        />
        {/* cencerro del cabestro, colgando del cuello */}
        {isCabestro ? <CowBell x={19} y={17.5} /> : null}
        {/* brillo curvo a lo largo del lomo */}
        <path
          d="M 8 13.5 C 12 10.7 18 9.2 22.5 7.6"
          stroke="#6b6b6b"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        {/* cola articulada en dos tramos con fases desfasadas: un movimiento de látigo, no un balanceo en un solo eje. Erguida, como en plena embestida. */}
        <motion.g
          style={{ x: 7, y: 14 }}
          animate={{ rotate: [-10, 14, -6, -10] }}
          transition={TAIL_BASE_CYCLE}
        >
          <path d="M0 0 C -3 -1.5 -4 -4 -3.5 -6.5" stroke="#0d0d0d" strokeWidth="2.1" strokeLinecap="round" fill="none" />
          <motion.g
            style={{ x: -3.5, y: -6.5 }}
            animate={{ rotate: [10, -18, 12, 10] }}
            transition={TAIL_TIP_CYCLE}
          >
            <path d="M0 0 C -2.2 -1.3 -3 -3 -2.3 -5" stroke="#0d0d0d" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            <circle cx="-2.3" cy="-5" r="1.3" fill="#0d0d0d" />
          </motion.g>
        </motion.g>

        {/* cabeza y cuernos volcados hacia delante: postura de embestida */}
        <g transform="rotate(17 38 13)">
          <circle cx="38" cy="13" r="5.4" fill="#141414" />
          <ellipse cx="42.4" cy="15.2" rx="2.3" ry="1.7" fill="#040404" />
          <circle cx="39.5" cy="11.6" r="0.75" fill="#3a1f12" />
          <circle cx="39.7" cy="11.3" r="0.26" fill="#f5ead6" />
          <path
            d="M35.6 9.2 C33.2 4.6 33.8 1.8 37.2 1"
            stroke="#e9dfc4"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="37.2" cy="1" r="0.85" fill="#2a2a2a" />
          <path
            d="M40.6 8.6 C43.4 4.2 43 1.6 39.6 1.4"
            stroke="#d8ccae"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="39.6" cy="1.4" r="0.85" fill="#1a1a1a" />

          {variant === "embolado" ? (
            <>
              <Fireball cx={37.2} cy={1} delay={0} />
              <Fireball cx={39.6} cy={1.4} delay={0.18} />
            </>
          ) : null}
        </g>
      </motion.g>
    </svg>
  );
}
