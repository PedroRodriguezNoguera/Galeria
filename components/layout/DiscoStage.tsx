"use client";

import { motion, type Transition, type Variants } from "framer-motion";

interface DiscoStageProps {
  className?: string;
}

const STAGGER_TRANSITION: Transition = { staggerChildren: 0.35 };
// Rebote visible: damping por debajo del crítico a propósito, para que cada
// pieza haga un pequeño overshoot físico al entrar (no un movimiento mecánico).
const BOUNCE_SPRING: Transition = { type: "spring", stiffness: 300, damping: 14, mass: 0.9 };

const containerVariants: Variants = {
  hidden: {},
  // El stagger sólo vive aquí, en "visible": al desmontar (AnimatePresence
  // anima hacia "hidden") no hay staggerChildren, así que todo sale a la vez,
  // cada pieza con su propio destino ("fromTop"/"fromBottom") de vuelta.
  visible: { transition: STAGGER_TRANSITION },
};

const fromTopVariants: Variants = {
  hidden: { y: -26, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: BOUNCE_SPRING },
};

const fromBottomVariants: Variants = {
  hidden: { y: 22, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: BOUNCE_SPRING },
};

const LIGHT_COLORS = ["#ff3b5c", "#3b82ff", "#34d399", "#fbbf24"];
const LIGHT_SWEEP: Transition = { duration: 1.6, repeat: Infinity, ease: "easeInOut" };
const LIGHT_COLOR_CYCLE: Transition = { duration: 2, repeat: Infinity, ease: "easeInOut" };
const BALL_SPIN: Transition = { duration: 3, repeat: Infinity, ease: "linear" };
const BANNER_SWAY: Transition = { duration: 2, repeat: Infinity, ease: "easeInOut" };
const SPEAKER_PULSE: Transition = { duration: 0.32, repeat: Infinity, ease: "easeInOut" };
const DJ_BOB: Transition = { duration: 0.42, repeat: Infinity, ease: "easeInOut" };
const DJ_SCRATCH: Transition = { duration: 0.3, repeat: Infinity, ease: "easeInOut" };
const DJ_HANDS_UP: Transition = { duration: 0.5, repeat: Infinity, ease: "easeInOut" };

/** Foco robótico colgado de la viga: barre un arco y cambia de color sin parar, apuntando hacia abajo. */
function MovingHeadLight({ x, delay }: { x: number; delay: number }) {
  return (
    <g>
      <line x1={x} y1={-30} x2={x} y2={-26} stroke="#1a1a1a" strokeWidth="1" />
      <motion.g
        style={{ x, y: -26 }}
        animate={{ rotate: [-28, 28, -28] }}
        transition={{ ...LIGHT_SWEEP, delay }}
      >
        <circle r="1.6" fill="#2a2a2a" />
        <motion.path
          d="M0 0 L-6 15 L6 15 Z"
          style={{ mixBlendMode: "screen" }}
          animate={{ fill: LIGHT_COLORS, opacity: [0.22, 0.5, 0.22] }}
          transition={{ ...LIGHT_COLOR_CYCLE, delay }}
        />
      </motion.g>
    </g>
  );
}

/** Bola de espejos colgada del centro de la viga, girando sin parar. */
function MirrorBall() {
  return (
    <motion.g style={{ x: 65, y: -23 }} animate={{ rotate: 360 }} transition={BALL_SPIN}>
      <circle r="2.8" fill="url(#mirrorBallGrad)" stroke="#c9c9c9" strokeWidth="0.3" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1={Math.cos((deg * Math.PI) / 180) * 1.4}
          y1={Math.sin((deg * Math.PI) / 180) * 1.4}
          x2={Math.cos((deg * Math.PI) / 180) * 2.8}
          y2={Math.sin((deg * Math.PI) / 180) * 2.8}
          stroke="#fff"
          strokeWidth="0.3"
          opacity="0.6"
        />
      ))}
    </motion.g>
  );
}

/** Fleco inferior del banner, en tiras finas y numerosas. */
function BannerFringe({ fillColor }: { fillColor: string }) {
  return (
    <>
      {[...Array(7)].map((_, i) => (
        <path
          key={i}
          d={`M${-5 + i * 1.43} -8 L${-3.7 + i * 1.43} -8 L${-4.35 + i * 1.43} -5.1 Z`}
          fill={fillColor}
        />
      ))}
    </>
  );
}

/**
 * Banner grande típico de discomóvil, en un mástil rematado con un remate
 * metálico. Tela con borde, estrella emblema, fleco fino, y ondea de verdad
 * (combina balanceo y un ligero sesgo, como si la moviera el aire).
 */
