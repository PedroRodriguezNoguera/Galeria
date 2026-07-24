"use client";

interface EncierroFenceProps {
  className?: string;
}

const POST_XS = [4, 34, 64, 94, 124, 154, 184, 214, 244, 274, 304, 334, 364, 394];

/**
 * Valla de madera de un encierro: carrera superior + postes repetidos +
 * riostra diagonal entre cada dos postes (como una barrera real, no una
 * franja lisa), con veteado (líneas finas irregulares) en el travesaño para
 * que se lea como madera y no como un bloque de color. `preserveAspectRatio="none"`
 * a propósito: esta valla debe estirarse para cubrir el ancho real de la
 * cabecera (variable), no mantener proporción como los iconos de tamaño fijo.
 */
export function EncierroFence({ className }: EncierroFenceProps) {
  return (
    <svg viewBox="0 0 400 16" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fenceWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a97c50" />
          <stop offset="1" stopColor="#7a5530" />
        </linearGradient>
        <linearGradient id="fencePost" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6238" />
          <stop offset="1" stopColor="#5c3f22" />
        </linearGradient>
      </defs>

      {/* riostras diagonales entre postes alternos */}
      {POST_XS.slice(0, -1).map((x, i) =>
        i % 2 === 0 ? (
          <line key={`brace-${x}`} x1={x + 3} y1="1" x2={x + 33} y2="15" stroke="#6b4a28" strokeWidth="2.2" opacity="0.75" />
        ) : null,
      )}

      {/* travesaño superior e inferior */}
      <rect x="0" y="0" width="400" height="4.5" fill="url(#fenceWood)" />
      <rect x="0" y="11.5" width="400" height="4.5" fill="url(#fenceWood)" />
      {/* veteado: líneas finas irregulares sobre los travesaños, no un color plano */}
      {[1.2, 2.4, 3.3].map((y) => (
        <path key={`grain-top-${y}`} d={`M0 ${y} Q100 ${y + 0.6} 200 ${y} T400 ${y}`} stroke="#5c3f22" strokeWidth="0.35" fill="none" opacity="0.4" />
      ))}
      {[12.4, 13.6, 14.6].map((y) => (
        <path key={`grain-bottom-${y}`} d={`M0 ${y} Q100 ${y - 0.6} 200 ${y} T400 ${y}`} stroke="#5c3f22" strokeWidth="0.35" fill="none" opacity="0.4" />
      ))}

      {/* postes verticales */}
      {POST_XS.map((x) => (
        <rect key={x} x={x} y="0" width="5" height="16" rx="0.8" fill="url(#fencePost)" stroke="#3f2a15" strokeWidth="0.3" />
      ))}
    </svg>
  );
}
