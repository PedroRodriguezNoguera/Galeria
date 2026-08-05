"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AlbumWithStats } from "@/types/album";
import { AlbumTile } from "./AlbumTile";
import { GalleryTile } from "./GalleryTile";
import { Spinner } from "@/components/ui/Spinner";
import { useAlbumMedia } from "@/hooks/useAlbumMedia";
import { staggerChildren } from "@/animations/variants";
import { springGentle, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface AlbumsSectionProps {
  albums: AlbumWithStats[];
}

/**
 * Fila de carpetas pinchable, fija encima del feed cronológico (no forma parte
 * de la lista virtualizada de GalleryGrid: mezclar dos fuentes con paginación
 * por cursor distinta ahí sería mucho más invasivo para un beneficio menor).
 * Pulsar una carpeta la expande in situ mostrando su contenido; pulsarla de
 * nuevo la recoge.
 */
export function AlbumsSection({ albums }: AlbumsSectionProps) {
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  function handleTap(albumId: string) {
    setExpandedAlbumId((current) => (current === albumId ? null : albumId));
  }

  const expandedAlbum = albums.find((album) => album.id === expandedAlbumId) ?? null;

  return (
    <div className="mt-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6 xl:grid-cols-8"
      >
        {albums.map((album) => (
          <AlbumTile
            key={album.id}
            album={album}
            expanded={album.id === expandedAlbumId}
            onTap={() => handleTap(album.id)}
          />
        ))}
      </motion.div>

      <AnimatePresence initial={false}>
        {expandedAlbum ? (
          <motion.div
            key={expandedAlbum.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? fadeTransition : springGentle}
            className="overflow-hidden"
          >
            <ExpandedAlbumContent albumId={expandedAlbum.id} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ExpandedAlbumContent({ albumId }: { albumId: string }) {
  const { data, isPending } = useAlbumMedia(albumId);

  if (isPending) {
    return (
      <div className="flex justify-center py-8 text-foreground-muted">
        <Spinner size={22} />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1.5 pt-2 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6 xl:grid-cols-8">
      {data.map((media) => (
        <GalleryTile key={media.id} media={media} albumId={albumId} />
      ))}
    </div>
  );
}
