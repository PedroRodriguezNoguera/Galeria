"use client";

import { useEffect, useState } from "react";
import { animate, useMotionValue } from "framer-motion";
import { springSnappy } from "@/animations/springs";

/**
 * El panel del visor se puede arrastrar (cerrar / deslizar de foto) salvo
 * cuando hay zoom en curso — si no, compite con el pan de PhotoZoomView. El
 * problema: un gesto de pellizco casi nunca empieza con los dos dedos a la
 * vez. El primer dedo toca, el arrastre del panel ya lo captura como si
 * fuera un deslizar de una sola mano y lo desplaza hacia ese lado, y para
 * cuando llega el segundo dedo y el zoom activa `isZoomed`, el panel ya se
 * ha quedado descentrado — y como el arrastre se desactiva justo en ese
 * momento, se queda "enganchado" ahí en vez de recentrarse.
 *
 * Se detectan 2 dedos en pantalla lo antes posible (a nivel de documento y
 * en fase de captura, para no depender de que la librería de zoom deje
 * burbujear el evento) y se corta el arrastre en cuanto aparece el segundo;
 * y siempre que el arrastre se desactive, sea por eso o por haber entrado
 * en zoom, el panel se anima de vuelta al centro en vez de dejarse donde
 * haya quedado.
 */
export function useZoomSafeDrag(isZoomed: boolean, prefersReducedMotion: boolean) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [multiTouch, setMultiTouch] = useState(false);

  useEffect(() => {
    function updateTouchState(event: TouchEvent) {
      setMultiTouch(event.touches.length >= 2);
    }
    document.addEventListener("touchstart", updateTouchState, { capture: true, passive: true });
    document.addEventListener("touchend", updateTouchState, { capture: true, passive: true });
    document.addEventListener("touchcancel", updateTouchState, { capture: true, passive: true });
    return () => {
      document.removeEventListener("touchstart", updateTouchState, true);
      document.removeEventListener("touchend", updateTouchState, true);
      document.removeEventListener("touchcancel", updateTouchState, true);
    };
  }, []);

  const dragDisabled = prefersReducedMotion || isZoomed || multiTouch;

  useEffect(() => {
    if (dragDisabled) {
      animate(x, 0, springSnappy);
      animate(y, 0, springSnappy);
    }
  }, [dragDisabled, x, y]);

  return { x, y, dragDisabled };
}
