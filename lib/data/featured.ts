import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MediaRecord } from "@/types/media";

/**
 * Fotos/vídeos marcados como destacados desde moderación, de la más antigua a
 * la más reciente (sort_date: fecha en la que se hizo la foto, o de subida si
 * no hay EXIF — ver la migración add_media_sort_date) — el carrusel cuenta la
 * fiesta en orden cronológico, no en el orden en que se fueron marcando.
 */
export async function fetchFeaturedMedia(
  supabase: SupabaseClient<Database>,
): Promise<MediaRecord[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("is_featured", true)
    .eq("is_hidden", false)
    .eq("is_unlisted", false)
    .order("sort_date", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
