import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MediaRecord } from "@/types/media";
import type { ReactionCounts } from "@/types/reaction";
import { isReactionEmoji } from "@/constants/reactions";

export async function fetchMediaById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<MediaRecord | null> {
  const { data, error } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface GeolocatedMedia extends MediaRecord {
  latitude: number;
  longitude: number;
}

/**
 * Sólo lo publicado con coordenadas (nunca lo oculto por moderación ni lo
 * asignado a una persona, mismo criterio que la galería pública, ver
 * fetchGalleryPage) — para pintar el resto de publicaciones geolocalizadas
 * dentro del overlay de Street View (ver StreetViewOverlay). Se llama sólo
 * cuando el overlay ya está abierto, nunca antes. Trae la fila completa (no
 * sólo id/lat/lng/miniatura) porque StreetViewOverlay puede pasarle el
 * registro entero a MediaViewer.goTo si el usuario decide ver esa
 * publicación, sin tener que pedirla aparte.
 */
export async function fetchGeolocatedMedia(
  supabase: SupabaseClient<Database>,
): Promise<GeolocatedMedia[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("is_hidden", false)
    .eq("is_unlisted", false)
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  if (error) throw error;

  return (data ?? []).filter(
    (row): row is GeolocatedMedia => row.latitude !== null && row.longitude !== null,
  );
}

export async function fetchReactionCounts(
  supabase: SupabaseClient<Database>,
  mediaId: string,
): Promise<ReactionCounts> {
  // RPC a una función SECURITY DEFINER: agrega sobre `reactions` (tabla sin
  // lectura pública) y sólo devuelve (emoji, count), nunca device_id.
  const { data, error } = await supabase.rpc("get_reaction_counts", { p_media_id: mediaId });

  if (error) throw error;

  const counts: ReactionCounts = {};
  for (const row of data ?? []) {
    if (row.emoji && isReactionEmoji(row.emoji)) {
      counts[row.emoji] = row.count ?? 0;
    }
  }
  return counts;
}
