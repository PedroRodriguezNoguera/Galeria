"use client";

import { motion, type Transition } from "framer-motion";

interface CharangaProps {
  className?: string;
}

const LIMB_SAMPLES = 8;
const LIMB_TIMES = Array.from({ length: LIMB_SAMPLES + 1 }, (_, i) => i / LIMB_SAMPLES);
const LIMB_CYCLE: Transition = {
  duration: 0.42,
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

const CYMBAL_CLASH: Transition = { duration: 0.4, repeat: Infinity, ease: "easeInOut" };
const MALLET_HIT: Transition = { duration: 0.42, repeat: Infinity, ease: "easeInOut" };
const SAX_SWAY: Transition = { duration: 0.6, repeat: Infinity, ease: "easeInOut" };
const TRUMPET_BOB: Transition = { duration: 0.4, repeat: Infinity, ease: "easeInOut" };
const NOTE_RISE: Transition = { duration: 2.2, repeat: Infinity, ease: "easeOut" };
// Sin `times`, a diferencia de LIMB_CYCLE: aquí sólo hay 3 puntos en las
// curvas (arriba/abajo), usar LIMB_TIMES (9 puntos) daría un desajuste de
// longitud entre `times` y las propias keyframes.
const BODY_SWAY: Transition = { duration: 0.42, repeat: Infinity, ease: "easeInOut" };

interface LegProps {
  x: number;
  y: number;
  hipRotate: number[];
  kneeRotate: number[];
}

/** Pierna con muslo, rodilla y pie articulados, pantalón blanco. */
function DanceLeg({ x, y, hipRotate, kneeRotate }: LegProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: hipRotate }} transition={LIMB_CYCLE}>
      <path
        d="M-2 0 C-2.2 1.7 -1.8 3.4 -1.3 5.1 L1.3 5.1 C1.8 3.4 2.2 1.7 2 0 Z"
        fill="#f8f8f5"
        stroke="#dcdcd6"
        strokeWidth="0.25"
      />
      {/* la rodilla nunca vuelve a 0: mantiene siempre un ángulo visible con el muslo */}
      <motion.g style={{ x: 0, y: 5.1 }} animate={{ rotate: kneeRotate }} transition={LIMB_CYCLE}>
        <circle r="1" fill="#f0f0eb" />
        <path
          d="M-1.2 0 C-1.25 1.4 -1.05 2.8 -0.9 4.2 L0.9 4.2 C1.05 2.8 1.25 1.4 1.2 0 Z"
          fill="#eeeeea"
          stroke="#dcdcd6"
          strokeWidth="0.25"
        />
        <ellipse cx="0" cy="4.5" rx="1.35" ry="0.75" fill="#141414" />
      </motion.g>
    </motion.g>
  );
}

interface ArmProps {
  x: number;
  y: number;
  shoulderRotate: number[];
  elbowRotate: number[];
  skinTone: string;
}

/** Brazo con hombro y codo articulados, terminado en una mano. */
function DanceArm({ x, y, shoulderRotate, elbowRotate, skinTone }: ArmProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: shoulderRotate }} transition={LIMB_CYCLE}>
      <path d="M-1.2 0 C-1.3 1.5 -1.1 3 -0.9 4.5 L0.9 4.5 C1.1 3 1.3 1.5 1.2 0 Z" fill={skinTone} />
      <motion.g style={{ x: 0, y: 4.5 }} animate={{ rotate: elbowRotate }} transition={LIMB_CYCLE}>
        <circle r="0.65" fill={skinTone} />
        <path d="M-0.85 0 C-0.9 1.3 -0.75 2.6 -0.6 3.9 L0.6 3.9 C0.75 2.6 0.9 1.3 0.85 0 Z" fill={skinTone} />
        <circle cx="0" cy="3.9" r="0.85" fill={skinTone} />
      </motion.g>
    </motion.g>
  );
}

