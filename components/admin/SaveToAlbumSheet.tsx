"use client";

import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { AlbumWithStats } from "@/types/album";
import { addMediaToAlbum, createAlbumAndAddMedia } from "@/lib/actions/albums";

interface SaveToAlbumSheetProps {
  open: boolean;
  onClose: () => void;
  albums: AlbumWithStats[];
  selectedIds: string[];
  /** Selección ya guardada: cierra la hoja, limpia la selección y refresca. */
  onSaved: () => void;
}

export function SaveToAlbumSheet({
  open,
  onClose,
  albums,
  selectedIds,
  onSaved,
}: SaveToAlbumSheetProps) {
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreateNew() {
    const name = newAlbumName.trim();
    if (!name || selectedIds.length === 0) return;
    startTransition(async () => {
      await createAlbumAndAddMedia(name, selectedIds);
      setNewAlbumName("");
      onSaved();
    });
  }

  function handleAddExisting(albumId: string) {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      await addMediaToAlbum(selectedIds, albumId);
      onSaved();
    });
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-3 px-2 pb-1">
        <h2 className="text-[15px] font-semibold text-foreground">Guardar en carpeta</h2>

        <form
          className="flex gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateNew();
          }}
        >
          <input
            type="text"
            value={newAlbumName}
            onChange={(event) => setNewAlbumName(event.target.value)}
            placeholder="Nueva carpeta…"
            disabled={isPending}
            className="h-10 flex-1 rounded-glass-pill border border-glass-border bg-glass px-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none disabled:opacity-40"
          />
          <Button type="submit" size="sm" disabled={isPending || !newAlbumName.trim()}>
            Crear
          </Button>
        </form>

        {albums.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground-muted">O añadir a una ya existente</p>
            <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
              {albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAddExisting(album.id)}
                  className="flex items-center justify-between rounded-glass-md border border-glass-border bg-glass px-3 py-2 text-left text-sm text-foreground transition-colors disabled:opacity-40"
                >
                  <span className="truncate">{album.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-foreground-muted">
                    {album.memberCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isPending ? (
          <div className="flex justify-center py-1 text-foreground-muted">
            <Spinner size={18} />
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
