import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Mismo patrón de fila única que header_settings (ver fetchDefaultTheme). */
export async function fetchDestacadosEnabled(
  supabase: SupabaseClient<Database>,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("feature_settings")
    .select("destacados_enabled")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return data?.destacados_enabled ?? false;
}

/** Activa el icono de Street View en el visor (sólo en publicaciones con coordenadas). */
export async function fetchMapEnabled(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { data, error } = await supabase
    .from("feature_settings")
    .select("map_enabled")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return data?.map_enabled ?? false;
}
