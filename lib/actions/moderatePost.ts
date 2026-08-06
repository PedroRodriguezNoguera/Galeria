"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "./requireAdminSession";

export async function hidePost(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("media").update({ is_hidden: true }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

export async function showPost(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("media").update({ is_hidden: false }).eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

export async function deletePostPermanently(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { data: post, error: fetchError } = await supabase
    .from("media")
    .select("storage_path, thumbnail_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (post) {
    await supabase.storage.from("media-original").remove([post.storage_path]);
    await supabase.storage.from("media-thumbnails").remove([post.thumbnail_path]);
  }

  const { error: deleteError } = await supabase.from("media").delete().eq("id", id);
  if (deleteError) throw deleteError;

  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

export async function deleteReactions(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("reactions").delete().eq("media_id", id);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
}

/** Igual que hidePost, pero para la barra de acciones del modo selección múltiple. */
export async function hidePosts(ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("media").update({ is_hidden: true }).in("id", ids);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

/** Igual que showPost, pero para la barra de acciones del modo selección múltiple. */
export async function showPosts(ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("media").update({ is_hidden: false }).in("id", ids);
  if (error) throw error;
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

/** Igual que deletePostPermanently, pero para varios elementos a la vez. */
export async function deletePostsPermanently(ids: string[]) {
  await requireAdminSession();
  if (ids.length === 0) return;
  const supabase = createAdminClient();

  const { data: posts, error: fetchError } = await supabase
    .from("media")
    .select("storage_path, thumbnail_path")
    .in("id", ids);
  if (fetchError) throw fetchError;

  const originalPaths = (posts ?? []).map((post) => post.storage_path);
  const thumbnailPaths = (posts ?? []).map((post) => post.thumbnail_path);
  if (originalPaths.length > 0) {
    await supabase.storage.from("media-original").remove(originalPaths);
  }
  if (thumbnailPaths.length > 0) {
    await supabase.storage.from("media-thumbnails").remove(thumbnailPaths);
  }

  const { error: deleteError } = await supabase.from("media").delete().in("id", ids);
  if (deleteError) throw deleteError;

  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}
