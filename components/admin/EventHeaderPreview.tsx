"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { RunningBull } from "@/components/layout/RunningBull";
import { RunningPerson } from "@/components/layout/RunningPerson";
import { ConfettiCanvas } from "@/components/layout/ConfettiCanvas";
import { PartyVan } from "@/components/layout/PartyVan";
import { Charanga } from "@/components/layout/Charanga";
import { DiscoStage } from "@/components/layout/DiscoStage";
import { CrateReleaseScene } from "@/components/layout/HeaderCrateReleaseEvent";
import { CenaPatronalScene } from "@/components/layout/CenaPatronal";
import { ChupinazoScene } from "@/components/layout/Chupinazo";
import { Mozo } from "@/components/layout/Mozo";
import { EncierroFence } from "@/components/layout/EncierroFence";
import type { EventTheme } from "@/constants/eventThemes";

interface EventHeaderPreviewProps {
  theme: EventTheme;
  title: string;
  subtitle: string;
}

/** Igual que el cruce real de la cabecera, pero en bucle sin parar (aquí no hace falta esperar a una actividad). */
function CrossingLoop({ children, seconds }: { children: ReactNode; seconds: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <motion.div
        className="absolute bottom-0.5 flex items-end"
        initial={{ left: "-25%" }}
        animate={{ left: "115%" }}
        transition={{ duration: seconds, ease: "easeInOut", repeat: Infinity }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** El confeti en la cabecera es una OLEADA temporal, no un estado fijo: aquí se simula alternando calma/intenso. */
function ConfettiWavePreview({ className }: { className?: string }) {
  const [intense, setIntense] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setIntense((current) => !current), 2500);
    return () => clearInterval(id);
  }, []);

  return <ConfettiCanvas className={className} intense={intense} />;
}

/** DiscoStage sólo se anima al montarse/desmontarse: aquí se fuerza ese ciclo en bucle para la vista previa. */
function DiscoStageLoop({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((current) => !current), 3200);
    return () => clearInterval(id);
  }, []);

  return <AnimatePresence>{visible ? <DiscoStage className={className} /> : null}</AnimatePresence>;
}

/** La vajilla de la cena patronal se monta/desmonta por tiempo (no por onComplete): aquí se fuerza ese ciclo en bucle. */
function CenaPatronalLoop({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((current) => !current), 4200);
    return () => clearInterval(id);
  }, []);

  return <AnimatePresence>{visible ? <CenaPatronalScene className={className} /> : null}</AnimatePresence>;
}

/** El chupinazo se monta/desmonta por tiempo (no por onComplete): aquí se fuerza ese ciclo en bucle. */
function ChupinazoLoop() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((current) => !current), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      {visible ? <ChupinazoScene launchLeftPercent={20} targetLeftPercent={74} /> : null}
    </AnimatePresence>
  );
}

const ENCIERRO_DURATION_SECONDS = 5;
// Ver el razonamiento completo en HeaderEncierroEvent.tsx: el mozo que
// tropieza va el último de la fila (~170px por detrás del ancla del grupo),
// así que hace falta compensar ese desplazamiento fijo además de centrar la
// ventana de caída — 0.195, no 0.47.
const ENCIERRO_STUMBLE_AT = 0.195;
const ENCIERRO_FENCE_FADE_SECONDS = 0.3;

/**
 * Igual que el cruce real del encierro (HeaderEncierroEvent), pero
 * reiniciando el ciclo entero por estado en vez de `repeat: Infinity` en el
 * `motion.div` — el tropiezo del mozo es un movimiento DE UN SOLO DISPARO
 * (sin `repeat`), así que con `repeat: Infinity` en el contenedor sólo se
 * vería en la primera vuelta; remontando el grupo entero cada ciclo (misma
 * técnica que CenaPatronalLoop/ChupinazoLoop) se repite siempre.
 */
