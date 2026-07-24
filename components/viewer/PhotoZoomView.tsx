"use client";

import Image from "next/image";
import { useState } from "react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { MediaRecord } from "@/types/media";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";
import { cn } from "@/lib/utils/cn";

interface PhotoZoomViewProps {
  media: MediaRecord;
  onZoomChange?: (isZoomed: boolean) => void;
}

export function PhotoZoomView({ media, onZoomChange }: PhotoZoomViewProps) {
  const url = getPublicStorageUrl("media-original", media.storage_path);
  // La miniatura (480px, la misma que ya se vio en la rejilla — normalmente ya
  // en caché del navegador) se pinta primero, difuminada; en cuanto la
  // original termina de cargar, se desvanece a favor de esta. Feedback visual
  // instantáneo en vez de un hueco en blanco mientras baja la original.
  const thumbnailUrl = getPublicStorageUrl("media-thumbnails", media.thumbnail_path);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  // El panning de la librería sólo debe capturar el gesto cuando hay zoom real:
  // a escala 1, el arrastre tiene que llegar al panel exterior (swipe entre
  // fotos / cerrar), no quedarse atrapado en el pan de la imagen.
  const [isZoomed, setIsZoomed] = useState(false);

  function handleTransform(_ref: ReactZoomPanPinchRef, state: { scale: number }) {
    const zoomed = state.scale > 1.01;
    setIsZoomed(zoomed);
    // El propio visor (MediaViewer) también necesita saberlo: si no, su
    // arrastre para cerrar/deslizar entre fotos compite con el pan de la
    // imagen ampliada y el gesto se siente inestable.
    onZoomChange?.(zoomed);
  }

  return (
    <TransformWrapper
      initialScale={1}
      minScale={1}
      maxScale={4}
      doubleClick={{ mode: "toggle", step: 2.2 }}
      wheel={{ disabled: true }}
      panning={{ disabled: !isZoomed }}
      onTransform={handleTransform}
    >
      <TransformComponent
        wrapperClass="!h-full !w-full"
        contentClass="!h-full !w-full !flex items-center justify-center"
      >
        <div className="relative h-full w-full">
          {/* miniatura de baja calidad: desaparece en cuanto la original está lista */}
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            aria-hidden="true"
            priority
            className={cn(
              "scale-105 object-contain blur-lg transition-opacity duration-300",
              fullImageLoaded ? "opacity-0" : "opacity-100",
            )}
            sizes="(min-width: 640px) 512px, 100vw"
          />
          <Image
            src={url}
            alt=""
            fill
            priority
            onLoad={() => setFullImageLoaded(true)}
            className={cn(
              "object-contain transition-opacity duration-300",
              fullImageLoaded ? "opacity-100" : "opacity-0",
            )}
            sizes="(min-width: 640px) 512px, 100vw"
          />
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
