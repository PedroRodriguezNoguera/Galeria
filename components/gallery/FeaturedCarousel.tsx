"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
  type Variants,
} from "framer-motion";
import type { MediaRecord } from "@/types/media";
import { PhotoZoomView } from "@/components/viewer/PhotoZoomView";
import { VideoPlayerView } from "@/components/viewer/VideoPlayerView";
import { ConfettiCanvas } from "@/components/layout/ConfettiCanvas";
import { Logo } from "@/components/layout/Logo";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { springSwipe, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface FeaturedCarouselProps {
  items: MediaRecord[];
}

type StackEntry =
  | { kind: "welcome" }
  | { kind: "media"; media: MediaRecord }
  | { kind: "thanks" };

const AUTO_ADVANCE_MS = 6000;
const SWIPE_DISTANCE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 500;
const OFFSCREEN_DISTANCE = 900;
const VISIBLE_STACK_DEPTH = 4;

/** Offset determinista (mismo resultado siempre para la misma posición): nada de Math.random en cada render. */
function stackOffset(position: number) {
  const seed = (n: number) => {
    const value = Math.sin(n) * 43758.5453;
    return value - Math.floor(value);
  };
  const x = (seed(position * 12.9898) - 0.5) * 28;
  const y = position * 10 + (seed(position * 78.233) - 0.5) * 10;
  const rotate = (seed(position * 39.346) - 0.5) * 14;
  return { x, y, rotate };
}

const frontVariants: Variants = {
  center: { x: 0, y: 0, rotate: 0, opacity: 1 },
  exit: (direction: { x: number; y: number }) => ({
    x: direction.x,
    y: direction.y,
    rotate: direction.x === 0 ? 0 : direction.x > 0 ? 20 : -20,
    opacity: 0,
  }),
};

/**
 * Pantalla superpuesta (fixed, por encima de todo, mismo lenguaje visual que
 * MediaViewer) al entrar a la galería si "destacados" está activado: una pila
 * de "visores" individuales, uno encima de otro, cada uno un poco
 * desplazado/rotado salvo el de delante (en su sitio exacto). Se avanza
 * arrastrando el de delante fuera de la pantalla, o solo, cada 4s. El primer
 * elemento es una tarjeta de bienvenida y el último la de agradecimiento con
 * confeti; ninguna de las dos es una foto y ninguna avanza sola — sólo se van
 * si se arrastran. Al terminar, toda la pantalla se desvanece y deja ver la
 * galería de siempre debajo.
 */
export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState({ x: -OFFSCREEN_DISTANCE, y: 0 });
  // Con la foto de delante ampliada, el arrastre de la propia tarjeta (que
  // avanza/cierra el carrusel) se desactiva: si no, compite con el pan de la
  // imagen y cada gesto para ver un detalle acaba moviendo la tarjeta entera.
  // Ver PhotoZoomView.onZoomChange (mismo patrón que MediaViewer).
  const [isZoomed, setIsZoomed] = useState(false);
  // Duración real de cada vídeo destacado, en cuanto el navegador la conoce
  // (ver VideoPlayerView.onDurationChange): así la tarjeta de un vídeo dura
  // lo que dura el vídeo en vez del AUTO_ADVANCE_MS fijo de las fotos.
  const [videoDurationsMs, setVideoDurationsMs] = useState<Record<string, number>>({});
  // Barra de progreso del visor de delante: un único MotionValue reutilizado
  // (no re-renderiza React al actualizarse), controlado por animate().
  const progress = useMotionValue(0);
  const progressControlsRef = useRef<AnimationPlaybackControls | null>(null);

  const stack: StackEntry[] = [
    { kind: "welcome" as const },
    ...items.map((media) => ({ kind: "media" as const, media })),
    { kind: "thanks" as const },
  ];
  const finished = currentIndex >= stack.length;
  const frontEntry = stack[currentIndex];
  // Las tarjetas de bienvenida y agradecimiento (primera y última) no tienen
  // fecha de caducidad: se quedan hasta que alguien las aparte con el dedo,
  // no desaparecen solas (por eso tampoco tienen barra de progreso, ver más
  // abajo).
  const isStaticFront = frontEntry?.kind !== "media";
  const isFrontVideo = frontEntry?.kind === "media" && frontEntry.media.media_type === "video";
  const frontVideoDurationMs = isFrontVideo ? videoDurationsMs[frontEntry.media.id] : undefined;

  const handleVideoDuration = useCallback((mediaId: string, durationSeconds: number) => {
    setVideoDurationsMs((current) =>
      current[mediaId] === undefined
        ? { ...current, [mediaId]: durationSeconds * 1000 }
        : current,
    );
  }, []);

  const advance = useCallback(
    (direction: { x: number; y: number }) => {
      // Con reduced-motion no hay arrastre (ver drag={!prefersReducedMotion}
      // más abajo) pero el avance automático sigue: sólo se anula el
      // desplazamiento grande, así la salida es un fundido en el sitio en vez
      // de "volar" fuera de la pantalla.
      setLastDirection(prefersReducedMotion ? { x: 0, y: 0 } : direction);
      setIsZoomed(false);
      setCurrentIndex((current) => current + 1);
    },
    [prefersReducedMotion],
  );

  // El reloj del avance automático ES la propia animación de la barra:
  // animate() de Framer Motion soporta pause()/play() respetando el punto
  // exacto donde se quedó (no reinicia), así que mantener pulsado el visor
  // (ver onPointerDown/Up del visor de delante) detiene el avance de verdad,
  // no sólo la vista. Si el de delante es un vídeo, se espera a conocer su
  // duración real (ver videoDurationsMs) antes de arrancar la barra: así
  // nunca dura menos ni más que el propio vídeo.
  useEffect(() => {
    progressControlsRef.current?.stop();
    progress.set(0);
    if (finished || isStaticFront) return;
    if (isFrontVideo && frontVideoDurationMs === undefined) return;

    progressControlsRef.current = animate(progress, 1, {
      duration: (isFrontVideo ? frontVideoDurationMs! : AUTO_ADVANCE_MS) / 1000,
      ease: "linear",
      onComplete: () => advance({ x: -OFFSCREEN_DISTANCE, y: 0 }),
    });

    return () => progressControlsRef.current?.stop();
  }, [currentIndex, finished, isStaticFront, isFrontVideo, frontVideoDurationMs, progress, advance]);

  function pauseProgress() {
    progressControlsRef.current?.pause();
  }

  function resumeProgress() {
    progressControlsRef.current?.play();
  }

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const distance = Math.hypot(info.offset.x, info.offset.y);
    const speed = Math.hypot(info.velocity.x, info.velocity.y);
    if (distance < SWIPE_DISTANCE_THRESHOLD && speed < SWIPE_VELOCITY_THRESHOLD) return;
    const angle = Math.atan2(info.offset.y, info.offset.x);
    advance({ x: Math.cos(angle) * OFFSCREEN_DISTANCE, y: Math.sin(angle) * OFFSCREEN_DISTANCE });
  }

  if (items.length === 0) return null;

  const visible = stack.slice(currentIndex, currentIndex + VISIBLE_STACK_DEPTH);

  return (
    <AnimatePresence>
      {!finished ? (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-8"
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-lg backdrop-saturate-150"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            aria-hidden="true"
          />

          <div className="relative h-full max-h-[calc(100vh-2rem)] w-full max-w-lg scale-[0.8] lg:max-w-2xl xl:max-w-3xl">
            <AnimatePresence custom={lastDirection} initial={false}>
              {visible.map((entry, position) => {
                const isFront = position === 0;
                const key = entry.kind === "media" ? entry.media.id : entry.kind;

                if (isFront) {
                  return (
                    <motion.div
                      key={key}
                      className="absolute inset-0"
                      style={{ zIndex: visible.length }}
                      custom={lastDirection}
                      variants={frontVariants}
                      initial={false}
                      animate="center"
                      exit="exit"
                      transition={prefersReducedMotion ? fadeTransition : springSwipe}
                      drag={!prefersReducedMotion && !isZoomed}
                      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                      dragElastic={0.85}
                      onPointerDown={pauseProgress}
                      onPointerUp={resumeProgress}
                      onPointerCancel={resumeProgress}
                      onDragEnd={handleDragEnd}
                    >
                      <FeaturedCard
                        entry={entry}
                        progress={isStaticFront ? undefined : progress}
                        onZoomChange={setIsZoomed}
                        onVideoDurationChange={handleVideoDuration}
                      />
                    </motion.div>
                  );
                }

                const offset = stackOffset(position);
                return (
                  <motion.div
                    key={key}
                    className="absolute inset-0"
                    style={{ zIndex: visible.length - position }}
                    initial={false}
                    animate={{ x: offset.x, y: offset.y, rotate: offset.rotate, opacity: 1 }}
                    transition={springSwipe}
                  >
                    <FeaturedCard entry={entry} onVideoDurationChange={handleVideoDuration} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface FeaturedCardProps {
  entry: StackEntry;
  /** Ausente en las tarjetas de bienvenida y agradecimiento: no tienen barra, no avanzan solas. */
  progress?: MotionValue<number>;
  /** Sólo se pasa en la tarjeta de delante: es la única con drag que puede competir con el zoom. */
  onZoomChange?: (isZoomed: boolean) => void;
  onVideoDurationChange?: (mediaId: string, durationSeconds: number) => void;
}

function FeaturedCard({ entry, progress, onZoomChange, onVideoDurationChange }: FeaturedCardProps) {
  return (
    <GlassPanel
      strong
      elevation="lg"
      className="relative h-full w-full overflow-hidden rounded-glass-xl"
    >
      {/* Dentro del propio panel (que ya recorta con overflow-hidden +
          rounded-glass-xl): así queda pegada al borde superior de verdad, sin
          hueco, y sigue la misma curva de las esquinas en vez de tapar por
          fuera. */}
      {progress ? (
        <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/30">
          <motion.div
            className="h-full origin-left bg-white"
            style={{ scaleX: progress }}
          />
        </div>
      ) : null}

      {entry.kind === "media" ? (
        entry.media.media_type === "image" ? (
          <PhotoZoomView media={entry.media} onZoomChange={onZoomChange} />
        ) : (
          <VideoPlayerView
            media={entry.media}
            onDurationChange={(duration) => onVideoDurationChange?.(entry.media.id, duration)}
          />
        )
      ) : entry.kind === "welcome" ? (
        <WelcomeCard />
      ) : (
        <ThankYouCard />
      )}
    </GlassPanel>
  );
}

function WelcomeCard() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-glass-strong px-8 text-center">
      <ConfettiCanvas className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 h-16 w-16 shrink-0">
        <Logo />
      </div>
      <div className="relative z-10 space-y-2">
        <p className="text-2xl font-extrabold tracking-tight text-foreground">
          ¡Bienvenido/a a las fiestas 2026!
        </p>
        <p className="text-base text-foreground-muted">
          Estos son los momentos más destacados. Desliza para descubrirlos.
        </p>
      </div>
    </div>
  );
}

function ThankYouCard() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-glass-strong px-8 text-center">
      <ConfettiCanvas className="pointer-events-none absolute inset-0 h-full w-full" intense />
      <p className="relative z-10 text-2xl font-extrabold tracking-tight text-foreground">
        ¡Gracias por participar en las fiestas 2026!
      </p>
    </div>
  );
}