function EncierroLoop() {
  const [cycle, setCycle] = useState(0);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={`fence-top-${cycle}`}
          className="absolute inset-x-0 top-0 z-[4] h-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ENCIERRO_FENCE_FADE_SECONDS }}
        >
          <EncierroFence className="h-full w-full" />
        </motion.div>
        <motion.div
          key={`fence-bottom-${cycle}`}
          className="absolute inset-x-0 bottom-0 z-[4] h-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ENCIERRO_FENCE_FADE_SECONDS }}
        >
          <EncierroFence className="h-full w-full -scale-y-100" />
        </motion.div>
        <motion.div
          key={cycle}
          className="absolute bottom-0.5 flex items-end"
          initial={{ left: "-28%" }}
          animate={{ left: "118%" }}
          transition={{ duration: ENCIERRO_DURATION_SECONDS, ease: "linear" }}
          onAnimationComplete={() => setCycle((current) => current + 1)}
        >
          <RunningBull variant="cabestro" className="h-8 w-14 shrink-0" />
          <RunningBull variant="normal" className="-ml-5 h-8 w-14 shrink-0" />
          <RunningBull variant="normal" className="-ml-5 h-8 w-14 shrink-0" />
          <Mozo shirtTone="#efe9da" className="ml-4 h-7 w-4 shrink-0" />
          <Mozo shirtTone="#f7f3e8" className="-ml-1 h-7 w-4 shrink-0" />
          <Mozo
            shirtTone="#f5f1e6"
            className="-ml-1 h-7 w-4 shrink-0"
            stumbleAtFraction={ENCIERRO_STUMBLE_AT}
            crossingDurationSeconds={ENCIERRO_DURATION_SECONDS}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** La escena de la desencajonada se dispara una vez por actividad: aquí se reinicia sola en cuanto termina. */
function CrateReleaseLoop() {
  const [cycle, setCycle] = useState(0);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <AnimatePresence>
        <CrateReleaseScene key={cycle} onComplete={() => setCycle((current) => current + 1)} />
      </AnimatePresence>
    </div>
  );
}

function EventThemeAnimation({ theme }: { theme: EventTheme }) {
  if (theme === "toro" || theme === "toro_embolado") {
    return (
      <CrossingLoop seconds={6}>
        <RunningBull
          variant={theme === "toro_embolado" ? "embolado" : "normal"}
          className="h-9 w-[4.5rem] shrink-0"
        />
        <RunningPerson className="-ml-1.5 h-8 w-5 shrink-0" />
      </CrossingLoop>
    );
  }
  if (theme === "furgoneta") {
    return (
      <CrossingLoop seconds={6}>
        <PartyVan className="h-12 w-44 shrink-0" />
      </CrossingLoop>
    );
  }
  if (theme === "charanga") {
    return (
      <CrossingLoop seconds={8}>
        <Charanga className="h-[52px] w-[140px] shrink-0" />
      </CrossingLoop>
    );
  }
  if (theme === "confeti") {
    return <ConfettiWavePreview className="pointer-events-none absolute inset-0 h-full w-full" />;
  }
  if (theme === "desencajonada") {
    return <CrateReleaseLoop />;
  }
  if (theme === "cena_patronal") {
    // no cruza, cae fija en left-[30%] (misma posición que la cabecera real)
    return (
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        <CenaPatronalLoop className="absolute bottom-0.5 left-[30%] h-12 w-[126px]" />
      </div>
    );
  }
  if (theme === "chupinazo") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        <ChupinazoLoop />
      </div>
    );
  }
  if (theme === "encierro") {
    return <EncierroLoop />;
  }
  // discomovil: no cruza, fija en left-[30%] (misma posición que la cena patronal y que la cabecera real)
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      <DiscoStageLoop className="absolute bottom-0.5 left-[30%] h-[52px] w-[110px]" />
    </div>
  );
}

/**
 * Réplica de la cabecera real de la galería (misma píldora de cristal), sin
 * el logo, el confeti ambiente ni el texto "¡Felices Fiestas!" — en su lugar,
 * la animación del tema asignado en bucle y la información de ese evento.
 * Así se ve de un vistazo exactamente lo que pasará en la cabecera cuando
 * ese evento esté activo.
 */
export function EventHeaderPreview({ theme, title, subtitle }: EventHeaderPreviewProps) {
  return (
    <GlassPanel
      elevation="sm"
      className="relative flex w-full max-w-2xl min-h-[4.25rem] items-center overflow-hidden rounded-glass-pill px-4 py-2.5"
    >
      <EventThemeAnimation theme={theme} />

      <div className="relative z-10 ml-auto min-w-0 text-right">
        <p className="truncate text-[15px] font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-foreground-muted">{subtitle}</p>
      </div>
    </GlassPanel>
  );
}