const FLOWER_COLORS = ["#22c55e", "#a855f7", "#eab308"];
const FLOWER_DOTS = [
  { x: -2.8, y: -8 },
  { x: 2.2, y: -6.5 },
  { x: -0.5, y: -4 },
  { x: 3, y: -2.5 },
  { x: -3.2, y: -1.5 },
];

/** Camisa blanca con estampado floral verde/morado/amarillo. */
function FloralShirt() {
  return (
    <>
      <rect x="-5" y="-21" width="10" height="11" rx="3" fill="#f8f8f5" stroke="#e5e5e0" strokeWidth="0.3" />
      {FLOWER_DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y - 11} r={0.75} fill={FLOWER_COLORS[i % FLOWER_COLORS.length]} />
      ))}
    </>
  );
}

function HeadAndHair({ hairColor, skinTone }: { hairColor: string; skinTone: string }) {
  return (
    <>
      <path
        d="M-3.4 -24.5 C-3.6 -27.5 -1.6 -28.8 0 -28.8 C1.6 -28.8 3.6 -27.5 3.4 -24.5 Z"
        fill={hairColor}
      />
      <circle cx="0" cy="-24" r="3.2" fill={skinTone} />
    </>
  );
}

/** Platillos: dos brazos articulados (hombro+codo) que chocan los discos entre sí sin parar. */
function CymbalArms({ skinTone, phase }: { skinTone: string; phase: number }) {
  return (
    <>
      <DanceArm
        x={-3.6}
        y={-19}
        shoulderRotate={strideCurve(30, -70, phase)}
        elbowRotate={strideCurve(14, 20, phase + 0.1)}
        skinTone={skinTone}
      />
      <DanceArm
        x={3.6}
        y={-19}
        shoulderRotate={strideCurve(30, 70, phase + 0.5)}
        elbowRotate={strideCurve(14, -20, phase + 0.6)}
        skinTone={skinTone}
      />
      {/* discos, montados en cada mano */}
      <motion.g
        style={{ x: -3.6, y: -19 }}
        animate={{ rotate: strideCurve(30, -70, phase) }}
        transition={CYMBAL_CLASH}
      >
        <g transform="translate(0 9)">
          <circle r="2.6" fill="url(#cymbalGrad)" stroke="#8a6d1f" strokeWidth="0.3" />
        </g>
      </motion.g>
      <motion.g
        style={{ x: 3.6, y: -19 }}
        animate={{ rotate: strideCurve(30, 70, phase + 0.5) }}
        transition={CYMBAL_CLASH}
      >
        <g transform="translate(0 9)">
          <circle r="2.6" fill="url(#cymbalGrad)" stroke="#8a6d1f" strokeWidth="0.3" />
        </g>
      </motion.g>
    </>
  );
}

/** Bombo: tambor al pecho con correa, una baqueta articulada golpeándolo al ritmo, y el otro brazo libre bailando. */
function BomboDrum({ skinTone, phase }: { skinTone: string; phase: number }) {
  return (
    <>
      <line x1="-3" y1="-20" x2="2" y2="-9" stroke="#8a6d4a" strokeWidth="0.8" />
      <ellipse cx="0" cy="-11" rx="5.5" ry="4" fill="#f5f5f0" stroke="#8a1f1f" strokeWidth="1" />
      <ellipse cx="0" cy="-11" rx="3.6" ry="2.4" fill="none" stroke="#8a1f1f" strokeWidth="0.5" opacity="0.6" />
      {/* brazo libre, bailando */}
      <DanceArm
        x={-4}
        y={-19}
        shoulderRotate={strideCurve(22, -150, phase)}
        elbowRotate={strideCurve(14, 20, phase + 0.15)}
        skinTone={skinTone}
      />
      {/* brazo con la baqueta, golpeando el bombo */}
      <motion.g
        style={{ x: 4, y: -19 }}
        animate={{ rotate: strideCurve(35, 15, phase) }}
        transition={MALLET_HIT}
      >
        <path d="M-1 0 C-1.1 1.4 -0.9 2.8 -0.7 4.2 L0.7 4.2 C0.9 2.8 1.1 1.4 1 0 Z" fill={skinTone} />
        <motion.g
          style={{ x: 0, y: 4.2 }}
          animate={{ rotate: strideCurve(40, -30, phase + 0.2) }}
          transition={MALLET_HIT}
        >
          <line x1="0" y1="0" x2="0" y2="4.5" stroke="#5a3d1f" strokeWidth="1" strokeLinecap="round" />
          <circle cx="0" cy="4.8" r="1.1" fill="#3b2413" />
        </motion.g>
      </motion.g>
    </>
  );
}

