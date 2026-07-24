"use client";

import { motion, type Transition } from "framer-motion";

interface PartyVanProps {
  className?: string;
}

const WHEEL_SPIN: Transition = { duration: 0.5, repeat: Infinity, ease: "linear" };
const BODY_BOUNCE: Transition = { duration: 0.35, repeat: Infinity, ease: "easeInOut" };
const SPEAKER_PULSE: Transition = { duration: 0.3, repeat: Infinity, ease: "easeInOut" };
const SPOTLIGHT_SWEEP: Transition = { duration: 1.8, repeat: Infinity, ease: "easeInOut" };
const SPOTLIGHT_COLOR_CYCLE: Transition = { duration: 2.4, repeat: Infinity, ease: "easeInOut" };
const DISCO_SWEEP: Transition = { duration: 1.4, repeat: Infinity, ease: "easeInOut" };
const DJ_BOB: Transition = { duration: 0.4, repeat: Infinity, ease: "easeInOut" };
const DJ_ARM: Transition = { duration: 0.35, repeat: Infinity, ease: "easeInOut" };
const HEADLIGHT_CYCLE: Transition = { duration: 1, repeat: Infinity, ease: "easeInOut" };
const TAILLIGHT_CYCLE: Transition = { duration: 1.2, repeat: Infinity, ease: "easeInOut" };
const SMOKE_BASE: Transition = { duration: 0.95, repeat: Infinity, ease: "easeOut" };

const SMOKE_PUFFS = [
  { cx: 3, cy: 28, r: 2, delay: 0 },
  { cx: -1.5, cy: 27, r: 1.7, delay: 0.18 },
  { cx: -5.5, cy: 28.5, r: 1.4, delay: 0.36 },
  { cx: -9, cy: 27.5, r: 1, delay: 0.54 },
];

/** Rueda con llanta y radios, gira sobre sí misma sin parar. */
function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <motion.g style={{ x: cx, y: cy }} animate={{ rotate: 360 }} transition={WHEEL_SPIN}>
      <circle r="6.5" fill="#0a0a0a" />
      <circle r="6.5" fill="none" stroke="#3a3a3a" strokeWidth="0.4" opacity="0.7" />
      <circle r="3.6" fill="url(#wheelRim)" />
      <circle r="1.2" fill="#0a0a0a" />
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="0"
          y1="0"
          x2={Math.cos((deg * Math.PI) / 180) * 3.6}
          y2={Math.sin((deg * Math.PI) / 180) * 3.6}
          stroke="#9a9a9a"
          strokeWidth="0.7"
        />
      ))}
    </motion.g>
  );
}

/** Altavoz gris con la malla de los woofers en negro. `y` es la base, apoyada encima del borde de la caja. */
function Speaker({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.g
      style={{ x, y }}
      animate={{ scaleY: [1, 1.1, 0.94, 1] }}
      transition={{ ...SPEAKER_PULSE, delay }}
    >
      <rect x="-5" y="-14" width="10" height="14" rx="1" fill="url(#speakerBody)" stroke="#5a5a5a" strokeWidth="0.4" />
      <circle cx="0" cy="-10" r="2.4" fill="url(#speakerMesh)" />
      <circle cx="0" cy="-3.5" r="1.8" fill="url(#speakerMesh)" />
    </motion.g>
  );
}

const SPOTLIGHT_COLORS = ["#ff3b5c", "#3b82ff", "#34d399", "#fbbf24", "#ff3b5c"];

/** Foco de pie: el haz apunta hacia arriba (luz de suelo), cambia de color sin parar y barre un arco amplio. */
function Spotlight({ x, baseY, delay }: { x: number; baseY: number; delay: number }) {
  return (
    <g>
      <line x1={x} y1={baseY} x2={x} y2={baseY - 10} stroke="#1a1a1a" strokeWidth="1.2" />
      <motion.g
        style={{ x, y: baseY - 10 }}
        animate={{ rotate: [-32, 32, -32] }}
        transition={{ ...SPOTLIGHT_SWEEP, delay }}
      >
        <circle r="2" fill="#2a2a2a" />
        <motion.path
          d="M0 0 L-8 -11 L8 -11 Z"
          style={{ mixBlendMode: "screen" }}
          animate={{ fill: SPOTLIGHT_COLORS, opacity: [0.3, 0.6, 0.3] }}
          transition={{ ...SPOTLIGHT_COLOR_CYCLE, delay }}
        />
      </motion.g>
    </g>
  );
}

