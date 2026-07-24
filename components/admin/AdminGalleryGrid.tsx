"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaWithReactions } from "@/types/media";
import { AdminGalleryTile } from "./AdminGalleryTile";
import { AdminMediaViewer } from "./AdminMediaViewer";
import { staggerChildren, slideUpSheet } from "@/animations/variants";
import { springSheet, springSnappy, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Spinner } from "@/components/ui/Spinner";
import { hidePosts, deletePostsPermanently } from "@/lib/actions/moderatePost";
import { addToFeatured, removeFromFeatured } from "@/lib/actions/featured";

interface AdminGalleryGridProps {
  items: MediaWithReactions[];
}

type SortMode = "recent" | "mostReactions" | "leastReactions";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Recientes" },
  { value: "mostReactions", label: "Más reacciones" },
  { value: "leastReactions", label: "Menos reacciones" },
];

export function AdminGalleryGrid({ items }: AdminGalleryGridProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [openMediaId, setOpenMediaId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const selectionMode = selectedIds.size > 0;
  // Si TODO lo seleccionado ya está destacado, el botón se convierte en
  // "quitar de destacados" en vez de volver a destacar (que sería un no-op);
  // en cuanto se mezcla con algo que no lo está, vuelve a ofrecer destacar
  // (así también se completa lo que falte del grupo).
  const selectedFeaturedState = useMemo(() => {
    if (selectedIds.size === 0) return false;
    const selected = items.filter((item) => selectedIds.has(item.id));
    return selected.length > 0 && selected.every((item) => item.is_featured);
  }, [items, selectedIds]);

  // Orden sólo para esta pantalla: no toca la consulta del servidor (que
  // sigue llegando por fecha), simplemente reordena el array ya cargado.
  const sortedItems = useMemo(() => {
    if (sortBy === "recent") return items;
    const sorted = [...items].sort((a, b) => b.totalReactions - a.totalReactions);
    if (sortBy === "leastReactions") sorted.reverse();
    return sorted;
  }, [items, sortBy]);

  // Vecinos calculados aquí mismo (no hay ruta por id en /admin, así que no
  // hace falta el truco de history.replaceState del visor público: basta con
  // levantar el "id actual" al padre y dejar que re-renderice con props nuevas.
  // Usa el orden actualmente visible para que prev/next coincidan con la grilla.
  const openIndex = useMemo(
    () => sortedItems.findIndex((item) => item.id === openMediaId),
    [sortedItems, openMediaId],
  );
  const openMedia = openIndex >= 0 ? sortedItems[openIndex] : null;
  const prevMedia = openIndex > 0 ? sortedItems[openIndex - 1] : null;
  const nextMedia =
    openIndex >= 0 && openIndex < sortedItems.length - 1 ? sortedItems[openIndex + 1] : null;

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Pulsación mantenida: entra en modo selección con esta miniatura ya marcada.
  function handleActivateSelection(id: string) {
    setSelectedIds(new Set([id]));
  }

  function handleTileTap(id: string) {
    if (selectionMode) {
      toggleSelected(id);
    } else {
      setOpenMediaId(id);
    }
  }

  function runBulkAction(action: (ids: string[]) => Promise<unknown>) {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      await action(ids);
      clearSelection();
      router.refresh();
    });
  }

  function handleBulkDelete() {
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `¿Eliminar ${count} publicación${count === 1 ? "" : "es"} de forma definitiva? No se puede deshacer.`,
    );
    if (!confirmed) return;
    runBulkAction(deletePostsPermanently);
  }

  if (items.length === 0) {
    return <p className="text-sm text-foreground-muted">No hay publicaciones todavía.</p>;
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={sortBy === option.value ? "primary" : "glass"}
            className="h-8 px-3 text-xs"
            onClick={() => setSortBy(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2"
      >
        {sortedItems.map((media) => (
          <AdminGalleryTile
            key={media.id}
            media={media}
            selectionMode={selectionMode}
            selected={selectedIds.has(media.id)}
            onActivateSelection={() => handleActivateSelection(media.id)}
            onTap={() => handleTileTap(media.id)}
          />
        ))}
      </motion.div>

      {openMedia ? (
        <AdminMediaViewer
          media={openMedia}
          prevMedia={prevMedia}
          nextMedia={nextMedia}
          onNavigate={setOpenMediaId}
          onClose={() => {
            setOpenMediaId(null);
            // Sólo tras cerrar del todo (p.ej. tras eliminar): ya no hay
            // animación de salida en curso a la que pueda cortar en seco.
            router.refresh();
          }}
        />
      ) : null}

      <AnimatePresence>
        {selectionMode ? (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={slideUpSheet}
            transition={prefersReducedMotion ? fadeTransition : springSheet}
            className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          >
            <GlassPanel
              strong
              elevation="lg"
              className="flex w-full max-w-md flex-col gap-2 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={selectedIds.size}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                    transition={prefersReducedMotion ? fadeTransition : springSnappy}
                    className="text-sm font-medium text-foreground"
                  >
                    {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}
                  </motion.span>
                </AnimatePresence>
                {isPending ? <Spinner size={16} className="text-foreground-muted" /> : null}
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isPending}
                  aria-label="Cancelar selección"
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground-muted disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant={selectedFeaturedState ? "primary" : "glass"}
                  size="sm"
                  className="flex-1 overflow-hidden"
                  disabled={isPending}
                  onClick={() =>
                    runBulkAction(selectedFeaturedState ? removeFromFeatured : addToFeatured)
                  }
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={selectedFeaturedState ? "unfeature" : "feature"}
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
                      transition={prefersReducedMotion ? fadeTransition : springSnappy}
                    >
                      {selectedFeaturedState ? "Quitar de destacados" : "Destacar ⭐"}
                    </motion.span>
                  </AnimatePresence>
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => runBulkAction(hidePosts)}
                >
                  Ocultar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={isPending}
                  onClick={handleBulkDelete}
                >
                  Eliminar
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
