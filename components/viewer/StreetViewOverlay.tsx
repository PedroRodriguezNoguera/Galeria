"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { MediaRecord } from "@/types/media";
import { createClient } from "@/lib/supabase/client";
import { fetchGeolocatedMedia } from "@/lib/data/media";
import { reserveStreetViewLoad } from "@/lib/actions/streetView";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";
import { queryKeys } from "@/lib/queryKeys";
import { Spinner } from "@/components/ui/Spinner";
import { CloseIcon } from "@/components/ui/icons";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { fadeTransition, springGentle, springSnappy } from "@/animations/springs";

interface StreetViewOverlayProps {
  media: MediaRecord;
  onClose: () => void;
  /**
   * Cambiar a otra publicación (botón "Ver publicación" en la vista previa):
   * lo decide quien renderiza el overlay (MediaViewer.goTo), no un
   * router.push de aquí — un push crearía una navegación nueva de Next.js en
   * vez de reutilizar el visor ya abierto, y el visor de la foto original se
   * quedaba abierto por detrás sin cerrarse.
   */
  onNavigateToMedia: (media: MediaRecord) => void;
}

type Status = "loading" | "ready" | "zero_results" | "error" | "blocked";

// Se prueba primero cerca (50 m); si no hay panorámica, se amplía una vez
// antes de rendirse y mostrar el fallback (ver estado "zero_results").
const RADIUS_STEPS_M = [50, 100];

// setOptions() sólo puede llamarse una vez por carga de página (antes de
// importar ninguna librería) — con el overlay pudiendo montarse/desmontarse
// varias veces en la misma sesión (se abre y se cierra), este flag evita
// volver a llamarla si ya se configuró la primera vez.
let mapsOptionsConfigured = false;

