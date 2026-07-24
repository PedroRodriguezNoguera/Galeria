"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isReactionEmoji } from "@/constants/reactions";
import { MAX_REACTIONS_PER_MEDIA } from "@/constants/limits";
import { hashIp } from "@/lib/security/hashIp";
import { getDeviceId } from "@/lib/security/deviceId";
import { checkRateLimit, recordRateLimitEvent } from "@/lib/security/rateLimit";

interface ToggleReactionInput {
  mediaId: string;
  emoji: string;
}

interface ToggleReactionResult {
  active: boolean;
}

export async function toggleReaction({
  mediaId,
  emoji,
}: ToggleReactionInput): Promise<ToggleReactionResult> {
  if (!isReactionEmoji(emoji)) throw new Error("Emoji no permitido.");
  if (!mediaId) throw new Error("media_id requerido.");

  // El device_id nunca llega como parámetro del cliente: se lee de la cookie
  // HttpOnly que asigna proxy.ts, así que nadie puede pasar el id de otra
  // persona para alternar (y por tanto borrar) sus reacciones.
  const deviceId = await getDeviceId();
  if (!deviceId) throw new Error("No se pudo identificar el dispositivo.");

  const ipHash = await hashIp();
  await checkRateLimit(ipHash, "reaction");

  const supabase = createAdminClient();

  const { data: existing, error: selectError } = await supabase
    .from("reactions")
    .select("id")
    .eq("media_id", mediaId)
    .eq("emoji", emoji)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { error: deleteError } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);
    if (deleteError) throw deleteError;
    return { active: false };
  }

  // Máximo de reacciones distintas por persona y publicación: se cuenta aquí,
  // no en el cliente, porque el cliente sólo conoce las reacciones que ya
  // cargó y nunca debe ser la única barrera para una regla de negocio.
  const { count, error: countError } = await supabase
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("media_id", mediaId)
    .eq("device_id", deviceId);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_REACTIONS_PER_MEDIA) {
    throw new Error(
      `Solo puedes usar hasta ${MAX_REACTIONS_PER_MEDIA} reacciones distintas por publicación.`,
    );
  }

  const { error: insertError } = await supabase
    .from("reactions")
    .insert({ media_id: mediaId, emoji, device_id: deviceId });
  if (insertError) throw insertError;

  await recordRateLimitEvent(ipHash, "reaction");

  return { active: true };
}