function Banner({ x, gradientId }: { x: number; gradientId: string }) {
  return (
    <motion.g
      style={{ x, y: 14 }}
      animate={{ rotate: [-4, 4, -4], skewX: [-3, 3, -3] }}
      transition={BANNER_SWAY}
    >
      <line x1="0" y1="0" x2="0" y2="-25.5" stroke="#1a1a1a" strokeWidth="0.9" />
      <circle cx="0" cy="-25.5" r="0.6" fill="#3a3a3a" />

      <rect
        x="-5"
        y="-25"
        width="10"
        height="17"
        rx="0.4"
        fill={`url(#${gradientId})`}
        stroke="#fff"
        strokeWidth="0.35"
        strokeOpacity="0.9"
      />
      {/* estrella emblema, típica de los banners de discomóvil */}
      <path
        d="M0 -19.4 L0.53 -17.93 L2.09 -17.88 L0.86 -16.92 L1.29 -15.42 L0 -16.3 L-1.29 -15.42 L-0.86 -16.92 L-2.09 -17.88 L-0.53 -17.93 Z"
        fill="#fff"
        opacity="0.92"
      />
      <BannerFringe fillColor="#fff" />
    </motion.g>
  );
}

/** Esquineras metálicas de protección, típicas de las cajas de sonido profesionales. */
function CabinetCorners({ width, top, bottom }: { width: number; top: number; bottom: number }) {
  const half = width / 2;
  return (
    <>
      <path d={`M${-half} ${top} L${-half + 1.5} ${top} L${-half} ${top + 1.5} Z`} fill="#1a1a1a" />
      <path d={`M${half} ${top} L${half - 1.5} ${top} L${half} ${top + 1.5} Z`} fill="#1a1a1a" />
      <path d={`M${-half} ${bottom} L${-half + 1.5} ${bottom} L${-half} ${bottom - 1.5} Z`} fill="#1a1a1a" />
      <path d={`M${half} ${bottom} L${half - 1.5} ${bottom} L${half} ${bottom - 1.5} Z`} fill="#1a1a1a" />
    </>
  );
}

/**
 * Altavoz de discomóvil de verdad: caja de graves grande abajo + caja de
 * agudos/medios más pequeña encima, con esquineras metálicas y asa de
 * transporte — no una caja única. "Bombea" al ritmo.
 */
function StageSpeaker({ x }: { x: number }) {
  return (
    <motion.g style={{ x, y: 14 }} animate={{ scaleY: [1, 1.06, 0.97, 1] }} transition={SPEAKER_PULSE}>
      {/* caja de graves, abajo */}
      <rect
        x="-5.6"
        y="-9"
        width="11.2"
        height="9"
        rx="0.7"
        fill="url(#speakerBodyGrad)"
        stroke="#4a4a4a"
        strokeWidth="0.4"
      />
      <circle cx="0" cy="-4.5" r="3" fill="url(#speakerMeshGrad)" stroke="#1a1a1a" strokeWidth="0.3" />
      <CabinetCorners width={11.2} top={-9} bottom={0} />

      {/* caja de agudos/medios, encima */}
      <rect
        x="-4.6"
        y="-17.6"
        width="9.2"
        height="8.4"
        rx="0.7"
        fill="url(#speakerBodyGrad)"
        stroke="#4a4a4a"
        strokeWidth="0.4"
      />
      <circle cx="0" cy="-14.6" r="2.1" fill="url(#speakerMeshGrad)" stroke="#1a1a1a" strokeWidth="0.3" />
      <circle cx="0" cy="-10.6" r="1.4" fill="url(#speakerMeshGrad)" stroke="#1a1a1a" strokeWidth="0.3" />
      <CabinetCorners width={9.2} top={-17.6} bottom={-9.2} />

      {/* asa de transporte */}
      <rect x="-1.4" y="-18.5" width="2.8" height="0.9" rx="0.4" fill="#2a2a2a" />
    </motion.g>
  );
}

interface DjArmProps {
  x: number;
  y: number;
  shoulderRotate: number[];
  elbowRotate: number[];
  transition: Transition;
}

/** Brazo del DJ con hombro y codo articulados, terminado en una mano. */
function DjArm({ x, y, shoulderRotate, elbowRotate, transition }: DjArmProps) {
  return (
    <motion.g style={{ x, y }} animate={{ rotate: shoulderRotate }} transition={transition}>
      <path
        d="M-1.3 0 C-1.4 1.6 -1.2 3.2 -1 4.8 L1 4.8 C1.2 3.2 1.4 1.6 1.3 0 Z"
        fill="url(#djSkinGrad)"
      />
      <motion.g style={{ x: 0, y: 4.8 }} animate={{ rotate: elbowRotate }} transition={transition}>
        <circle r="0.7" fill="url(#djSkinGrad)" />
        <path
          d="M-0.9 0 C-0.95 1.4 -0.8 2.8 -0.65 4.2 L0.65 4.2 C0.8 2.8 0.95 1.4 0.9 0 Z"
          fill="url(#djSkinGrad)"
        />
        <circle cx="0" cy="4.2" r="0.95" fill="url(#djSkinGrad)" />
      </motion.g>
    </motion.g>
  );
}

