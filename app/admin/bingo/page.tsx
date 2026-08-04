import { createAdminClient } from "@/lib/supabase/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { BingoScreen } from "@/components/admin/BingoScreen";

export default async function AdminBingoPage() {
  const supabase = createAdminClient();

  const { data: settings, error } = await supabase
    .from("bingo_settings")
    .select("enabled, drawn_numbers, auto_assign_cards, cards_reset_at, cards_per_visitor")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:max-w-5xl xl:max-w-6xl">
      <AdminNav />
      <BingoScreen
        initialEnabled={settings?.enabled ?? false}
        initialDrawnNumbers={settings?.drawn_numbers ?? []}
        initialAutoAssignCards={settings?.auto_assign_cards ?? false}
        initialCardsResetAt={settings?.cards_reset_at ?? null}
        initialCardsPerVisitor={settings?.cards_per_visitor ?? 1}
      />
    </main>
  );
}