/** Trompeta: dos brazos flexionados la sostienen junto a la boca, con un ligero bombeo al soplar. */
function Trumpet({ skinTone }: { skinTone: string }) {
  return (
    <motion.g animate={{ scale: [1, 1.05, 1] }} transition={TRUMPET_BOB}>
      <DanceArm
        x={-3.2}
        y={-19}
        shoulderRotate={strideCurve(4, -95, 0)}
        elbowRotate={strideCurve(4, 15, 0.1)}
        skinTone={skinTone}
      />
      <DanceArm
        x={3.2}
        y={-19}
        shoulderRotate={strideCurve(4, 95, 0)}
        elbowRotate={strideCurve(4, -15, 0.1)}
        skinTone={skinTone}
      />
      <g transform="translate(0 -22)">
        <rect x="1" y="-1" width="8" height="1.6" rx="0.6" fill="#e8c15a" transform="rotate(-8)" />
        <circle cx="9.5" cy="-2.2" r="1.7" fill="#f0d27a" />
        <rect x="3.5" y="-3" width="0.7" height="2" fill="#c9a13a" />
        <rect x="5" y="-3" width="0.7" height="2" fill="#c9a13a" />
        <rect x="6.5" y="-3" width="0.7" height="2" fill="#c9a13a" />
      </g>
    </motion.g>
  );
}

/** Saxofón: dos brazos flexionados lo sostienen delante del cuerpo, balanceándose suavemente. */
function Saxophone({ skinTone }: { skinTone: string }) {
  return (
    <motion.g animate={{ rotate: [-5, 5, -5] }} transition={SAX_SWAY}>
      <DanceArm
        x={-3}
        y={-18}
        shoulderRotate={strideCurve(6, -55, 0)}
        elbowRotate={strideCurve(6, 23, 0.1)}
        skinTone={skinTone}
      />
      <DanceArm
        x={3}
        y={-18}
        shoulderRotate={strideCurve(6, 55, 0)}
        elbowRotate={strideCurve(6, -23, 0.1)}
        skinTone={skinTone}
      />
      <path
        d="M1 -22 C4 -22 5 -20 5 -17 C5 -14 3 -12 0 -12 C-2 -12 -2.5 -14 -1 -15"
        stroke="#d4af37"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="-0.8" cy="-13.7" r="1.3" fill="#e8c15a" />
    </motion.g>
  );
}

interface CharangaPersonProps {
  x: number;
  phase: number;
  instrument: "platillos" | "bombo" | "trompeta" | "saxofon";
  hairColor: string;
  skinTone: string;
}

