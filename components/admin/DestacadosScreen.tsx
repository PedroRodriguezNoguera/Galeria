"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaWithReactions } from "@/types/media";
import { MediaThumbnail } from "@/components/gallery/MediaThumbnail";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { scaleFadeIn, staggerChildren } from "@/animations/variants";
import { springSnappy, springPop, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { setDestacadosEnabled, removeFromFeatured } from "@/lib/actions/featured";

interface DestacadosScreenProps {
  items: MediaWithReactions[];
  destacadosEnabled: boolean;
}

export function DestacadosScreen({ items, destacadosEnabled }: DestacadosScreenProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(destacadosEnabled);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const previous = enabled;
    const next = !enabled;
    setEnabled(next);
    setToggleError(null);
    startTransition(async () => {
      try {
        await setDestacadosEnabled(next);
      } catch (err) {
        setEnabled(previous);
        setToggleError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  function handleRemove(id: string) {
    setRemovingId(id);
    startTransition(async () => {
      await removeFromFeatured([id]);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Destacados</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Fotos y vídeos marcados como destacados desde moderación (pulsación mantenida →
          seleccionar varios → &ldquo;Destacar&rdquo;). Si se activa, son lo primero que se ve al
          entrar a la galería.
        </p>
      </div>

      <GlassPanel className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium text-foreground">Carrusel de destacados</span>
        <Button
          variant={enabled ? "primary" : "glass"}
          size="sm"
          disabled={isPending}
          onClick={handleToggle}
        >
          {enabled ? "Activado" : "Desactivado"}
        </Button>
        {isPending ? <Spinner size={16} className="text-foreground-muted" /> : null}
        {toggleError ? <span className="text-xs text-red-500">{toggleError}</span> : null}
      </GlassPanel>

      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          Todavía no hay nada destacado. Desde moderación, mantén pulsada una foto o vídeo para
          seleccionar varios y usa &ldquo;Destacar&rdquo;.
        </p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6 xl:grid-cols-8"
        >
          <AnimatePresence>
            {items.map((media) => {
              const isRemoving = isPending && removingId === media.id;
              return (
                <motion.div
                  key={media.id}
                  layout={!prefersReducedMotion}
                  variants={scaleFadeIn}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0, transition: fadeTransition }
                      : { opacity: 0, scale: 0.75, transition: springPop }
                  }
                  transition={springSnappy}
                  className="relative aspect-square overflow-hidden rounded-glass-sm bg-glass"
                >
                  <MediaThumbnail media={media} />
                  <motion.button
                    type="button"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.85 }}
                    transition={springSnappy}
                    onClick={() => handleRemove(media.id)}
                    disabled={isRemoving}
                    aria-label="Quitar de destacados"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-xs text-foreground backdrop-blur-md backdrop-saturate-150 disabled:opacity-60"
                  >
                    {isRemoving ? <Spinner size={12} /> : "✕"}
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
