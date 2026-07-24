import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Defensa en profundidad: el proxy ya protege /admin/**, pero cada acción
 *  privilegiada vuelve a comprobar la sesión antes de tocar datos. */
export async function requireAdminSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("No autorizado.");
}
