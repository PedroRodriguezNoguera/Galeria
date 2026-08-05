import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { AlbumWithStats } from "@/types/album";
import { attachReactionSummaries } from "./gallery";

/**
 * Carpetas con recuento y portada, sin RPC dedicada: se esperan pocas carpetas
 * por fiesta (a diferencia de la galería, que sí necesita get_reaction_counts_bulk
 * para no hacer N+1 página a página), así que basta con dos consultas y agrupar
 * en JS, igual que hace attachReactionSummaries.
 */
export async function fetchAlbums(supabase: SupabaseClient<Database>): Promise<AlbumWithStats[]> {
  const { data: albums, error: albumsError } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false });
  if (albumsError) throw albumsError;
  if (!albums || albums.length === 0) return [];

  const albumIds = albums.map((album) => album.id);
  const { data: members, error: membersError } = await supabase
    .from("media")
    .select("album_id, thumbnail_path, media_type")
    .in("album_id", albumIds)
    // Igual que fetchGalleryPage: no basta con la RLS (que sólo protege al
    // rol anon) — si no se filtra también aquí, un admin con sesión iniciada
    // vería fotos ocultas en las portadas/recuentos de carpeta al visitar la
    // propia galería pública, aunque en moderación sí deba verlas.
    .eq("is_hidden", false)
    .order("sort_date", { ascending: false })
    .order("id", { ascending: false });
  if (membersError) throw membersError;

  const byAlbum = new Map<string, { thumbnail_path: string; media_type: string }[]>();
  for (const member of members ?? []) {
    if (!member.album_id) continue;
    const list = byAlbum.get(member.album_id) ?? [];
    list.push(member);
    byAlbum.set(member.album_id, list);
  }

  return albums
    .map((album) => {
      const albumMembers = byAlbum.get(album.id) ?? [];
      return {
        ...album,
        memberCount: albumMembers.length,
        // Ya viene ordenado por sort_date desc: las 3 primeras son las más recientes.
        covers: albumMembers.slice(0, 3),
      };
    })
    // Una carpeta sin fotos (p.ej. tras quitarlas todas) no debe verse como un tile vacío.
    .filter((album) => album.memberCount > 0);
}

export async function fetchAlbumMedia(supabase: SupabaseClient<Database>, albumId: string) {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("album_id", albumId)
    // Mismo motivo que en fetchAlbums: filtro explícito, no sólo RLS.
    .eq("is_hidden", false)
    .order("sort_date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return attachReactionSummaries(supabase, data ?? []);
}
