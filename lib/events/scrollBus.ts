const EVENT_NAME = "galeria:scroll-to-media";

/**
 * Al cerrar el visor tras deslizar entre fotos, la navegación de vuelta
 * (router.back) sólo sabe restaurar el scroll de ANTES de abrir el visor —
 * la lista, detrás del modal, nunca se movió mientras se deslizaba. Esto
 * avisa a la lista de a qué elemento debe llevar el scroll de verdad.
 */
export function requestScrollToMedia(mediaId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(EVENT_NAME, { detail: mediaId }));
}

/** La lista se suscribe a esto para corregir el scroll tras cerrar el visor. */
export function onScrollToMedia(handler: (mediaId: string) => void) {
  if (typeof window === "undefined") return () => {};
  function listener(event: Event) {
    handler((event as CustomEvent<string>).detail);
  }
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
