"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ConfettiCanvas } from "@/components/layout/ConfettiCanvas";
import { AnimatedClockIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";
import {
  useUpcomingEventCountdown,
  type UpcomingEventCountdown,
} from "@/hooks/useUpcomingEventCountdown";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { onCarouselFinished } from "@/lib/events/carouselBus";
import { fadeTransition } from "@/animations/springs";

interface EventCountdownNoticeProps {
  /** Si hay carrusel de destacados, se espera a que termine antes de poder aparecer (ver más abajo). */
  hasFeaturedCarousel: boolean;
}

function formatRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes} min` : `${minutes}:${String(rest).padStart(2, "0")} min`;
  }
  // Sólo se ve en el primer segundo de la ventana (ahora de 1h): a partir de
  // ahí ya baja de 3600 y cae en el formato de minutos de arriba.
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes === 0 ? `${hours} h` : `${hours}h ${minutes}min`;
}

const EXIT_TRANSITION = { duration: 0.22, ease: "easeIn" } as const;

// Propios de este componente, más lentos y con más rebote que springGentle/
// springPop (pensados para saltos de foto y para iconos pequeños, no para
// este vaivén de llegada + ensanches en cadena).
const ENTER_TRANSITION = { type: "spring", stiffness: 140, damping: 12, mass: 1.3 } as const;
const STAGE_TRANSITION = { type: "spring", stiffness: 170, damping: 11, mass: 1.1 } as const;
// El texto no sólo se desvanece: entra deslizándose un poco desde la
// izquierda (hacia donde se abre hueco) con su propio rebote, en vez de
// aparecer de golpe en cuanto el panel ya ha terminado de ensancharse.
const TEXT_ENTER_TRANSITION = { type: "spring", stiffness: 210, damping: 15, mass: 0.8, delay: 0.15 } as const;
const ICON_SWAP_TRANSITION = { type: "spring", stiffness: 260, damping: 14, mass: 0.7 } as const;

/** Pausa entre cada fase de la revelación (reloj → nombre → cuenta atrás). */
const STAGE_PAUSE_MS = 900;
/** Antes de la primera fase se espera algo más: da tiempo a que asiente el salto de entrada. */
const FIRST_STAGE_DELAY_MS = 1200;

/**
 * Aviso de "queda poco para el próximo evento", mismo lenguaje visual que los
 * toasts (GlassPanel + tipografía, ver components/ui/Toast). Vive en el hueco
 * entre el FAB de calendario (izquierda) y el de subida (derecha), a su misma
 * altura — por eso va comprimido a una sola línea y con padding lateral
 * suficiente (`px-20`, a juego con el ancho de esos dos FABs de 56px + margen)
 * para no poder invadirlos nunca, sea cual sea el ancho de pantalla. Esa
 * franja queda además claramente por debajo de donde arrancan UploadProgress
 * y la pila de toasts (ancladas más arriba, a `safe-area + 92px`), así que
 * tampoco se solapa con ellos. A diferencia del toast (se autodescarta solo a
 * los 3.2s), este puede quedar visible varios minutos, así que el cierre es
 * manual.
 *
 * `visible` sólo es true cuando `upcoming` ya está resuelto del todo (evento +
 * segundero, ver el hook): nunca se monta el panel a medias para luego
 * rellenarlo.
 *
 * Si hay carrusel de destacados (pantalla completa, por encima de esto), el
 * aviso se queda sin montar hasta que el carrusel avisa de que ha terminado
 * (ver lib/events/carouselBus): si no, jugaría su animación de entrada nada
 * más cargar la página, oculto detrás del carrusel, y para cuando éste se
 * cierre el aviso ya estaría quieto.
 *
 * La revelación en sí (fases del reloj → nombre → tiempo) vive en
 * CountdownCard, más abajo.
 */
export function EventCountdownNotice({ hasFeaturedCarousel }: EventCountdownNoticeProps) {
  const upcoming = useUpcomingEventCountdown();
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [pastCarousel, setPastCarousel] = useState(!hasFeaturedCarousel);

  useEffect(() => {
    if (!hasFeaturedCarousel) return;
    return onCarouselFinished(() => setPastCarousel(true));
  }, [hasFeaturedCarousel]);

  const visible = Boolean(upcoming && upcoming.event.id !== dismissedId && pastCarousel);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+20px)] z-40 flex justify-center px-20">
      <AnimatePresence>
        {visible && upcoming ? (
          <CountdownCard
            key={upcoming.event.id}
            upcoming={upcoming}
            onDismiss={() => setDismissedId(upcoming.event.id)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

interface CountdownCardProps {
  upcoming: UpcomingEventCountdown;
  onDismiss: () => void;
}

/**
 * Se monta una vez por evento (key={event.id} en el padre), así que el estado
 * de fase (`stage`) nace a 0 cada vez sin tener que resetearlo a mano. Tres
 * fases, cada una añadiendo contenido: 0 = sólo el reloj (el panel nace como
 * un círculo de 56px, igual que los FABs de al lado — h-14 + rounded-glass-lg
 * a 28px de radio en una caja cuadrada da exactamente eso), 1 = + nombre del
 * evento, 2 = + cuenta atrás y botón de cerrar. `layout` en el propio
 * GlassPanel es lo que anima el ensanche entre fases — nada de calcular
 * anchos a mano, Framer Motion mide el tamaño real antes/después y lo
 * interpola con STAGE_TRANSITION, con una pausa entre fase y fase. El texto
 * de cada fase no sólo se desvanece: entra deslizándose desde la izquierda
 * con su propio rebote (TEXT_ENTER_TRANSITION, con un pequeño retraso), para
 * que se note como movimiento, no como un simple fundido en el sitio. Con
 * prefers-reduced-motion se salta directo a la fase final, sin fases ni rebote.
 *
 * Cuando el evento arranca (secondsRemaining <= 0, ver GRACE_SECONDS en el
 * hook), en vez de cerrarse sin más hay un remate de un par de segundos: el
 * reloj se cambia por un check, el texto pasa a "¡Ya empieza!" con un pulso,
 * cae confeti dentro del propio panel y (si el dispositivo lo soporta) un
 * golpe de vibración — todo disparado una sola vez (hasFiredFinale). Pasado
 * ese margen, el hook deja de devolver el evento y el panel se cierra solo
 * con su animación de salida de siempre.
 */
function CountdownCard({ upcoming, onDismiss }: CountdownCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState(prefersReducedMotion ? 2 : 0);
  const isFinale = upcoming.secondsRemaining <= 0;
  const finaleTextRef = useRef<HTMLSpanElement>(null);
  const hasFiredFinale = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setTimeout(() => setStage(1), FIRST_STAGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || stage !== 1) return;
    const timer = setTimeout(() => setStage(2), STAGE_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion, stage]);

  // Si el evento arranca antes de que termine la revelación normal (margen
  // pequeño, pero posible), se da por completa directamente: el remate
  // necesita el nombre y el hueco de la cuenta atrás ya montados. Derivado en
  // el render, no en un efecto: es un valor calculado a partir de las props,
  // no un estado que sincronizar con nada externo.
  const revealStage = isFinale ? 2 : stage;

  useEffect(() => {
    if (!isFinale || hasFiredFinale.current) return;
    hasFiredFinale.current = true;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(150);
    }
    if (!prefersReducedMotion && finaleTextRef.current) {
      animate(finaleTextRef.current, { scale: [1, 1.2, 1] }, { duration: 0.5, ease: "easeOut" });
    }
  }, [isFinale, prefersReducedMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 56, scale: 0.85 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: prefersReducedMotion ? fadeTransition : ENTER_TRANSITION,
      }}
      exit={{ opacity: 0, y: 24, scale: 0.95, transition: EXIT_TRANSITION }}
      className="pointer-events-auto h-14 max-w-full"
    >
      <GlassPanel
        strong
        elevation="lg"
        // Sólo se activa a partir de la fase 1: si ya estuviera activo en la
        // fase 0, Framer Motion aplica una corrección de escala a este panel
        // para compensar el `scale` que todavía está animando el contenedor
        // de arriba (el salto de entrada) — con el cristal translúcido eso se
        // nota como un parpadeo de transparencia. Para cuando llega la fase 1
        // ese `scale` ya ha terminado de asentar, así que no hay nada que
        // compensar.
        layout={!prefersReducedMotion && revealStage >= 1}
        transition={prefersReducedMotion ? fadeTransition : STAGE_TRANSITION}
        className="relative flex h-14 max-w-full items-center gap-2 overflow-hidden px-4"
      >
        {/* Sólo durante el remate: confeti recortado a la propia forma del panel. */}
        {isFinale ? (
          <ConfettiCanvas
            className="pointer-events-none absolute inset-0 h-full w-full"
            intense
          />
        ) : null}

        <AnimatePresence mode="popLayout" initial={false}>
          {isFinale ? (
            <motion.span
              key="check"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={prefersReducedMotion ? fadeTransition : ICON_SWAP_TRANSITION}
              className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center text-foreground"
            >
              <CheckIcon className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="clock"
              initial={false}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={prefersReducedMotion ? fadeTransition : ICON_SWAP_TRANSITION}
              className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center text-foreground"
            >
              <AnimatedClockIcon className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {revealStage >= 1 ? (
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: prefersReducedMotion ? fadeTransition : TEXT_ENTER_TRANSITION,
            }}
            className="relative z-10 min-w-0 truncate text-[13px] font-medium leading-tight"
          >
            {upcoming.event.name}
          </motion.p>
        ) : null}

        {revealStage >= 2 ? (
          <>
            <motion.span
              ref={finaleTextRef}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: prefersReducedMotion ? fadeTransition : TEXT_ENTER_TRANSITION,
              }}
              className="relative z-10 shrink-0 whitespace-nowrap text-[13px] font-normal text-foreground-muted"
            >
              {isFinale ? "· ¡Ya empieza!" : `· en ${formatRemaining(upcoming.secondsRemaining)}`}
            </motion.span>
            <motion.button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar aviso"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: prefersReducedMotion ? fadeTransition : TEXT_ENTER_TRANSITION,
              }}
              className="relative z-10 shrink-0 rounded-full p-1 text-foreground-muted"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </motion.button>
          </>
        ) : null}
      </GlassPanel>
    </motion.div>
  );
}
