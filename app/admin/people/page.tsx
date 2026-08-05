import { createAdminClient } from "@/lib/supabase/admin";
import { PeopleScreen } from "@/components/admin/PeopleScreen";

const RECENT_PEOPLE_LIMIT = 50;
const PEOPLE_SELECT =
  "device_id, name, assigned_media_id, first_seen_at, media:assigned_media_id(id, thumbnail_path, media_type)";

export default async function AdminPeoplePage() {
  const supabase = createAdminClient();

  // Sin límite crecería para siempre (una fila por dispositivo que entra
  // alguna vez, aunque no se le ponga nombre): se muestran las últimas 50
  // entradas, más TODAS las que ya tienen nombre puesto — a esas no se les
  // ha subido nada al azar, alguien las ha personalizado a propósito, así
  // que no deben desaparecer de la lista por antiguas que sean.
  const [{ data: recent, error: recentError }, { data: named, error: namedError }] = await Promise.all([
    supabase
      .from("people")
      .select(PEOPLE_SELECT)
      .order("first_seen_at", { ascending: false })
      .limit(RECENT_PEOPLE_LIMIT),
    supabase.from("people").select(PEOPLE_SELECT).not("name", "is", null),
  ]);

  if (recentError) throw recentError;
  if (namedError) throw namedError;

  const byDeviceId = new Map((recent ?? []).map((person) => [person.device_id, person]));
  for (const person of named ?? []) {
    byDeviceId.set(person.device_id, person);
  }
  const people = Array.from(byDeviceId.values()).sort(
    (a, b) => new Date(b.first_seen_at).getTime() - new Date(a.first_seen_at).getTime(),
  );

  return <PeopleScreen people={people} />;
}
