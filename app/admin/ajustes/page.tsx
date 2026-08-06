import { createAdminClient } from "@/lib/supabase/admin";
import { fetchStreetViewLoadCount } from "@/lib/data/streetViewUsage";
import { fetchAlbums } from "@/lib/data/albums";
import { AdminNav } from "@/components/admin/AdminNav";
import { AjustesScreen } from "@/components/admin/AjustesScreen";

export default async function AdminAjustesPage() {
  const supabase = createAdminClient();

  const [{ data: settings, error: settingsError }, streetViewLoadCount, albums] =
    await Promise.all([
      supabase.from("feature_settings").select("map_enabled").eq("id", true).maybeSingle(),
      fetchStreetViewLoadCount(supabase),
      fetchAlbums(supabase),
    ]);

  if (settingsError) throw settingsError;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:max-w-5xl xl:max-w-6xl">
      <AdminNav />
      <AjustesScreen
        mapEnabled={settings?.map_enabled ?? false}
        streetViewLoadCount={streetViewLoadCount}
        albums={albums}
      />
    </main>
  );
}
