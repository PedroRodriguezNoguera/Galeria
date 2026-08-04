"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "./requireAdminSession";

const DESTACADOS_PATH = "/admin/destacados";

export async function addToFeatured(ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("media")
    .update({ is_featured: true, featured_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
  revalidatePath(DESTACADOS_PATH);
  revalidatePath("/");
}

export async function removeFromFeatured(ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("media")
    .update({ is_featured: false, featured_at: null })
    .in("id", ids);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
  revalidatePath(DESTACADOS_PATH);
  revalidatePath("/");
}

export async function setDestacadosEnabled(enabled: boolean) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_settings")
    .update({ destacados_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
  revalidatePath(DESTACADOS_PATH);
  revalidatePath("/");
}

/** Activa/desactiva el icono de Street View en el visor. Revalida "/" porque condiciona qué botón se ve ahí. */
export async function setMapEnabled(enabled: boolean) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_settings")
    .update({ map_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
  revalidatePath(DESTACADOS_PATH);
  revalidatePath("/");
}
