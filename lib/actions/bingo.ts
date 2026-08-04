"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "./requireAdminSession";

const BINGO_PATH = "/admin/bingo";

export async function setBingoEnabled(enabled: boolean) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bingo_settings")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
  revalidatePath(BINGO_PATH);
  revalidatePath("/");
}

/** Cada visitante recibe su(s) propia(s) papeleta(s) automáticamente (ver getOrCreateMyBingoCards). */
export async function setAutoAssignCards(enabled: boolean) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bingo_settings")
    .update({ auto_assign_cards: enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
  revalidatePath(BINGO_PATH);
  revalidatePath("/");
}

/** Cuántas papeletas recibe cada visitante (tope 1-6, ver check de bingo_settings). */
export async function setCardsPerVisitor(count: number) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bingo_settings")
    .update({ cards_per_visitor: count, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
  revalidatePath(BINGO_PATH);
  revalidatePath("/");
}

/**
 * Añade/quita el número en una única sentencia SQL atómica (ver la función
 * toggle_bingo_number: UPDATE ... RETURNING con array_append/array_remove
 * calculado en el propio servidor de base de datos), no leer-modificar-
 * escribir desde aquí: dos toques rápidos del admin (el panel anima a tocar
 * rápido, con botones grandes de 5 por fila) podían solaparse y perder uno
 * de los dos cambios si cada uno leía el array antes de que el otro
 * terminara de escribir.
 */
export async function toggleBingoNumber(n: number) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("toggle_bingo_number", { p_number: n });
  if (error) throw error;
  revalidatePath(BINGO_PATH);
}

export async function resetBingo() {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bingo_settings")
    .update({ drawn_numbers: [], updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
  revalidatePath(BINGO_PATH);
  revalidatePath("/");
}

/**
 * Borra todas las papeletas asignadas (para empezar una partida nueva de
 * cero) y marca `cards_reset_at`: los visitantes que ya tienen la página
 * abierta lo detectan por Realtime (ver useRealtimeBingo/MyBingoCard) y
 * piden una papeleta nueva en vez de quedarse con la suya, ya borrada.
 */
export async function resetBingoCards() {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error: deleteError } = await supabase
    .from("bingo_cards")
    .delete()
    .not("device_id", "is", null);
  if (deleteError) throw deleteError;

  const { error: updateError } = await supabase
    .from("bingo_settings")
    .update({ cards_reset_at: new Date().toISOString() })
    .eq("id", true);
  if (updateError) throw updateError;

  revalidatePath(BINGO_PATH);
  revalidatePath("/");
}
