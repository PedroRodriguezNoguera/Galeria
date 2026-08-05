"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { MediaRecord } from "@/types/media";
import type { ReactionCounts } from "@/types/reaction";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MapPinIcon } from "@/components/ui/icons";
import { PhotoZoomView } from "./PhotoZoomView";
import { VideoPlayerView } from "./VideoPlayerView";
import { ReactionBar } from "./ReactionBar";
import { MediaPreloader } from "./MediaPreloader";
import { useAdjacentMedia } from "@/hooks/useAdjacentMedia";
import { useNearbyMedia } from "@/hooks/useNearbyMedia";
import { useMapEnabled } from "@/hooks/useMapEnabled";
import { useStreetViewBlockedByUsage } from "@/hooks/useStreetViewUsage";
import { useZoomSafeDrag } from "@/hooks/useZoomSafeDrag";
import { flushPendingActivity } from "@/lib/events/activityBus";
import { requestScrollToMedia } from "@/lib/events/scrollBus";
import { springGentle, springSwipe, fadeTransition } from "@/animations/springs";
import { slideHorizontal } from "@/animations/variants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// La Maps JS API (~cargar el SDK entero) sólo debe pedirse si el usuario abre
// de verdad la vista de calle (ver StreetViewOverlay): import dinámico +
// ssr:false, nunca junto al resto del visor.
const StreetViewOverlay = dynamic(
  () => import("./StreetViewOverlay").then((mod) => mod.StreetViewOverlay),
  { ssr: false },
);

interface MediaViewerProps {
  media: MediaRecord;
  initialReactionCounts?: ReactionCounts;
  initialMyReactionEmojis?: string[];
  /** Presente cuando se abrió desde una carpeta expandida: ver useAdjacentMedia. */
  albumId?: string | null;
  onClose: () => void;
}

const DISMISS_DRAG_THRESHOLD = 140;
const DISMISS_VELOCITY_THRESHOLD = 600;
const SWIPE_DRAG_THRESHOLD = 90;
const SWIPE_VELOCITY_THRESHOLD = 500;

/** Mismo criterio que formatBytes en AdminMediaViewer: una función de formato local, no un util compartido. */
function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

/**
 * Prioriza la fecha en la que se hizo la foto (EXIF, `taken_at`) sobre la de
 * subida — muchas fotos se comparten días/semanas después de tomarlas. Si el
 * archivo no traía EXIF (frecuente: capturas de pantalla, reediciones, o
 * simplemente un vídeo, que no tiene este dato), cae a la fecha de subida.
 */
function describeMediaDate(media: MediaRecord): string {
  if (media.taken_at) return `Tomada el ${formatDate(media.taken_at)}`;
  return `Subida el ${formatDate(media.created_at)}`;
}

