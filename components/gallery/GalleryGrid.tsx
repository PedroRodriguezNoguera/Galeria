"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useGalleryFeed } from "@/hooks/useGalleryFeed";
import { useRealtimeMedia } from "@/hooks/useRealtimeMedia";
import { useRealtimeReactions } from "@/hooks/useRealtimeReactions";
import { onScrollToMedia } from "@/lib/events/scrollBus";
import { GalleryTile } from "./GalleryTile";
import { Spinner } from "@/components/ui/Spinner";
import type { MediaWithReactions } from "@/types/media";

// Mismo número de columnas en móvil de siempre (nunca cambia por debajo de
// 1024px). En pantallas de escritorio se amplía: la rejilla está virtualizada
// y el número de columnas también decide cómo se agrupan los elementos en
// "filas" (ver chunkIntoRows) — por eso no basta con clases de Tailwind
// (grid-cols-N por breakpoint) sueltas: si CSS mostrara más columnas que las
// que JS mete en cada fila, sobraría hueco a la derecha de cada fila. Este
// hook mantiene ambas cosas sincronizadas con el mismo criterio.
const MOBILE_COLUMNS = 3;
const COLUMN_BREAKPOINTS: { query: string; columns: number }[] = [
  { query: "(min-width: 1280px)", columns: 6 },
  { query: "(min-width: 1024px)", columns: 5 },
];

function getResponsiveColumns(): number {
  if (typeof window === "undefined") return MOBILE_COLUMNS;
  const match = COLUMN_BREAKPOINTS.find(({ query }) => window.matchMedia(query).matches);
  return match?.columns ?? MOBILE_COLUMNS;
}

function useResponsiveColumns(): number {
  const [columns, setColumns] = useState(MOBILE_COLUMNS);

  useEffect(() => {
    const mediaQueries = COLUMN_BREAKPOINTS.map(({ query }) => window.matchMedia(query));
    function update() {
      setColumns(getResponsiveColumns());
    }
    update();
    mediaQueries.forEach((mql) => mql.addEventListener("change", update));
    return () => mediaQueries.forEach((mql) => mql.removeEventListener("change", update));
  }, []);

  return columns;
}

// Estimación inicial de alto de fila; el virtualizador la corrige con la
// medida real tras el primer render (measureElement), así que no depende
// de acertar el valor exacto por breakpoint.
const ESTIMATED_ROW_HEIGHT = 140;
const LOADER_ROW_HEIGHT = 64;

function chunkIntoRows(items: MediaWithReactions[], columns: number): MediaWithReactions[][] {
  const rows: MediaWithReactions[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

export function GalleryGrid() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useGalleryFeed();
  useRealtimeMedia();
  useRealtimeReactions();

  const columns = useResponsiveColumns();
  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const rows = useMemo(() => chunkIntoRows(items, columns), [items, columns]);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // offsetTop de la lista respecto al documento: se lee tras montar (nunca durante
  // el render) y se recalcula en resize, por si cambia el safe-area-inset al rotar.
  useEffect(() => {
    function updateScrollMargin() {
      setScrollMargin(listRef.current?.offsetTop ?? 0);
    }
    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    return () => window.removeEventListener("resize", updateScrollMargin);
  }, []);

  // +1 fila "fantasma" para el spinner de "cargando más" cuando hay página
  // siguiente: así el virtualizador reserva su hueco igual que cualquier fila.
  const rowCount = hasNextPage ? rows.length + 1 : rows.length;

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: (index) => (index < rows.length ? ESTIMATED_ROW_HEIGHT : LOADER_ROW_HEIGHT),
    overscan: 6,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Sólo montamos ~overscan filas a la vez: pedir la página siguiente cuando
  // la última fila virtual visible se acerca al final de las que ya tenemos.
  useEffect(() => {
    const lastRow = virtualRows.at(-1);
    if (!lastRow) return;
    if (lastRow.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualRows, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Al cerrar el visor, corrige el scroll hacia el elemento que se estaba
  // viendo de verdad — el router.back() del visor ya habrá restaurado el
  // scroll de antes de abrirlo, así que esto se aplica después (doble rAF)
  // para ganarle la partida a esa restauración nativa.
  useEffect(() => {
    return onScrollToMedia((mediaId) => {
      const itemIndex = items.findIndex((item) => item.id === mediaId);
      if (itemIndex === -1) return;
      const rowIndex = Math.floor(itemIndex / columns);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(rowIndex, { align: "center" });
        });
      });
    });
  }, [items, columns, rowVirtualizer]);

  if (isPending) {
    return (
      <div className="flex justify-center py-20 text-foreground-muted">
        <Spinner size={28} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center text-foreground-muted">
        <p className="text-[17px] font-medium text-foreground">Todavía no hay nada aquí</p>
        <p className="max-w-xs text-sm">Sé el primero en compartir una foto o un vídeo.</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        const top = virtualRow.start - rowVirtualizer.options.scrollMargin;

        return (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute left-0 w-full"
            style={{ transform: `translateY(${top}px)` }}
          >
            {row ? (
              <div
                className="grid gap-1.5 pb-1.5 sm:gap-2 sm:pb-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {row.map((media) => (
                  <GalleryTile key={media.id} media={media} />
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-6 text-foreground-muted">
                <Spinner size={22} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
