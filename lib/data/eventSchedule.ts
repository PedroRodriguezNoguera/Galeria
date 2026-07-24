import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Tables } from "@/types/database.types";
import type { EventTheme } from "@/constants/eventThemes";

export type EventScheduleRow = Tables<"event_schedule">;

export async function fetchEventSchedule(
  supabase: SupabaseClient<Database>,
): Promise<EventScheduleRow[]> {
  const { data, error } = await supabase
    .from("event_schedule")
    .select("*")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDefaultTheme(supabase: SupabaseClient<Database>): Promise<EventTheme> {
  const { data, error } = await supabase
    .from("header_settings")
    .select("default_theme")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return (data?.default_theme as EventTheme | undefined) ?? "toro";
}

/**
 * Compara fecha/hora locales de `now` contra `event_date` + `start_time`/`end_time`
 * del evento. Todo el horario se planifica en la zona horaria de la fiesta (un único
 * lugar físico), así que se compara tal cual contra el reloj local del navegador,
 * sin conversión de zona horaria.
 */
export function isEventActiveNow(event: EventScheduleRow, now: Date): boolean {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;
  if (event.event_date !== today) return false;

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= event.start_time.slice(0, 5) && currentTime <= event.end_time.slice(0, 5);
}
