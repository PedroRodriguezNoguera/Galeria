import { createAdminClient } from "@/lib/supabase/admin";
import { PlanningScreen } from "@/components/admin/PlanningScreen";
import type { EventTheme } from "@/constants/eventThemes";

export default async function AdminPlanningPage() {
  const supabase = createAdminClient();

  const [{ data: events, error: eventsError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase
        .from("event_schedule")
        .select("*")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase.from("header_settings").select("default_theme").eq("id", true).maybeSingle(),
    ]);

  if (eventsError) throw eventsError;
  if (settingsError) throw settingsError;

  return (
    <PlanningScreen
      events={events ?? []}
      defaultTheme={(settings?.default_theme as EventTheme) ?? "toro"}
    />
  );
}