/** Una persona de la charanga: baila con pasos alternados de verdad (cadera+rodilla articuladas) mientras toca su instrumento. */
function CharangaPerson({ x, phase, instrument, hairColor, skinTone }: CharangaPersonProps) {
  return (
    <motion.g
      style={{ x, y: 32 }}
      animate={{ y: [32, 30.4, 32], rotate: [-3, 3, -3] }}
      transition={{ ...BODY_SWAY, delay: phase * 0.42 }}
    >
      {/* piernas: paso alternado, nunca sincronizadas entre sí */}
      <DanceLeg
        x={-2.2}
        y={-10}
        hipRotate={strideCurve(24, -4, phase)}
        kneeRotate={strideCurve(18, 24, phase + 0.14)}
      />
      <DanceLeg
        x={2.2}
        y={-10}
        hipRotate={strideCurve(24, -4, phase + 0.5)}
        kneeRotate={strideCurve(18, 24, phase + 0.64)}
      />

      <FloralShirt />
      <HeadAndHair hairColor={hairColor} skinTone={skinTone} />

      {instrument === "platillos" ? <CymbalArms skinTone={skinTone} phase={phase} /> : null}
      {instrument === "bombo" ? <BomboDrum skinTone={skinTone} phase={phase} /> : null}
      {instrument === "trompeta" ? <Trumpet skinTone={skinTone} /> : null}
      {instrument === "saxofon" ? <Saxophone skinTone={skinTone} /> : null}
    </motion.g>
  );
}

const NOTE_COLORS = ["#ec4899", "#f59e0b", "#22c55e", "#3b82f6"];
const NOTES = [
  { x: 10, y: -14, delay: 0 },
  { x: 25, y: -22, delay: 1 },
  { x: 40, y: -18, delay: 0.4 },
  { x: 55, y: -24, delay: 1.6 },
  { x: 70, y: -12, delay: 0.8 },
  { x: 85, y: -22, delay: 0.6 },
  { x: 100, y: -20, delay: 1.2 },
  { x: 115, y: -16, delay: 1.8 },
  { x: 130, y: -14, delay: 0.2 },
  { x: 142, y: -22, delay: 1.4 },
];

/** Nota musical (corchea) que sube, gira suavemente y se desvanece. */
function MusicNote({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  return (
    <motion.g
      style={{ x, y }}
      initial={{ opacity: 0, y: y + 2, rotate: -8 }}
      animate={{ opacity: [0, 0.9, 0], y: [y + 2, y - 14], rotate: [-8, 8, -8] }}
      transition={{ ...NOTE_RISE, delay }}
    >
      <circle cx="0" cy="3" r="1.4" fill={color} />
      <line x1="1.3" y1="2.6" x2="1.3" y2="-6" stroke={color} strokeWidth="0.7" />
      <path d="M1.3 -6 C3 -6.5 3.6 -5 3 -3.8" stroke={color} strokeWidth="0.7" fill="none" />
    </motion.g>
  );
}

/**
 * Charanga de 4 personas cruzando la cabecera: ropa blanca con flores
 * verdes/moradas/amarillas, piernas y brazos con articulaciones reales
 * (cadera, rodilla, hombro, codo) dando pasos de baile alternados, cada una
 * con un instrumento típico (platillos, bombo, trompeta, saxofón) animado
 * sin parar, y notas musicales flotando alrededor. Cada persona baila con
 * su propia fase, nunca todas sincronizadas. Se mueve de izquierda a
 * derecha, igual que el resto de eventos.
 */
export function Charanga({ className }: CharangaProps) {
  return (
    <svg viewBox="0 -20 150 56" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="cymbalGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f5d576" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
      </defs>

      <ellipse cx="75" cy="33" rx="70" ry="2.2" fill="#000" opacity="0.15" />

      <CharangaPerson x={18} phase={0} instrument="platillos" hairColor="#141414" skinTone="#e8b48a" />
      <CharangaPerson x={54} phase={0.2} instrument="bombo" hairColor="#3b2413" skinTone="#c98f61" />
      <CharangaPerson x={92} phase={0.4} instrument="trompeta" hairColor="#141414" skinTone="#d29f6e" />
      <CharangaPerson x={128} phase={0.6} instrument="saxofon" hairColor="#5a3d1f" skinTone="#e8b48a" />

      {NOTES.map((n, i) => (
        <MusicNote key={i} x={n.x} y={n.y} delay={n.delay} color={NOTE_COLORS[i % NOTE_COLORS.length]} />
      ))}
    </svg>
  );
}
