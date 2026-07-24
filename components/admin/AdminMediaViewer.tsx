"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MediaWithReactions } from "@/types/media";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PhotoZoomView } from "@/components/viewer/PhotoZoomView";
import { VideoPlayerView } from "@/components/viewer/VideoPlayerView";
import {
  hidePost,
  showPost,
  deletePostPermanently,
  deleteReactions,
} from "@/lib/actions/moderatePost";
import { springGentle, springSwipe, fadeTransition } from "@/animations/springs";
import { slideHorizontal } from "@/animations/variants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface AdminMediaViewerProps {
  media: MediaWithReactions;
  prevMedia: MediaWithReactions | null;
  nextMedia: MediaWithReactions | null;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

const DISMISS_DRAG_THRESHOLD = 140;
const DISMISS_VELOCITY_THRESHOLD = 600;
const SWIPE_DRAG_THRESHOLD = 90;
const SWIPE_VELOCITY_THRESHOLD = 500;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Mismo lenguaje visual y de gestos que el visor público (cristal, deslizar
 * lateralmente para pasar de foto/vídeo, arrastrar hacia abajo para cerrar),
 * pero en vez de reacciones tiene las acciones de moderación.
 */
export function AdminMediaViewer({
  media,
  prevMedia,
  nextMedia,
  onNavigate,
  onClose,
}: AdminMediaViewerProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isClosing, setIsClosing] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  // Con la imagen ampliada, el arrastre del panel exterior se desactiva:
  // si no, compite con el pan de la imagen. Ver PhotoZoomView.onZoomChange.
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function requestClose() {
    setIsClosing(true);
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
      setDirection("next");
      setIsZoomed(false);
      onNavigate(nextMedia.id);
    } else if (info.offset.x > 0 && prevMedia) {
      setDirection("prev");
      setIsZoomed(false);
      onNavigate(prevMedia.id);
    }
  }

  function runAction(action: () => Promise<unknown>, closeAfter = false) {
    startTransition(async () => {
      await action();
      if (closeAfter) {
        // No refrescar aquí: si los datos cambian mientras el visor sigue
        // montado por culpa de la propia animación de salida, `openMedia`
        // desaparecería del padre a mitad de la animación y la cortaría en
        // seco. El refresh real ocurre en onClose, cuando ya ha terminado.
        requestClose();
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta publicación de forma definitiva? No se puede deshacer.")) {
      return;
    }
    runAction(() => deletePostPermanently(media.id), true);
  }

  return (
    <AnimatePresence onExitComplete={onClose}>
      {!isClosing ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-lg backdrop-saturate-150"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            onClick={requestClose}
            aria-hidden="true"
          />

          <motion.div
            drag={prefersReducedMotion || isZoomed ? false : true}
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={{ top: 0, bottom: 0.6, left: 0.5, right: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={springGentle}
            className="relative flex h-full max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-glass-xl border border-glass-border bg-glass-strong backdrop-blur-xl backdrop-saturate-150 shadow-glass-lg"
          >
            <div className="absolute inset-0">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={media.id}
                  custom={direction}
                  variants={slideHorizontal}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={prefersReducedMotion ? fadeTransition : springSwipe}
                  className="absolute inset-0"
                >
                  {media.media_type === "image" ? (
                    <PhotoZoomView media={media} onZoomChange={setIsZoomed} />
                  ) : (
                    <VideoPlayerView media={media} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 flex items-start justify-between gap-2 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
              <span className="flex h-8 items-center rounded-glass-pill border border-glass-border bg-glass px-3 text-xs font-medium text-foreground backdrop-blur-xl backdrop-saturate-150">
                {media.is_hidden ? "Oculta" : "Visible"} ·{" "}
                {media.media_type === "image" ? "Foto" : "Vídeo"} · {formatBytes(media.size_bytes)}
              </span>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl backdrop-saturate-150"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10 mt-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <GlassPanel strong elevation="md" className="flex flex-col gap-3 px-4 py-3.5">
                <p className="truncate font-mono text-[11px] text-foreground-muted">{media.id}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      runAction(() =>
                        media.is_hidden ? showPost(media.id) : hidePost(media.id),
                      )
                    }
                  >
                    {media.is_hidden ? "Mostrar" : "Ocultar"}
                  </Button>
                  <Button
                    variant="glass"
                    size="sm"
                    disabled={isPending}
                    onClick={() => runAction(() => deleteReactions(media.id))}
                  >
                    Eliminar reacciones
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={handleDelete}
                  >
                    Eliminar imagen
                  </Button>
                  {isPending ? <Spinner size={16} className="text-foreground-muted" /> : null}
                </div>
              </GlassPanel>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
