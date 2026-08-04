import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export interface BingoSettings {
  enabled: boolean;
  drawnNumbers: number[];
  autoAssignCards: boolean;
  cardsResetAt: string | null;
  cardsPerVisitor: number;
}

/** Mismo patrón de fila única que feature_settings (ver fetchDestacadosEnabled). */
export async function fetchBingoSettings(
  supabase: SupabaseClient<Database>,
): Promise<BingoSettings> {
  const { data, error } = await supabase
    .from("bingo_settings")
    .select("enabled, drawn_numbers, auto_assign_cards, cards_reset_at, cards_per_visitor")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return {
    enabled: data?.enabled ?? false,
    drawnNumbers: data?.drawn_numbers ?? [],
    autoAssignCards: data?.auto_assign_cards ?? false,
    cardsResetAt: data?.cards_reset_at ?? null,
    cardsPerVisitor: data?.cards_per_visitor ?? 1,
  };
}
