"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getDeviceId } from "@/lib/security/deviceId";

/**
 * Emojis con los que este dispositivo (según su cookie HttpOnly, nunca un
 * valor que mande el cliente) ha reaccionado a una publicación.
 */
export async function getMyReactionEmojis(mediaId: string): Promise<string[]> {
  const deviceId = await getDeviceId();
  if (!deviceId) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("emoji")
    .eq("media_id", mediaId)
    .eq("device_id", deviceId);

  if (error) throw error;
  return (data ?? []).map((row) => row.emoji);
}