export function MediaViewer({
  media,
  initialReactionCounts,
  initialMyReactionEmojis,
  albumId,
  onClose,
}: MediaViewerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // El cierre real (navegación) sólo ocurre cuando termina la animación de salida
  // (ver onExitComplete): así nunca desaparece de golpe, siempre se anima.
  const [isClosing, setIsClosing] = useState(false);

  // El elemento activo puede dejar de coincidir con `media` (la prop original,
  // la que abrió el visor) en cuanto el usuario desliza a otra foto/vídeo.
  // Sólo se lee como valor inicial: la propia navegación por swipe (goTo) es
  // la única vía real para cambiar de elemento sin remontar el componente.
  const [activeMedia, setActiveMedia] = useState(media);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  // Con la imagen ampliada, el arrastre del panel exterior (cerrar/deslizar
  // entre fotos) se desactiva: si no, compite con el pan de la imagen y el
  // gesto se siente inestable. Ver PhotoZoomView.onZoomChange.
  const [isZoomed, setIsZoomed] = useState(false);
  const { x, y, dragDisabled } = useZoomSafeDrag(isZoomed, prefersReducedMotion);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const { prevMedia, nextMedia } = useAdjacentMedia(activeMedia.id, albumId);
  const { next: nextNearby, prev: prevNearby } = useNearbyMedia(activeMedia.id, albumId);
  const mapEnabled = useMapEnabled();
  // Si este mes ya se ha acercado al límite gratis de Street View, se oculta
  // el icono directamente (ver STREET_VIEW_MONTHLY_SAFE_LIMIT): mejor no
  // ofrecer el botón que ofrecerlo y que falle al pulsarlo.
  const blockedByUsage = useStreetViewBlockedByUsage();
  // Sólo con las dos coordenadas: una suelta no sirve (ver confirmUpload, que
  // ya garantiza que nunca se guarda una a medias, pero el tipo sigue siendo
  // nullable por columna).
  const hasCoordinates = activeMedia.latitude != null && activeMedia.longitude != null;
  const showMapButton = mapEnabled && hasCoordinates && !blockedByUsage;

  function requestClose() {
    // Se corrige el scroll de fondo YA, no sólo al terminar (ver
    // handleExitComplete): si no, la lista de detrás se queda quieta en la
    // posición de antes de abrir el visor durante toda la animación de
    // cierre, y ésta parece encogerse sobre la primera foto en vez de sobre
    // la que se estaba viendo de verdad al deslizar entre varias.
    requestScrollToMedia(activeMedia.id);
    setIsClosing(true);
  }

  function goTo(target: MediaRecord, dir: "next" | "prev") {
    setDirection(dir);
    setActiveMedia(target);
    setIsZoomed(false);
    // History API directa, NO router.replace de Next: éste re-resuelve la ruta
    // server-side y remonta el visor (se veía como "cerrar y volver a abrir").
    // Sólo actualiza la URL visible/compartible; el propio componente nunca
    // se desmonta al deslizar, así la transición lateral es continua.
    // Conserva el ?album= si venía de una carpeta: si no, un refresco a mitad
    // de carpeta perdería el contexto y con él el deslizar entre sus fotos.
    const url = albumId ? `/media/${target.id}?album=${albumId}` : `/media/${target.id}`;
    window.history.replaceState(window.history.state, "", url);
  }

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absY >= absX) {
      if (info.offset.y > DISMISS_DRAG_THRESHOLD || info.velocity.y > DISMISS_VELOCITY_THRESHOLD) {
        requestClose();
      }
      return;
    }

    const crossedThreshold =
      absX > SWIPE_DRAG_THRESHOLD || Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;
    if (!crossedThreshold) return;

    if (info.offset.x < 0 && nextMedia) {
      goTo(nextMedia, "next");
    } else if (info.offset.x > 0 && prevMedia) {
      goTo(prevMedia, "prev");
    }
  }

  function handleExitComplete() {
    // Justo al volver a la lista principal, donde ya se ve la cabecera:
    // si se reaccionó mientras el visor tapaba la galería, la carrera del
    // toro se lanza aquí, no en el momento de reaccionar.
    flushPendingActivity();
    // El "volver atrás" del historial hace su propia restauración nativa del
    // scroll de antes de abrir el visor, que puede pisar la corrección ya
    // aplicada en requestClose: se repite aquí, después, para tener la
    // última palabra (ver scrollBus/GalleryGrid, que además la aplica con
    // doble rAF para ganarle la partida a esa restauración nativa).
    requestScrollToMedia(activeMedia.id);
    onClose();
  }

  return (
    <>
      <AnimatePresence onExitComplete={handleExitComplete}>
        {!isClosing ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8">
          <MediaPreloader key={activeMedia.id} next={nextNearby} prev={prevNearby} />
          <motion.div
            className="absolute inset-0 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            onClick={requestClose}
            aria-hidden="true"
          />

          <motion.div
            layoutId={`media-${activeMedia.id}`}
            style={{ x, y }}
            drag={!dragDisabled}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={{ top: 0, bottom: 0.6, left: 0.5, right: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={springGentle}
            className="relative flex h-full max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-glass-xl border border-glass-border bg-glass-strong backdrop-blur-xl backdrop-saturate-150 shadow-glass-lg lg:max-w-2xl xl:max-w-3xl"
          >
            {/* Foto/vídeo a sangre completa. Donde no llegue (letterbox por proporción)
                se ve el propio cristal del panel, es decir, lo que hay detrás de verdad
                (la galería difuminada) — nunca una copia ampliada de la imagen. */}
            <div className="absolute inset-0">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={activeMedia.id}
                  custom={direction}
                  variants={slideHorizontal}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={prefersReducedMotion ? fadeTransition : springSwipe}
                  className="absolute inset-0"
                >
                  {activeMedia.media_type === "image" ? (
                    <PhotoZoomView media={activeMedia} onZoomChange={setIsZoomed} />
                  ) : (
                    <VideoPlayerView media={activeMedia} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 flex items-start justify-between gap-2 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
              <span className="flex h-8 items-center rounded-glass-pill border border-glass-border bg-glass px-3 text-xs font-medium text-foreground backdrop-blur-xl backdrop-saturate-150">
                {describeMediaDate(activeMedia)}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {showMapButton ? (
                  <button
                    type="button"
                    onClick={() => setStreetViewOpen(true)}
                    aria-label="Ver en Street View"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl backdrop-saturate-150"
                  >
                    <MapPinIcon className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl backdrop-saturate-150"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <GlassPanel strong elevation="md" className="px-4 py-3">
                <ReactionBar
                  key={activeMedia.id}
                  mediaId={activeMedia.id}
                  initialCounts={activeMedia.id === media.id ? initialReactionCounts : undefined}
                  initialMine={activeMedia.id === media.id ? initialMyReactionEmojis : undefined}
                />
              </GlassPanel>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>

    {/* Fuera del AnimatePresence de arriba: su propio ciclo de vida (y el
        .load() de la Maps JS API dentro, ver el import dinámico) no debe
        depender de si el visor se está cerrando. */}
    {streetViewOpen && hasCoordinates ? (
      <StreetViewOverlay
        media={activeMedia}
        onClose={() => setStreetViewOpen(false)}
        onNavigateToMedia={(target) => {
          setStreetViewOpen(false);
          goTo(target, "next");
        }}
      />
    ) : null}
    </>
  );
}