function computeHeading(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const EARTH_RADIUS_M = 6371000;

/** Distancia real (fórmula de Haversine) entre dos puntos, en metros. */
function distanceMeters(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Al alejarse caminando de una foto, su marcador desaparece más allá de esta
// distancia real (no sólo por quedar fuera del campo de visión) — mismo
// orden de magnitud que el radio máximo de búsqueda de panorama (ver
// RADIUS_STEPS_M): más lejos de esto, ya no tiene sentido ofrecerla como "aquí cerca".
const MAX_MARKER_DISTANCE_M = 100;

// Tamaño según lo lejos que esté cada foto: más cerca, más grande; a
// MAX_MARKER_DISTANCE_M (donde ya desaparece del todo) se queda en el mínimo.
const MARKER_SIZE_MAX = 80;
const MARKER_SIZE_MIN = 34;

function markerSizeForDistance(distanceM: number): number {
  const t = Math.min(1, distanceM / MAX_MARKER_DISTANCE_M);
  return MARKER_SIZE_MAX - t * (MARKER_SIZE_MAX - MARKER_SIZE_MIN);
}

// Fórmula estándar de Street View: a zoom 0 el campo de visión horizontal es
// de 180°, y se reduce a la mitad por cada nivel de zoom que se sube.
function fovFromZoom(zoom: number): number {
  return 180 / Math.pow(2, zoom);
}

// Si dos marcadores caen a menos de esto (en % del ancho/alto visible) el uno
// del otro en pantalla, se consideran "el mismo grupo" y se separan a mano
// con un desplazamiento en píxeles, para que sólo se solape una esquina.
const CLUSTER_PERCENT_THRESHOLD = 10;
const CLUSTER_OFFSET_STEP_PX = 46;

interface PositionedMarker {
  id: string;
  thumbnailPath: string;
  size: number;
  // Píxeles ya resueltos (no % + transform con calc()): esa combinación,
  // actualizada muchas veces por segundo mientras se arrastra la vista, no
  // llegaba a repintarse de forma fiable en todos los navegadores.
  xPx: number;
  yPx: number;
}

async function requestPanorama(
  service: google.maps.StreetViewService,
  location: google.maps.LatLngLiteral,
  radius: number,
): Promise<google.maps.StreetViewPanoramaData | null> {
  try {
    const response = await service.getPanorama({
      location,
      radius,
      source: google.maps.StreetViewSource.OUTDOOR,
      preference: google.maps.StreetViewPreference.NEAREST,
    });
    return response.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Vista de calle en el punto exacto donde se hizo la foto. La Maps JS API se
 * importa aquí dentro (setOptions/importLibrary de @googlemaps/js-api-loader,
 * montado bajo demanda vía dynamic import en MediaViewer), nunca antes: es lo
 * único que hace que esto cuente contra las 5.000 cargas gratis/mes de Street
 * View — nada se precarga en el feed ni al abrir el visor normal.
 */
export function StreetViewOverlay({ media, onClose, onNavigateToMedia }: StreetViewOverlayProps) {
  const queryClient = useQueryClient();
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Posición real de la panorámica (no la de la foto): hace falta para saber,
  // desde ahí, el rumbo real de cada marcador y proyectarlo en pantalla. En
  // estado (no en un ref) porque overlayMarkers, más abajo, lo necesita
  // durante el render — leer un ref ahí no es seguro.
  const [panoLocation, setPanoLocation] = useState<google.maps.LatLngLiteral | null>(null);
  // Punto de vista actual (rumbo/inclinación): se actualiza en cada
  // "pov_changed" para recalcular dónde caen los marcadores en pantalla.
  // El zoom es una propiedad aparte del panorama (no forma parte de
  // StreetViewPov), así que se seguía por su cuenta con "zoom_changed".
  const [pov, setPov] = useState<google.maps.StreetViewPov | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  // Tamaño real del contenedor (para la relación de aspecto de la
  // proyección): por la misma razón que panoLocation, en estado y no leído
  // del ref directamente durante el render (ver el useEffect con
  // ResizeObserver, más abajo).
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  // Qué foto mostrar en grande y centrada (ver el bloque de abajo): null =
  // ningún marcador pulsado. Guarda el registro completo (esta foto o
  // cualquier otra publicación geolocalizada, ver fetchGeolocatedMedia) para
  // poder pasárselo tal cual a onNavigateToMedia si se pulsa "Ver publicación".
  const [previewMedia, setPreviewMedia] = useState<MediaRecord | null>(null);

  const { latitude, longitude } = media;

  // Sólo se pide cuando el panorama ya está listo (y por tanto el overlay ya
  // está abierto de verdad, ver enabled): nunca antes, ni junto al resto de
  // la galería.
  const { data: otherMedia } = useQuery({
    queryKey: queryKeys.geolocatedMedia(),
    queryFn: () => fetchGeolocatedMedia(createClient()),
    enabled: status === "ready",
  });

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const photoLocation = { lat: latitude, lng: longitude };
    let cancelled = false;
    let povListener: google.maps.MapsEventListener | null = null;
    let zoomListener: google.maps.MapsEventListener | null = null;
    let positionListener: google.maps.MapsEventListener | null = null;
    let rafId: number | null = null;

    async function init() {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setStatus("error");
        setErrorMessage("Falta configurar la clave de Google Maps.");
        return;
      }

      // Se reserva ANTES de tocar la API de Google, no después de que el
      // panorama cargue: así nunca se llega a pedir nada a Google si ya no
      // queda margen. El icono del visor (useStreetViewBlockedByUsage) ya
      // filtra la mayoría de los casos, pero con un dato que puede llevar un
      // rato en caché — esta reserva es la que de verdad cuenta y decide, de
      // forma atómica en la propia base de datos (ver
      // try_reserve_street_view_load: nunca puede colarse una reserva de más
      // aunque lleguen varias peticiones a la vez).
      let reserved: boolean;
      try {
        reserved = await reserveStreetViewLoad();
      } catch (error) {
        console.error("No se pudo reservar la carga de Street View", error);
        setStatus("error");
        setErrorMessage("No se pudo comprobar el uso de Street View.");
        return;
      }
      if (cancelled) return;
      if (!reserved) {
        setStatus("blocked");
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.streetViewUsage() });

      try {
        if (!mapsOptionsConfigured) {
          setOptions({ key: apiKey, v: "weekly" });
          mapsOptionsConfigured = true;
        }
        const { StreetViewService, StreetViewPanorama } = await importLibrary("streetView");
        if (cancelled) return;

        const service = new StreetViewService();

        let result: google.maps.StreetViewPanoramaData | null = null;
        for (const radius of RADIUS_STEPS_M) {
          result = await requestPanorama(service, photoLocation, radius);
          if (result?.location?.latLng) break;
        }

        if (cancelled) return;

        if (!result?.location?.latLng || !containerRef.current) {
          setStatus("zero_results");
          return;
        }

        const panoLatLng = result.location.latLng;
        const resolvedPanoLocation = { lat: panoLatLng.lat(), lng: panoLatLng.lng() };
        setPanoLocation(resolvedPanoLocation);
        const heading = computeHeading(resolvedPanoLocation, photoLocation);

        const panorama = new StreetViewPanorama(containerRef.current, {
          pano: result.location.pano ?? undefined,
          pov: { heading, pitch: 0 },
          addressControl: false,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
        });

        // Si este efecto se ha cancelado mientras se esperaba la respuesta de
        // Google (StrictMode en desarrollo vuelve a montar los efectos una
        // vez de más), no se deja este panorama "huérfano" como el vigente:
        // sin esto, sus propios pov_changed/zoom_changed nunca acaban en
        // panoramaRef (que sigue apuntando al de la instancia real, la que el
        // usuario ve de verdad), así que sus marcadores nunca se actualizan
        // al moverse.
        if (cancelled) {
          panorama.setVisible(false);
          return;
        }
        panoramaRef.current = panorama;

        // Las posiciones de los marcadores (ver overlayMarkers, más abajo) se
        // calculan a mano a partir de este POV, no dejando que el propio
        // Marker de Google se dibuje sobre el panorama: ese camino es
        // heredado y tiene un fallo conocido (no llega a pintarse hasta que
        // el usuario interactúa una vez con la vista), que ni esperando sus
        // eventos ni forzando resize/POV se consigue evitar de forma fiable.
        // Calculándolo nosotros mismos no depende en nada de ese renderizado
        // interno.
        const scheduleUpdate = () => {
          if (rafId !== null) return;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            setPov(panorama.getPov());
            setZoom(panorama.getZoom());
          });
        };
        setPov(panorama.getPov());
        setZoom(panorama.getZoom());
        povListener = panorama.addListener("pov_changed", scheduleUpdate);
        zoomListener = panorama.addListener("zoom_changed", scheduleUpdate);

        // Al caminar por la calle (flechas de navegación) la posición REAL de
        // la panorámica cambia, no sólo hacia dónde mira la cámara — sin
        // esto, los marcadores se seguían calculando desde el punto de
        // partida original, así que no se movían al alejarse caminando de
        // ellos (sólo reaccionaban a girar la vista en el sitio).
        positionListener = panorama.addListener("position_changed", () => {
          const position = panorama.getPosition();
          if (position) setPanoLocation({ lat: position.lat(), lng: position.lng() });
        });

        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("No se pudo cargar Street View", error);
        setStatus("error");
        setErrorMessage("No se pudo cargar Street View.");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (povListener) google.maps.event.removeListener(povListener);
      if (zoomListener) google.maps.event.removeListener(zoomListener);
      if (positionListener) google.maps.event.removeListener(positionListener);
      if (rafId !== null) cancelAnimationFrame(rafId);
      panoramaRef.current?.setVisible(false);
      panoramaRef.current = null;
    };
  }, [latitude, longitude, queryClient]);

  // Tamaño real del panel (para la relación de aspecto de la proyección, ver
  // overlayMarkers): con ResizeObserver en vez de leer el ref directamente
  // durante el render, que no es seguro.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Posición en pantalla (en % del contenedor) de la foto actual + el resto
  // de publicaciones geolocalizadas, recalculada cada vez que cambia el POV.
  // Las que casi coinciden en pantalla se separan con un pequeño
  // desplazamiento en píxeles, para que sólo se solape una esquina.
  const overlayMarkers = useMemo<PositionedMarker[]>(() => {
    if (
      !pov ||
      zoom == null ||
      !panoLocation ||
      !containerSize ||
      containerSize.width === 0 ||
      containerSize.height === 0 ||
      latitude == null ||
      longitude == null
    ) {
      return [];
    }
    const fov = fovFromZoom(zoom);
    const aspect = containerSize.width / containerSize.height;
    const verticalFov = fov / aspect;

    const others = (otherMedia ?? []).filter((item) => item.id !== media.id);
    const candidates = [
      { id: media.id, thumbnailPath: media.thumbnail_path, position: { lat: latitude, lng: longitude } },
      ...others.map((item) => ({
        id: item.id,
        thumbnailPath: item.thumbnail_path,
        position: { lat: item.latitude, lng: item.longitude },
      })),
    ];

    const visible = candidates
      .map((candidate) => ({
        ...candidate,
        distance: distanceMeters(panoLocation, candidate.position),
      }))
      .filter((candidate) => candidate.distance <= MAX_MARKER_DISTANCE_M)
      .map((candidate) => {
        const bearing = computeHeading(panoLocation, candidate.position);
        // Diferencia normalizada a [-180, 180]: cuánto hay que girar desde lo
        // que se está mirando ahora mismo hasta ver este punto.
        const deltaHeading = ((bearing - pov.heading + 540) % 360) - 180;
        // Se asume que todo está aprox. a la altura del horizonte (pitch 0
        // real); lo que sube/baja en pantalla es sólo hacia dónde mira ahora
        // la cámara. Píxeles ya resueltos, no %, ver PositionedMarker.
        const xPx = (0.5 + deltaHeading / fov) * containerSize.width;
        const yPx = (0.5 + pov.pitch / verticalFov) * containerSize.height;
        const onScreen = Math.abs(deltaHeading) <= fov / 2 + 5;
        const size = markerSizeForDistance(candidate.distance);
        return { ...candidate, xPx, yPx, size, onScreen };
      })
      .filter((item) => item.onScreen);

    const clusters: { xPx: number; yPx: number; members: typeof visible }[] = [];
    for (const item of visible) {
      const cluster = clusters.find(
        (c) =>
          Math.abs(c.xPx - item.xPx) <= (CLUSTER_PERCENT_THRESHOLD / 100) * containerSize.width &&
          Math.abs(c.yPx - item.yPx) <= (CLUSTER_PERCENT_THRESHOLD / 100) * containerSize.height,
      );
      if (cluster) cluster.members.push(item);
      else clusters.push({ xPx: item.xPx, yPx: item.yPx, members: [item] });
    }

    return clusters.flatMap((cluster) =>
      cluster.members.map((member, index) => ({
        id: member.id,
        thumbnailPath: member.thumbnailPath,
        size: member.size,
        xPx: member.xPx + index * CLUSTER_OFFSET_STEP_PX,
        yPx: member.yPx + index * CLUSTER_OFFSET_STEP_PX,
      })),
    );
  }, [
    pov,
    zoom,
    panoLocation,
    containerSize,
    otherMedia,
    media.id,
    media.thumbnail_path,
    latitude,
    longitude,
  ]);

  const staticMapFallback =
    latitude != null && longitude != null && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=480x320&markers=color:0x1d1d1f%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : null;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeTransition}
    >
      <motion.div
        className="absolute inset-0 bg-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeTransition}
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        transition={prefersReducedMotion ? fadeTransition : springGentle}
        className="relative flex h-full max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-glass-xl border border-glass-border bg-glass-strong backdrop-blur-xl backdrop-saturate-150 shadow-glass-lg lg:max-w-2xl xl:max-w-3xl"
      >
        {/* Street View escribe directamente en este nodo en cuanto hay panorama:
            se queda montado siempre, sólo tapado por los estados de arriba
            mientras no está "ready". */}
        <div ref={containerRef} className="absolute inset-0" />

        {/* Marcadores propios (ver overlayMarkers): elementos normales de
            React posicionados a mano, no Marker de Google — así se ven desde
            el primer instante, sin depender de su renderizado interno.
            `animate` con springSnappy en vez de fijar left/top directamente:
            cada vez que te mueves, la foto persigue su nueva posición con un
            pequeño resorte en vez de saltar de golpe. `initial` igual al
            propio destino para que una foto que entra en pantalla aparezca
            ya en su sitio, sin venir volando desde la esquina. */}
        {status === "ready" ? (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {overlayMarkers.map((marker) => (
              <motion.button
                key={marker.id}
                type="button"
                onClick={() => {
                  const record = marker.id === media.id ? media : otherMedia?.find((item) => item.id === marker.id);
                  if (record) setPreviewMedia(record);
                }}
                initial={{ left: marker.xPx, top: marker.yPx, width: marker.size, height: marker.size }}
                animate={{ left: marker.xPx, top: marker.yPx, width: marker.size, height: marker.size }}
                transition={prefersReducedMotion ? { duration: 0 } : springSnappy}
                style={{ transform: "translate(-50%, -50%)" }}
                className="pointer-events-auto absolute overflow-hidden rounded-glass-md border-2 border-white/90 shadow-glass-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por el propio pipeline de subida, no hace falta next/image aquí. */}
                <img
                  src={getPublicStorageUrl("media-thumbnails", marker.thumbnailPath)}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              </motion.button>
            ))}
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-glass-strong">
            <Spinner size={28} className="text-foreground-muted" />
          </div>
        ) : null}

        {status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-glass-strong px-8 text-center">
            <p className="text-sm font-medium text-foreground">{errorMessage}</p>
          </div>
        ) : null}

        {status === "blocked" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-glass-strong px-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Se ha alcanzado el límite de uso del mapa por este mes.
            </p>
            <p className="text-xs text-foreground-muted">Vuelve a estar disponible el mes que viene.</p>
          </div>
        ) : null}

        {status === "zero_results" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-glass-strong px-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No hay vista de calle en este punto.
            </p>
            {staticMapFallback ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL externa generada dinámicamente (Static Maps), no un asset local optimizable.
              <img
                src={staticMapFallback}
                alt="Mapa del lugar donde se hizo la foto"
                className="max-h-64 w-full max-w-sm rounded-glass-md object-cover"
              />
            ) : null}
          </div>
        ) : null}

        {/* Foto arriba y centrada al pulsar un marcador (el de esta foto o el
            de cualquier otra publicación geolocalizada) — sin oscurecer ni
            tapar el mapa, que se sigue viendo entero detrás. Tocar en
            cualquier otro punto la cierra (capa invisible de abajo); si no es
            la foto actual, un botón lleva a verla del todo. */}
        {previewMedia ? (
          <div
            className="absolute inset-0 z-20"
            onClick={() => setPreviewMedia(null)}
            aria-hidden="true"
          />
        ) : null}
        <AnimatePresence>
          {previewMedia ? (
            <motion.div
              key="photo-preview"
              className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+1.25rem)] z-20 flex justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
            >
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -12 }}
                transition={prefersReducedMotion ? fadeTransition : springGentle}
                onClick={(event) => event.stopPropagation()}
                className="pointer-events-auto relative h-48 w-48 overflow-hidden rounded-glass-lg border border-glass-border shadow-glass-lg sm:h-60 sm:w-60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por el propio pipeline de subida, no hace falta next/image aquí. */}
                <img
                  src={getPublicStorageUrl("media-thumbnails", previewMedia.thumbnail_path)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {previewMedia.id !== media.id ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToMedia(previewMedia)}
                    className="absolute inset-x-3 bottom-3 rounded-glass-pill border border-glass-border bg-glass-strong px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-xl backdrop-saturate-150"
                  >
                    Ver publicación
                  </button>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar Street View"
          className="absolute right-5 top-[calc(env(safe-area-inset-top)+1.25rem)] z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl backdrop-saturate-150"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
