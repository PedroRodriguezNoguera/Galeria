"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchMapEnabled } from "@/lib/data/featureSettings";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Se prefetchea en cada página que pueda abrir el visor (galería y /media/[id],
 * ver queryClient.prefetchQuery ahí) para que esté ya en caché al hidratar —
 * MediaViewer sólo lo lee, nunca dispara la primera petición.
 */
export function useMapEnabled() {
  const { data } = useQuery({
    queryKey: queryKeys.mapEnabled(),
    queryFn: () => fetchMapEnabled(createClient()),
  });
  return data ?? false;
}
