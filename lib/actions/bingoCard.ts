"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDeviceId } from "@/lib/security/deviceId";
import { generateBingoCard, type BingoCardGrid } from "@/lib/bingo/generateCard";

export interface BingoCard {
  cardIndex: number;
  grid: BingoCardGrid;
  markedNumbers: number[];
}

/**
 * Devuelve las papeletas del dispositivo actual (una o varias, según
 * cards_per_visitor). Si la asignación automática está activa y faltan
 * papeletas respecto a ese número (nuevo dispositivo, o el admin ha subido
 * el número de cartones), genera sólo las que faltan — las ya asignadas no
 * se tocan. Si está apagada, devuelve las que ya tuviera (sin repartir
 * nuevas) o un array vacío.
 *
 * Sin sesión de admin: cualquier visitante puede pedir las suyas — el
 * device_id nunca lo manda el cliente, se resuelve aquí de su propia
 * cookie HttpOnly (mismo patrón que toggleReaction).
 */
export async function getOrCreateMyBingoCards(): Promise<BingoCard[]> {
  const deviceId = await getDeviceId();
  if (!deviceId) return [];

  const supabase = createAdminClient();

  const { data: existingRows, error: selectError } = await supabase
    .from("bingo_cards")
    .select("card_index, grid, marked_numbers")
    .eq("device_id", deviceId)
    .order("card_index", { ascending: true });
  if (selectError) throw selectError;

  const existing: BingoCard[] = (existingRows ?? []).map((row) => ({
    cardIndex: row.card_index,
    grid: row.grid as unknown as BingoCardGrid,
    markedNumbers: row.marked_numbers,
  }));

  const { data: settings, error: settingsError } = await supabase
    .from("bingo_settings")
    .select("auto_assign_cards, cards_per_visitor")
    .eq("id", true)
    .maybeSingle();
  if (settingsError) throw settingsError;
  if (!settings?.auto_assign_cards) return existing;

  const wanted = settings.cards_per_visitor;
  if (existing.length >= wanted) return existing.slice(0, wanted);

  const newRows = Array.from({ length: wanted - existing.length }, (_, i) => ({
    device_id: deviceId,
    card_index: existing.length + i,
    grid: generateBingoCard(),
    marked_numbers: [],
  }));

  const { error: insertError } = await supabase.from("bingo_cards").insert(newRows);
  if (insertError) {
    // Carrera: dos pestañas del mismo dispositivo pidiendo papeletas a la
    // vez pueden chocar contra la clave primaria — no es un fallo real, solo
    // significa que la otra ya ganó; se relee la suya en vez de romper.
    if (insertError.code === "23505") {
      const { data: retryRows, error: retryError } = await supabase
        .from("bingo_cards")
        .select("card_index, grid, marked_numbers")
        .eq("device_id", deviceId)
        .order("card_index", { ascending: true });
      if (retryError) throw retryError;
      return (retryRows ?? [])
        .map((row) => ({
          cardIndex: row.card_index,
          grid: row.grid as unknown as BingoCardGrid,
          markedNumbers: row.marked_numbers,
        }))
        .slice(0, wanted);
    }
    throw insertError;
  }

  return [
    ...existing,
    ...newRows.map((row) => ({
      cardIndex: row.card_index,
      grid: row.grid,
      markedNumbers: row.marked_numbers,
    })),
  ];
}

/**
 * Marca/desmarca un número de una de tus propias papeletas (arrastrarlo
 * para quitarlo). Vía la función SQL set_bingo_card_number_marked (una sola
 * sentencia atómica con array_append/array_remove calculado en el propio
 * servidor de base de datos) por el mismo motivo que toggle_bingo_number:
 * no leer-modificar-escribir desde aquí.
 */
export async function markBingoCardNumber(cardIndex: number, n: number, marked: boolean) {
  const deviceId = await getDeviceId();
  if (!deviceId) throw new Error("No se pudo identificar el dispositivo.");

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("set_bingo_card_number_marked", {
    p_device_id: deviceId,
    p_card_index: cardIndex,
    p_number: n,
    p_marked: marked,
  });
  if (error) throw error;
}
