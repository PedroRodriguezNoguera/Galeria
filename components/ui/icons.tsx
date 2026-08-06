"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface IconProps {
  className?: string;
}

/** Iconos de línea, estilo SF Symbols: heredan color de texto, sin depender de emoji. */

export function CameraIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1-1.5h7l1 1.5h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  );
}

export function PhotoLibraryIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M5 16.5 9.5 12a1.5 1.5 0 0 1 2.1 0l1.9 1.9M14.5 14 16 12.5a1.5 1.5 0 0 1 2.1 0L20 14.4" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 9.5h16M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5.5c0-.9 1-1.5 1.8-1L18 9.3c.8.5.8 1.9 0 2.4l-8.2 4.8c-.8.5-1.8-.1-1.8-1z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="6.5" y="5.5" width="4" height="13" rx="1.4" />
      <rect x="13.5" y="5.5" width="4" height="13" rx="1.4" />
    </svg>
  );
}

export function SpeakerOnIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 10v4h3.5L12 17.5v-11L7.5 10Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />
    </svg>
  );
}

export function SpeakerOffIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 10v4h3.5L12 17.5v-11L7.5 10Z" />
      <path d="M16 10.5 20 14.5M20 10.5 16 14.5" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12.5 9.5 17 19 7.5" />
    </svg>
  );
}

interface FillableIconProps extends IconProps {
  /** Relleno sólido para el estado "activo" (p.ej. ya destacado); contorno si no. */
  filled?: boolean;
}

export function StarIcon({ className, filled = false }: FillableIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.7 14.6 9l5.7.8-4.15 4 .98 5.7L12 16.7l-5.13 2.8.98-5.7L4.7 9.8 10.4 9Z" />
    </svg>
  );
}

export function FolderIcon({ className, filled = false }: FillableIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7.2A1.7 1.7 0 0 1 5.7 5.5h3.6l1.7 2h7.3A1.7 1.7 0 0 1 20 9.2v7.6a1.7 1.7 0 0 1-1.7 1.7H5.7A1.7 1.7 0 0 1 4 16.8Z" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 12S6.6 5.8 12 5.8 20.5 12 20.5 12 17.4 18.2 12 18.2 3.5 12 3.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 12S6.6 5.8 12 5.8c1.5 0 2.9.4 4.15 1.1M20.5 12S17.4 18.2 12 18.2c-1.5 0-2.9-.4-4.15-1.1" />
      <path d="M9.6 10.3a3 3 0 0 0 4.15 4.1" />
      <path d="M4.2 4.2l15.6 15.6" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 7.5h14M9.3 7.5V6a1.5 1.5 0 0 1 1.5-1.5h2.4A1.5 1.5 0 0 1 14.7 6v1.5" />
      <path d="M7.1 7.5l.75 10.8a1.6 1.6 0 0 0 1.6 1.5h5.1a1.6 1.6 0 0 0 1.6-1.5l.75-10.8" />
      <path d="M10.3 11v5M13.7 11v5" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6.5h7M15.5 6.5H20M4 12h9.5M18 12h2M4 17.5h5M13.5 17.5H20" />
      <circle cx="11" cy="6.5" r="2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="17.5" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PersonIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
      <path d="M14 8l4 4-4 4M18 12H9.5" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4v10.5M8 11l4 4 4-4" />
      <path d="M5 16.5v2A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="5.5" width="16" height="13" rx="2" />
      <path d="M4 9.5h16M9 5.5v13M15 5.5v13" />
    </svg>
  );
}

/**
 * Gira el elemento referenciado alrededor de (12,12) sin parar, escribiendo
 * directamente el atributo SVG nativo `transform="rotate(grados 12 12)"` en
 * vez de animar un `rotate` de CSS o las propias coordenadas x/y: el rotate
 * nativo de SVG gira siempre alrededor del punto exacto que se le indica, en
 * las coordenadas del propio viewBox — a diferencia del transform-origin de
 * CSS (relativo al fill-box del elemento) o de recalcular x2/y2 a mano (dos
 * valores que pueden llegar a actualizarse en frames ligeramente distintos),
 * aquí el centro de giro nunca puede desincronizarse del centro real del reloj.
 */
function useRotatingTransform(durationSeconds: number) {
  const ref = useRef<SVGLineElement>(null);

  useEffect(() => {
    const angle = animate(0, 360, {
      repeat: Infinity,
      ease: "linear",
      duration: durationSeconds,
      onUpdate: (value) => {
        ref.current?.setAttribute("transform", `rotate(${value} 12 12)`);
      },
    });
    return () => angle.stop();
  }, [durationSeconds]);

  return ref;
}

/**
 * Reloj con las dos manecillas girando sin parar (la horaria, más despacio,
 * como en un reloj real) — única concesión de movimiento entre los iconos de
 * línea, para que el aviso de cuenta atrás se lea como "vivo" de un vistazo,
 * no como un icono estático más.
 */
export function AnimatedClockIcon({ className }: IconProps) {
  const hourHandRef = useRotatingTransform(18);
  const minuteHandRef = useRotatingTransform(6);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      {/* Horaria: corta, gira despacio sobre su propio centro (12,12), siempre fijo. */}
      <line ref={hourHandRef} x1="12" y1="12" x2="9.6" y2="9" />
      {/* Minutera: larga, gira más rápido sobre ese mismo centro. */}
      <line ref={minuteHandRef} x1="12" y1="12" x2="12" y2="5.8" />
    </svg>
  );
}
