const EVENT_NAME = "galeria:carousel-finished";

/** El carrusel de destacados (ver FeaturedCarousel) avisa de esto al llegar al final/cerrarse. */
export function emitCarouselFinished() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** Cualquiera que deba esperar a que el carrusel deje de tapar la pantalla se suscribe a esto. */
export function onCarouselFinished(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
