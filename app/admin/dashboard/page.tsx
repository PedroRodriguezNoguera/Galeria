import { createClient } from "@/lib/supabase/server";
import { attachReactionSummaries } from "@/lib/data/gallery";
import { fetchAlbums } from "@/lib/data/albums";
import { AdminGalleryGrid } from "@/components/admin/AdminGalleryGrid";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("media")
    .select("*")
    // Las asignadas a una persona desde /admin/people viven aparte: no
    // pertenecen a esta lista de moderación general.
    .eq("is_unlisted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Se siguen mostrando aquí las ya asignadas a una carpeta (a diferencia del
  // feed público): moderación necesita poder gestionarlas igual que al resto.
  const [items, albums] = await Promise.all([
    attachReactionSummaries(supabase, posts ?? []),
    fetchAlbums(supabase),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:max-w-5xl xl:max-w-6xl">
      <AdminNav />
      <AdminDashboardHeader />
      <AdminGalleryGrid items={items} albums={albums} />
    </main>
  );
}
