const EVENT_NAME = "galeria:activity";

let pendingActivity = false;

/** Lanza la carrera directamente: para acciones que ya ocurren con la cabecera visible. */
export function emitActivity() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

/**
 * Sólo marca que hay una carrera pendiente: no la lanza. Se usa cuando la
 * acción ocurre con la cabecera tapada (visor abierto, hoja de subida
 * abierta) — lanzarla ahí no se vería. Ver flushPendingActivity.
 */
export function queueActivity() {
  pendingActivity = true;
}

/** Lanza la carrera pendiente (si la había) al volver a la lista principal, donde sí se ve. */
export function flushPendingActivity() {
  if (!pendingActivity) return;
  pendingActivity = false;
  emitActivity();
}

/** La cabecera se suscribe a esto para lanzar la animación del toro. */
export function onActivity(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
