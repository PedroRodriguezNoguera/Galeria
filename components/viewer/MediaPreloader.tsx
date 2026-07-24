"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { MediaWithReactions } from "@/types/media";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";

interface MediaPreloaderProps {
  next: MediaWithReactions[];
  prev: MediaWithReactions[];
}

// Las anteriores no empiezan a pedirse hasta que las siguientes ya están en
// marcha: es más probable seguir deslizando hacia adelante que hacia atrás.
const PREV_DELAY_MS = 400;

/**
 * Precarga en segundo plano las fotos originales (misma URL/tamaño que
 * PhotoZoomView, para que el navegador reutilice la caché al llegar de
 * verdad) de los vecinos ya cargados en la galería. Nunca debe competir con
 * la imagen que se está viendo ahora: fetchPriority="low" en todas, sólo
 * imágenes (los vídeos no tienen un "original" ligero que merezca precargar
 * así) y las siguientes siempre antes que las anteriores.
 */
export function MediaPreloader({ next, prev }: MediaPreloaderProps) {
  // Se remonta por completo en cada cambio de foto activa (ver `key` en
  // MediaViewer), así este estado siempre arranca en false para el vecindario
  // nuevo sin necesidad de resetearlo a mano dentro del efecto.
  const [prevReady, setPrevReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPrevReady(true), PREV_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const nextImages = next.filter((item) => item.media_type === "image");
  const prevImages = prev.filter((item) => item.media_type === "image");

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
    >
      {nextImages.map((item) => (
        <Image
          key={`next-${item.id}`}
          src={getPublicStorageUrl("media-original", item.storage_path)}
          alt=""
          fill
          loading="eager"
          fetchPriority="low"
          sizes="(min-width: 640px) 512px, 100vw"
        />
      ))}
      {prevReady &&
        prevImages.map((item) => (
          <Image
            key={`prev-${item.id}`}
            src={getPublicStorageUrl("media-original", item.storage_path)}
            alt=""
            fill
            loading="eager"
            fetchPriority="low"
            sizes="(min-width: 640px) 512px, 100vw"
          />
        ))}
    </div>
  );
}