const DISCO_BEAMS = [
  { from: -30, to: 2, color: "#ff3b5c", delay: 0 },
  { from: -8, to: 26, color: "#3b82ff", delay: 0.15 },
  { from: 10, to: -20, color: "#34d399", delay: 0.3 },
];

/** Cabezal de discomóvil montado en alto, apuntando hacia abajo sobre el equipo: tres haces de color que barren y laten. */
function DiscoLight({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 5} y={y - 1.4} width="10" height="2.8" rx="0.7" fill="#111" />
      {DISCO_BEAMS.map((beam) => (
        <motion.path
          key={beam.color}
          d="M0 0 L-5 13 L5 13 Z"
          fill={beam.color}
          style={{ x, y, mixBlendMode: "screen" }}
          animate={{ rotate: [beam.from, beam.to, beam.from], opacity: [0.25, 0.6, 0.25] }}
          transition={{ ...DISCO_SWEEP, delay: beam.delay }}
        />
      ))}
    </g>
  );
}

/**
 * DJ tras la mesa de mezclas: una persona con cascos (banda + dos auriculares
 * bien visibles, el rasgo que lo identifica como DJ), sin ninguna luz en la
 * mesa — sólo dos platos. Cabecea al ritmo y mueve un brazo sobre los platos.
 * `y` es la base, apoyada encima del borde de la caja.
 */
function DjFigure({ x, y }: { x: number; y: number }) {
  return (
    <motion.g style={{ x, y }} animate={{ y: [y, y - 1, y] }} transition={DJ_BOB}>
      {/* mesa de mezclas: sólo dos platos, sin luces */}
      <rect x="-9" y="-6" width="18" height="6" rx="1" fill="#151515" />
      <circle cx="-4" cy="-6" r="2" fill="#3a3a3a" />
      <circle cx="4" cy="-6" r="2" fill="#3a3a3a" />

      {/* cuerpo: camiseta con color, no una silueta negra */}
      <rect x="-3.4" y="-15" width="6.8" height="9" rx="2" fill="url(#djShirt)" />
      {/* pelo, asomando por detrás de la cabeza y bajo los cascos */}
      <path
        d="M-3.4 -19.8 C-3.7 -22.6 -1.6 -22.2 0 -22.2 C1.6 -22.2 3.7 -22.6 3.4 -19.8 Z"
        fill="#3b2413"
      />
      {/* cabeza: tono piel, no negra */}
      <circle cx="0" cy="-18.5" r="3.2" fill="#e8b48a" />
      {/* cascos de DJ: banda por encima de la cabeza + un auricular a cada lado (el único elemento en negro, como accesorio) */}
      <path
        d="M-3.9 -19.3 C-3.9 -22.8 -1.9 -24.4 0 -24.4 C1.9 -24.4 3.9 -22.8 3.9 -19.3"
        stroke="#1a1a1a"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="-3.9" cy="-18.5" r="1.6" fill="#1a1a1a" stroke="#5a5a5a" strokeWidth="0.5" />
      <circle cx="3.9" cy="-18.5" r="1.6" fill="#1a1a1a" stroke="#5a5a5a" strokeWidth="0.5" />

      {/* brazo animado sobre los platos, con mano al final (el hombro se queda fijo, sólo se mueve la mano) */}
      <motion.line
        x1="3.4"
        y1="-12"
        x2="7.4"
        y2="-6"
        stroke="#c98f61"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ x2: [7.4, 5, 7.4], y2: [-6, -2.5, -6] }}
        transition={DJ_ARM}
      />
      <motion.circle
        cx="7.4"
        cy="-6"
        r="1.1"
        fill="#e8b48a"
        animate={{ cx: [7.4, 5, 7.4], cy: [-6, -2.5, -6] }}
        transition={DJ_ARM}
      />
    </motion.g>
  );
}

/**
 * Furgoneta pickup negra con equipo de fiesta encima de la caja (a la vista,
 * no encajonado entre los laterales): dos altavoces grises con malla negra,
 * focos de pie con haces largos que apuntan hacia arriba y cambian de color
 * sin parar, una discomóvil elevada que apunta hacia abajo sobre el equipo
 * (mix-blend-mode "screen", como luz real) y un DJ pinchando. Ruedas y
 * piloto incluidos. Mirando a la derecha (dirección de avance, igual que
 * el toro).
 */
