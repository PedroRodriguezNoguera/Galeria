"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "./requireAdminSession";

function revalidateAlbumPaths() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

export async function createAlbum(name: string): Promise<string> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("albums")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw error;
  revalidateAlbumPaths();
  return data.id;
}

export async function addMediaToAlbum(ids: string[], albumId: string) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("media").update({ album_id: albumId }).in("id", ids);
  if (error) throw error;
  revalidateAlbumPaths();
}

/** Crea la carpeta y asigna en la misma acción: es el flujo de "carpeta nueva" desde la hoja de selección. */
export async function createAlbumAndAddMedia(name: string, ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("albums")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw error;

  const { error: assignError } = await supabase
    .from("media")
    .update({ album_id: data.id })
    .in("id", ids);
  if (assignError) throw assignError;

  revalidateAlbumPaths();
}

/** Deshace la asignación: vuelve a mostrar esas publicaciones en el feed cronológico normal. */
export async function removeMediaFromAlbum(ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("media").update({ album_id: null }).in("id", ids);
  if (error) throw error;
  revalidateAlbumPaths();
}
