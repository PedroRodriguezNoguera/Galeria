"use client";

import { useMemo, useState, useTransition } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { DownloadIcon, MapPinIcon } from "@/components/ui/icons";
import { setMapEnabled } from "@/lib/actions/featured";
import { STREET_VIEW_MONTHLY_FREE_LIMIT, STREET_VIEW_MONTHLY_SAFE_LIMIT } from "@/constants/limits";
import type { AlbumWithStats } from "@/types/album";

const EXPORT_ALL = "all";

interface AjustesScreenProps {
  mapEnabled: boolean;
  streetViewLoadCount: number;
  albums: AlbumWithStats[];
}

/**
 * Ajustes globales que no pertenecen a ningún tipo de contenido concreto
 * (a diferencia de Destacados/Bingo/Planificación, cuyos ajustes viven junto
 * al contenido que controlan): el mapa afecta al visor de cualquier foto con
 * GPS, y exportar descarga todo el archivo, no una selección.
 */
export function AjustesScreen({ mapEnabled, streetViewLoadCount, albums }: AjustesScreenProps) {
  const [enabled, setEnabled] = useState(mapEnabled);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportTarget, setExportTarget] = useState<string>(EXPORT_ALL);

  const exportHref = useMemo(
    () =>
      exportTarget === EXPORT_ALL
        ? "/admin/export"
        : `/admin/export?albumId=${encodeURIComponent(exportTarget)}`,
    [exportTarget],
  );

  function handleToggle() {
    const previous = enabled;
    const next = !enabled;
    setEnabled(next);
    setToggleError(null);
    startTransition(async () => {
      try {
        await setMapEnabled(next);
      } catch (err) {
        setEnabled(previous);
        setToggleError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Ajustes</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Opciones generales, independientes de una foto, un evento o una sección concreta.
        </p>
      </div>

      <GlassPanel className="mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glass-strong text-foreground-muted">
          <MapPinIcon className="h-4 w-4" />
        </span>
        <div>
          <span className="text-sm font-medium text-foreground">Mapa (Street View)</span>
          <p className="text-xs text-foreground-muted">
            Añade un icono en el visor para ver, con Street View, dónde se hizo cada foto con
            coordenadas GPS.
          </p>
        </div>
        <Button
          variant={enabled ? "primary" : "glass"}
          size="sm"
          disabled={isPending}
          onClick={handleToggle}
          className="ml-auto"
        >
          {enabled ? "Activado" : "Desactivado"}
        </Button>
        {toggleError ? <span className="text-xs text-red-500">{toggleError}</span> : null}
        <p className="w-full text-xs text-foreground-muted">
          {streetViewLoadCount} de {STREET_VIEW_MONTHLY_FREE_LIMIT} cargas gratis usadas este mes
          {streetViewLoadCount >= STREET_VIEW_MONTHLY_SAFE_LIMIT ? (
            <span className="ml-1 font-medium text-red-500">
              — bloqueado automáticamente hasta el mes que viene
            </span>
          ) : null}
        </p>
      </GlassPanel>

      <GlassPanel className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glass-strong text-foreground-muted">
          <DownloadIcon className="h-4 w-4" />
        </span>
        <div>
          <span className="text-sm font-medium text-foreground">Exportar</span>
          <p className="text-xs text-foreground-muted">
            Descarga un ZIP con las fotos y vídeos originales, de toda la galería o de una sola
            carpeta.
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={exportTarget}
            onChange={(event) => setExportTarget(event.target.value)}
            aria-label="Qué exportar"
            className="h-9 rounded-glass-md border border-glass-border bg-glass px-3 text-sm text-foreground outline-none"
          >
            <option value={EXPORT_ALL}>Todo</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name} ({album.memberCount})
              </option>
            ))}
          </select>
          {/* Descarga directa (GET con Content-Disposition: attachment), no una
              Server Action: así el navegador la trata como una descarga nativa
              en streaming, sin pasar el ZIP entero por memoria del cliente. */}
          <a
            href={exportHref}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-glass-pill border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl transition-colors"
          >
            Descargar
          </a>
        </div>

        {albums.length === 0 ? (
          <p className="w-full text-xs text-foreground-muted">
            Todavía no hay carpetas con fotos — sólo se puede exportar todo.
          </p>
        ) : null}
      </GlassPanel>
    </>
  );
}
