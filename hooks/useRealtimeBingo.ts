"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BingoSettings } from "@/lib/data/bingoSettings";

interface BingoSettingsRow {
  enabled: boolean;
  drawn_numbers: number[];
  auto_assign_cards: boolean;
  cards_reset_at: string | null;
  cards_per_visitor: number;
}

/**
 * Se inicializa con el valor pedido en el servidor (sin parpadeo) y se
 * mantiene al día por Realtime: a diferencia del toggle de destacados, aquí
 * hace falta que quien ya tiene la página abierta vea los cambios sin
 * recargar (ver useRealtimeMedia, mismo patrón de canal).
 */
export function useRealtimeBingo(initial: BingoSettings) {
  const [settings, setSettings] = useState(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("bingo-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_settings" },
        (payload) => {
          const row = payload.new as BingoSettingsRow;
          setSettings({
            enabled: row.enabled,
            drawnNumbers: row.drawn_numbers,
            autoAssignCards: row.auto_assign_cards,
            cardsResetAt: row.cards_reset_at,
            cardsPerVisitor: row.cards_per_visitor,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return settings;
}
