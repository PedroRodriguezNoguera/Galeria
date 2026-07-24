"use client";

import { useEffect } from "react";

/** Sólo registra en producción: evita interferencias con el HMR de Turbopack en desarrollo. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("No se pudo registrar el service worker", error);
    });
  }, []);

  return null;
}
