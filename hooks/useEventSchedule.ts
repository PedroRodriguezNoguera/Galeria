"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchEventSchedule } from "@/lib/data/eventSchedule";
import { queryKeys } from "@/lib/queryKeys";

/** `enabled` para no disparar la consulta hasta que se abra la hoja del calendario. */
export function useEventSchedule(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.eventSchedule(),
    queryFn: () => fetchEventSchedule(createClient()),
    enabled,
  });
}
