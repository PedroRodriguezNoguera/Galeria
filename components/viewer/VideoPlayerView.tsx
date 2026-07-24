"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaRecord } from "@/types/media";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";
import { PlayIcon, PauseIcon, SpeakerOnIcon, SpeakerOffIcon } from "@/components/ui/icons";
import { springPop } from "@/animations/springs";

interface VideoPlayerViewProps {
  media: MediaRecord;
  /** Duración real del vídeo en cuanto el navegador la conoce (metadata cargada). */
  onDurationChange?: (durationSeconds: number) => void;
}

/**
 * Controles propios en vez de los nativos del navegador: los nativos se
 * renderizan pegados al borde inferior del vídeo y su capa puede quedar por
 * encima del resto del DOM en algunos navegadores, solapándose con la barra
 * de reacciones que vive justo ahí debajo. Con controles propios, todo
 * comparte el mismo z-index normal y nunca se pisan.
 */
export function VideoPlayerView({ media, onDurationChange }: VideoPlayerViewProps) {
  const url = getPublicStorageUrl("media-original", media.storage_path);
  const posterUrl = getPublicStorageUrl("media-thumbnails", media.thumbnail_path);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapId = useRef(0);
  const [muted, setMuted] = useState(true);
  const [tap, setTap] = useState<{ id: number; type: "play" | "pause" } | null>(null);

  function handleLoadedMetadata() {
    const duration = videoRef.current?.duration;
    if (duration && Number.isFinite(duration)) onDurationChange?.(duration);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    const type = video.paused ? "play" : "pause";
    if (type === "play") video.play();
    else video.pause();

    tapId.current += 1;
    const id = tapId.current;
    setTap({ id, type });
    window.setTimeout(() => {
      setTap((current) => (current?.id === id ? null : current));
    }, 450);
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={url}
        poster={posterUrl}
        // playsInline es imprescindible: sin él, Safari en iPhone fuerza pantalla completa nativa.
        autoPlay
        muted={muted}
        loop
        playsInline
        onClick={togglePlay}
        onLoadedMetadata={handleLoadedMetadata}
        className="h-full w-full object-contain"
      />

      <AnimatePresence>
        {tap ? (
          <motion.div
            key={tap.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={springPop}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-scrim text-white backdrop-blur-md">
              {tap.type === "play" ? (
                <PlayIcon className="h-7 w-7" />
              ) : (
                <PauseIcon className="h-7 w-7" />
              )}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setMuted((current) => !current);
        }}
        aria-label={muted ? "Activar sonido" : "Silenciar"}
        // A la izquierda del botón cerrar (que siempre vive arriba a la derecha,
        // tanto en el visor público como en el de moderación) y lejos de la
        // insignia de estado que ese último muestra arriba a la izquierda.
        className="absolute right-16 top-[calc(env(safe-area-inset-top)+1.25rem)] flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl backdrop-saturate-150"
      >
        {muted ? <SpeakerOffIcon className="h-4 w-4" /> : <SpeakerOnIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