export function PartyVan({ className }: PartyVanProps) {
  return (
    <svg viewBox="0 -10 158 46" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="vanBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2c2c" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id="djShirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c084fc" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
        <radialGradient id="wheelRim" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#5a5a5a" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </radialGradient>
        <linearGradient id="speakerBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9c9c9c" />
          <stop offset="100%" stopColor="#6d6d6d" />
        </linearGradient>
        <radialGradient id="speakerMesh" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id="windshield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dcecf5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#96bed2" stopOpacity="0.72" />
        </linearGradient>
        <filter id="vanSmokeBlur" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
      </defs>

      {/* sombra de apoyo */}
      <ellipse cx="78" cy="34" rx="72" ry="2.4" fill="#000" opacity="0.18" />

      {/* nube de humo base, siempre visible bajo el rastro animado del tubo de escape */}
      <ellipse cx="-4" cy="28" rx="7" ry="1.8" fill="#8a8a86" opacity="0.22" />
      {/* rastro de humo del tubo de escape, tras la furgoneta (igual que el polvo del toro) */}
      {SMOKE_PUFFS.map((p) => (
        <motion.circle
          key={p.cx}
          cx={p.cx}
          r={p.r}
          fill="#7a7a76"
          filter="url(#vanSmokeBlur)"
          initial={{ opacity: 0, cy: p.cy + 0.4 }}
          animate={{
            opacity: [0, 0.5, 0],
            cy: [p.cy + 0.4, p.cy - 4],
            cx: [p.cx, p.cx - 3],
            r: [p.r * 0.6, p.r * 1.8],
          }}
          transition={{ ...SMOKE_BASE, delay: p.delay }}
        />
      ))}

      <motion.g animate={{ y: [0, -0.6, 0] }} transition={BODY_BOUNCE}>
        {/* ruedas */}
        <Wheel cx={30} cy={30} />
        <Wheel cx={104} cy={30} />
        {/* tubo de escape */}
        <rect x="3" y="27" width="4" height="2" rx="0.6" fill="#1a1a1a" />
        {/* luz trasera, justo por fuera del borde de la caja para que no quede tapada por su relleno, parpadeo sutil */}
        <motion.circle
          cx="7"
          cy="25"
          r="1.3"
          fill="#ff3b3b"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={TAILLIGHT_CYCLE}
        />

        {/* caja de la pickup: bloque sólido (nunca sólo un contorno que el propio
            equipo pueda tapar), el equipo se apoya en su borde superior */}
        <rect x="8" y="20" width="54" height="8" rx="1" fill="url(#vanBody)" />

        {/* cabina + capó, silueta rellena */}
        <path
          d="M62 28 L62 6 C62 4.6 63 3.6 64.5 3.6 L88 3.6
             C89.5 3.6 90.7 4.3 91.5 5.5 L98 16
             L112 16 C115 16 117 18.5 117 21.5 L117 26
             C117 27 116 28 115 28 Z"
          fill="url(#vanBody)"
        />
        {/* parabrisas */}
        <path
          d="M73 7 L88 7 C89 7 89.6 7.5 90.1 8.3 L94.5 15 L75 15 Z"
          fill="url(#windshield)"
        />
        {/* piloto, visible tras el parabrisas */}
        <circle cx="82" cy="11.4" r="2.8" fill="#141414" />
        <path d="M77 15 C78 12.6 80.2 11.4 82 11.4 C83.8 11.4 86 12.6 87 15 Z" fill="#141414" />
        {/* faro delantero, parpadeo sutil */}
        <motion.circle
          cx="114.5"
          cy="22"
          r="1.8"
          fill="#fff4c2"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={HEADLIGHT_CYCLE}
        />

        {/* equipo de fiesta ENCIMA del borde de la caja (nunca encajonado entre los laterales), agrupado en el centro */}
        <Spotlight x={12} baseY={20} delay={0} />
        <Speaker x={19} y={20} delay={0} />
        <DjFigure x={35} y={20} />
        <Speaker x={51} y={20} delay={0.12} />
        <Spotlight x={58} baseY={20} delay={0.4} />
        {/* discomóvil desplazada de la mesa del DJ, para que no parezca que hay luces ahí */}
        <DiscoLight x={45} y={-4} />
      </motion.g>
    </svg>
  );
}
