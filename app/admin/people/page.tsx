import { createAdminClient } from "@/lib/supabase/admin";
import { PeopleScreen } from "@/components/admin/PeopleScreen";

export default async function AdminPeoplePage() {
  const supabase = createAdminClient();

  const { data: people, error } = await supabase
    .from("people")
    .select(
      "device_id, name, assigned_media_id, first_seen_at, media:assigned_media_id(id, thumbnail_path, media_type)",
    )
    .order("first_seen_at", { ascending: false });

  if (error) throw error;

  return <PeopleScreen people={people ?? []} />;
}
