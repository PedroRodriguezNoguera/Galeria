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
