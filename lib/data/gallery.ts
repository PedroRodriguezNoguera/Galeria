import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MediaWithReactions } from "@/types/media";
import { GALLERY_PAGE_SIZE } from "@/constants/limits";
import { isReactionEmoji } from "@/constants/reactions";

export interface GalleryCursor {
  sortDate: string;
  id: string;
}

export interface GalleryPage {
  items: MediaWithReactions[];
  nextCursor: GalleryCursor | null;
}

const TOP_REACTIONS_PER_TILE = 3;

/**
 * Paginación por keyset (sort_date, id) en vez de OFFSET: estable aunque se
 * publiquen fotos nuevas mientras alguien hace scroll, y con coste constante
 * página a página (a diferencia de OFFSET, que empeora según se avanza).
 * sort_date es una columna generada (coalesce(taken_at, created_at)): ordena
 * por la fecha en la que se hizo la foto y, si no hay EXIF, por la de subida.
 */
export async function fetchGalleryPage(
  supabase: SupabaseClient<Database>,
  cursor: GalleryCursor | null,
): Promise<GalleryPage> {
  let query = supabase
    .from("media")
    .select("*")
    // Las asignadas a una persona concreta (ver /admin/people) son de esa
    // persona: nunca deben aparecer en el feed público.
    .eq("is_unlisted", false)
    // Ocultadas desde moderación (ver lib/actions/moderatePost.ts): tampoco.
    .eq("is_hidden", false)
    .order("sort_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(GALLERY_PAGE_SIZE);

  if (cursor) {
    query = query.or(
      `sort_date.lt.${cursor.sortDate},and(sort_date.eq.${cursor.sortDate},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const last = rows.at(-1);
  const nextCursor =
    rows.length === GALLERY_PAGE_SIZE && last
      ? // sort_date nunca es null en la práctica (coalesce cae siempre a
        // created_at, que no admite null), pero la columna generada se
        // tipa como nullable porque Postgres no expone esa garantía.
        { sortDate: last.sort_date ?? last.created_at, id: last.id }
      : null;

  const items = await attachReactionSummaries(supabase, rows);

  return { items, nextCursor };
}

export async function attachReactionSummaries<T extends { id: string }>(
  supabase: SupabaseClient<Database>,
  rows: T[],
): Promise<(T & { topReactions: { emoji: string; count: number }[]; totalReactions: number })[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  // Una sola llamada para toda la página: nunca N+1 por miniatura.
  const { data: reactionRows, error } = await supabase.rpc("get_reaction_counts_bulk", {
    p_media_ids: ids,
  });
  if (error) throw error;

  const byMedia = new Map<string, { emoji: string; count: number }[]>();
  for (const row of reactionRows ?? []) {
    if (!row.emoji || !isReactionEmoji(row.emoji)) continue;
    const list = byMedia.get(row.media_id) ?? [];
    list.push({ emoji: row.emoji, count: row.count });
    byMedia.set(row.media_id, list);
  }

  return rows.map((row) => {
    const reactions = (byMedia.get(row.id) ?? []).sort((a, b) => b.count - a.count);
    return {
      ...row,
      topReactions: reactions.slice(0, TOP_REACTIONS_PER_TILE),
      totalReactions: reactions.reduce((sum, r) => sum + r.count, 0),
    };
  });
}
