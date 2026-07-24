import { createClient } from "@/lib/supabase/server";
import { attachReactionSummaries } from "@/lib/data/gallery";
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

  const items = await attachReactionSummaries(supabase, posts ?? []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <AdminNav />
      <AdminDashboardHeader />
      <AdminGalleryGrid items={items} />
    </main>
  );
}
