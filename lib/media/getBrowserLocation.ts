export interface GpsCoords {
  latitude: number;
  longitude: number;
}

const BROWSER_LOCATION_TIMEOUT_MS = 8000;

/**
 * Lo que hace la cámara nativa a través de `<input capture>` casi nunca trae
 * GPS en el EXIF, aunque el teléfono tenga la ubicación activada — es una
 * limitación del propio navegador al capturar así, no algo que se pueda leer
 * del archivo. Para esos casos se pide la posición actual del navegador como
 * respaldo (ver UploadSheet, que la llama en cuanto se toca "Cámara" — no
 * después de volver de la foto: algunos navegadores no conceden el permiso,
 * o lo deniegan solos, si se pide fuera de la respuesta directa a un toque).
 *
 * El `timeout` de la propia API de geolocalización no es fiable en todos los
 * navegadores/móviles (se ha visto quedarse colgado mientras el diálogo de
 * permiso no se resuelve, dejando la subida entera esperando para siempre) —
 * por eso hay una salvaguarda propia con setTimeout que garantiza que esto
 * siempre acaba resolviendo, pase lo que pase con la API nativa.
 */
export function getBrowserLocation(): Promise<GpsCoords | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(undefined);
      return;
    }
    let settled = false;
    function finish(value: GpsCoords | undefined) {
      if (settled) return;
      settled = true;
      resolve(value);
    }

    setTimeout(() => finish(undefined), BROWSER_LOCATION_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      (position) =>
        finish({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => finish(undefined),
      { enableHighAccuracy: true, timeout: BROWSER_LOCATION_TIMEOUT_MS, maximumAge: 0 },
    );
  });
}
