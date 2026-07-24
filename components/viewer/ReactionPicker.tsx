"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ReactionEmoji } from "@/constants/reactions";
import { searchEmojis, type EmojiEntry } from "@/lib/emoji/emojiData";
import { cn } from "@/lib/utils/cn";

interface ReactionPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: ReactionEmoji) => void;
  mine: Set<string>;
  maxReached: boolean;
}

const COLUMNS = 6;
const ROW_HEIGHT = 56;
const GRID_HEIGHT = 280;

export default function ReactionPicker({
  open,
  onClose,
  onSelect,
  mine,
  maxReached,
}: ReactionPickerProps) {
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => searchEmojis(query), [query]);

  const rows = useMemo(() => {
    const chunks: EmojiEntry[][] = [];
    for (let i = 0; i < results.length; i += COLUMNS) {
      chunks.push(results.slice(i, i + COLUMNS));
    }
    return chunks;
  }, [results]);

  // overscan bajo a propósito: cada fila fuera de pantalla que se monte de más
  // es coste que no hace falta pagar en una rejilla de ~1900 emojis.
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-3 pb-2 pt-1">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar emoji"
          className="h-10 w-full rounded-glass-pill border border-glass-border bg-glass px-4 text-[15px] text-foreground outline-none backdrop-blur-md backdrop-saturate-150 placeholder:text-foreground-muted"
        />
      </div>

      <div
        ref={scrollRef}
        style={{ height: GRID_HEIGHT }}
        className="glass-scrollbar overflow-y-auto px-3 pb-4"
      >
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">Sin resultados</p>
        ) : (
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-6 gap-2"
              >
                {rows[virtualRow.index].map((entry) => {
                  const selected = mine.has(entry.emoji);
                  const disabled = !selected && maxReached;
                  return (
                    <button
                      key={entry.emoji}
                      type="button"
                      onClick={() => onSelect(entry.emoji)}
                      disabled={disabled}
                      aria-label={entry.label}
                      title={disabled ? "Máximo de reacciones alcanzado" : entry.label}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-glass-md border text-2xl transition-transform duration-100 active:scale-90",
                        selected
                          ? "border-foreground/25 bg-glass-strong"
                          : "border-glass-border bg-glass",
                        disabled && "opacity-35",
                      )}
                    >
                      {entry.emoji}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
