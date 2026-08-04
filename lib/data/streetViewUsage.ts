import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cuántas veces se ha cargado ya un panorama de Street View este mes (ver
 * street_view_loads/recordStreetViewLoad). La función RPC es SECURITY
 * DEFINER: sólo expone el conteo, nunca las filas — la tabla en sí no tiene
 * ninguna política de lectura pública.
 */
export async function fetchStreetViewLoadCount(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_street_view_load_count_this_month");
  if (error) throw error;
  return data ?? 0;
}
