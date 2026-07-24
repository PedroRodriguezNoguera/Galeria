import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

let cachedAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Cliente con la service-role key: ignora RLS por completo.
 * SOLO se usa dentro de Server Actions / Route Handlers, nunca llega al navegador
 * (el import "server-only" hace fallar el build si algo lo importa desde código cliente).
 */
export function createAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Revisa .env.local.",
    );
  }

  cachedAdminClient = createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedAdminClient;
}
