import { createAdminClient } from "@/lib/supabase/admin";
import { attachReactionSummaries } from "@/lib/data/gallery";
import { fetchStreetViewLoadCount } from "@/lib/data/streetViewUsage";
import { AdminNav } from "@/components/admin/AdminNav";
import { DestacadosScreen } from "@/components/admin/DestacadosScreen";

export default async function AdminDestacadosPage() {
  const supabase = createAdminClient();

  const [
    { data: posts, error: postsError },
    { data: settings, error: settingsError },
    streetViewLoadCount,
  ] = await Promise.all([
    supabase
      .from("media")
      .select("*")
      .eq("is_featured", true)
      // Por sort_date (fecha de la foto/vídeo, no de cuándo se marcó como
      // destacado): así destacar algo no lo manda al final/principio de
      // esta lista, se queda en su sitio cronológico — mismo criterio que
      // el carrusel público (ver fetchFeaturedMedia).
      .order("sort_date", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("feature_settings")
      .select("destacados_enabled, map_enabled")
      .eq("id", true)
      .maybeSingle(),
    fetchStreetViewLoadCount(supabase),
  ]);

  if (postsError) throw postsError;
  if (settingsError) throw settingsError;

  const items = await attachReactionSummaries(supabase, posts ?? []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:max-w-5xl xl:max-w-6xl">
      <AdminNav />
      <DestacadosScreen
        items={items}
        destacadosEnabled={settings?.destacados_enabled ?? false}
        mapEnabled={settings?.map_enabled ?? false}
        streetViewLoadCount={streetViewLoadCount}
      />
    </main>
  );
}