/** Plato giratorio con brazo fonocaptor, gira sin parar. */
function Turntable({ x }: { x: number }) {
  return (
    <g>
      <circle cx={x} cy="-7" r="2.2" fill="#2a2a2a" />
      <motion.g
        style={{ x, y: -7 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      >
        <circle r="1.9" fill="#111" />
        <circle r="0.35" fill="#c9a13a" />
        <line x1="0" y1="0" x2="1.6" y2="-0.4" stroke="#4a4a4a" strokeWidth="0.25" />
      </motion.g>
      <line x1={x + 1.6} y1="-9.2" x2={x + 2.6} y2="-8" stroke="#9c9c9c" strokeWidth="0.4" strokeLinecap="round" />
    </g>
  );
}

/**
 * Mesa de mezclas y DJ, sobre el escenario: cara con ojos/cejas/sonrisa, piel
 * con degradado, pelo con textura, dos brazos con hombro y codo articulados
 * de verdad (uno rasca el plato, el otro se levanta de fiesta) y cascos
 * grandes con banda acolchada y almohadillas en capas. Cabecea y se balancea
 * sin parar.
 */
function DjBooth() {
  return (
    <motion.g style={{ x: 65, y: 14 }} animate={{ y: [14, 12.4, 14], rotate: [-2, 2, -2] }} transition={DJ_BOB}>
      {/* mesa de mezclas: panel con leds + dos platos */}
      <rect x="-11" y="-7" width="22" height="7" rx="1" fill="#151515" />
      <rect x="-8.5" y="-5.7" width="6" height="1.4" rx="0.4" fill="#0a0a0a" />
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={-7.8 + i * 1.3}
          cy="-5"
          r="0.28"
          fill={i % 2 === 0 ? "#34d399" : "#fbbf24"}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
      <Turntable x={-5} />
      <Turntable x={5} />

      {/* brazos: se dibujan ANTES que el torso, así el hombro queda detrás de él
          (sólo se ve el brazo por delante a partir de donde asoma). Nacen justo
          bajo la barbilla, a la altura del cuello, no a media camiseta. */}
      {/* brazo izquierdo: levantado y abierto hacia fuera (arriba-izquierda), de fiesta */}
      <DjArm x={-3.2} y={-16.4} shoulderRotate={[118, 148, 118]} elbowRotate={[8, 22, 8]} transition={DJ_HANDS_UP} />
      {/* brazo derecho: baja hacia el plato de la derecha y lo rasca */}
      <DjArm x={3.2} y={-16.4} shoulderRotate={[-6, -26, -6]} elbowRotate={[6, -34, 6]} transition={DJ_SCRATCH} />

      {/* cuerpo: camiseta con degradado, por delante del nacimiento de los brazos */}
      <rect x="-3.6" y="-16.5" width="7.2" height="9.5" rx="2.2" fill="url(#djShirtGrad)" />

      {/* pelo, con mechones para dar textura */}
      <path
        d="M-3.7 -21.2 C-4 -24.6 -1.8 -26 0 -26 C1.8 -26 4 -24.6 3.7 -21.2 Z"
        fill="url(#djHairGrad)"
      />
      <path d="M-2.6 -24.6 C-2.3 -23.6 -2.4 -22.6 -2.7 -21.8" stroke="#241408" strokeWidth="0.25" fill="none" />
      <path d="M0 -25.4 C0.1 -24.2 0 -23 -0.15 -21.9" stroke="#241408" strokeWidth="0.25" fill="none" />
      <path d="M2.6 -24.6 C2.3 -23.6 2.4 -22.6 2.7 -21.8" stroke="#241408" strokeWidth="0.25" fill="none" />

      {/* cascos: banda acolchada + almohadillas en capas (carcasa + relleno + brillo metálico).
          Se dibujan ANTES que la cabeza, para que quedan detrás de ella: la
          banda pasa por detrás del cráneo y sólo asoman las almohadillas. */}
      <path
        d="M-4.3 -21.6 C-4.6 -25.8 -2 -27.7 0 -27.7 C2 -27.7 4.6 -25.8 4.3 -21.6"
        stroke="#161616"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-4.3 -21.6 C-4.6 -25.8 -2 -27.7 0 -27.7 C2 -27.7 4.6 -25.8 4.3 -21.6"
        stroke="#4a4a4a"
        strokeWidth="0.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="-4.3" cy="-20.7" r="2" fill="#1a1a1a" stroke="#4a4a4a" strokeWidth="0.35" />
      <circle cx="-4.3" cy="-20.7" r="1.15" fill="#2e2e2e" />
      <circle cx="4.3" cy="-20.7" r="2" fill="#1a1a1a" stroke="#4a4a4a" strokeWidth="0.35" />
      <circle cx="4.3" cy="-20.7" r="1.15" fill="#2e2e2e" />

      {/* cabeza, con degradado de piel, por delante de los cascos */}
      <circle cx="0" cy="-20.5" r="3.6" fill="url(#djSkinGrad)" />

      {/* cara: cejas, ojos con brillo, y sonrisa */}
      <path d="M-2.2 -22.1 C-1.8 -22.5 -1.1 -22.5 -0.7 -22.1" stroke="#3b2413" strokeWidth="0.35" fill="none" strokeLinecap="round" />
      <path d="M0.7 -22.1 C1.1 -22.5 1.8 -22.5 2.2 -22.1" stroke="#3b2413" strokeWidth="0.35" fill="none" strokeLinecap="round" />
      <ellipse cx="-1.35" cy="-20.7" rx="0.5" ry="0.62" fill="#2a1a10" />
      <ellipse cx="1.35" cy="-20.7" rx="0.5" ry="0.62" fill="#2a1a10" />
      <circle cx="-1.15" cy="-20.9" r="0.16" fill="#fff" opacity="0.85" />
      <circle cx="1.55" cy="-20.9" r="0.16" fill="#fff" opacity="0.85" />
      <path d="M-0.35 -19.4 C-0.15 -19.1 0.15 -19.1 0.35 -19.4" stroke="#8a5a3a" strokeWidth="0.3" fill="none" strokeLinecap="round" />
      <path d="M-1.3 -18.6 C-0.5 -17.9 0.5 -17.9 1.3 -18.6" stroke="#5a2f1f" strokeWidth="0.45" fill="none" strokeLinecap="round" />
    </motion.g>
  );
}

/**
 * Escenario de discomóvil montado por partes, en el centro de la cabecera
 * (no cruza de lado a lado): primero la viga con los focos en movimiento
 * baja desde arriba; luego el escenario sube desde abajo; luego lo típico
 * de una discomóvil (altavoces, banners); y por último la mesa y el DJ.
 * Cada pieza entra escalonada y con rebote. Al desmontarse (controlado por
 * el padre vía AnimatePresence) todo sale a la vez, cada pieza por donde
 * entró — ver `containerVariants`.
 */
export function DiscoStage({ className }: DiscoStageProps) {
  return (
    <motion.svg
      viewBox="0 -34 130 62"
      fill="none"
      className={className}
      aria-hidden="true"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <defs>
        <radialGradient id="mirrorBallGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f2f2f2" />
          <stop offset="100%" stopColor="#9a9a9a" />
        </radialGradient>
        <linearGradient id="bannerGradA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#a21caf" />
        </linearGradient>
        <linearGradient id="bannerGradB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="speakerBodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9c9c9c" />
          <stop offset="100%" stopColor="#6d6d6d" />
        </linearGradient>
        <radialGradient id="speakerMeshGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id="djShirtGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
        <radialGradient id="djSkinGrad" cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#f2c397" />
          <stop offset="100%" stopColor="#d9a06c" />
        </radialGradient>
        <linearGradient id="djHairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2c16" />
          <stop offset="100%" stopColor="#241408" />
        </linearGradient>
        <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>

      {/* 1: viga con focos y bola de espejos, entra desde arriba */}
      <motion.g variants={fromTopVariants}>
        <rect x="10" y="-30" width="110" height="3" rx="1" fill="#1a1a1a" />
        <MovingHeadLight x={30} delay={0} />
        <MovingHeadLight x={55} delay={0.3} />
        <MovingHeadLight x={80} delay={0.6} />
        <MovingHeadLight x={105} delay={0.9} />
        <MirrorBall />
      </motion.g>

      {/* 2: escenario, entra desde abajo */}
      <motion.g variants={fromBottomVariants}>
        <rect x="14" y="14" width="102" height="7" rx="1" fill="url(#stageGrad)" />
      </motion.g>

      {/* 3: lo típico de una discomóvil sobre el escenario: altavoces + banners, entra desde abajo (agrupados cerca del DJ, en el centro) */}
      <motion.g variants={fromBottomVariants}>
        <StageSpeaker x={42} />
        <StageSpeaker x={88} />
        <Banner x={32} gradientId="bannerGradA" />
        <Banner x={98} gradientId="bannerGradB" />
      </motion.g>

      {/* 4: mesa y DJ, la última pieza, entra desde abajo */}
      <motion.g variants={fromBottomVariants}>
        <DjBooth />
      </motion.g>
    </motion.svg>
  );
}
