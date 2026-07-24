import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_REACTIONS_PER_HOUR } from "@/constants/limits";

export type RateLimitAction = "reaction";

const LIMITS: Record<RateLimitAction, number> = {
  reaction: MAX_REACTIONS_PER_HOUR,
};

const WINDOW_MS = 60 * 60 * 1000;

export class RateLimitExceededError extends Error {
  constructor() {
    super("Has reaccionado demasiadas veces seguidas. Inténtalo de nuevo en un rato.");
    this.name = "RateLimitExceededError";
  }
}

/** Ventana deslizante de 1h contando eventos en `rate_limit_events`, sólo legible por service_role. */
export async function checkRateLimit(ipHash: string, action: RateLimitAction) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("action", action)
    .gte("created_at", since);

  if (error) throw error;

  if ((count ?? 0) >= LIMITS[action]) {
    throw new RateLimitExceededError();
  }
}

export async function recordRateLimitEvent(ipHash: string, action: RateLimitAction) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("rate_limit_events")
    .insert({ ip_hash: ipHash, action });
  if (error) throw error;
}
