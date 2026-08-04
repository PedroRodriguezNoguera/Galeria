"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchStreetViewLoadCount } from "@/lib/data/streetViewUsage";
import { queryKeys } from "@/lib/queryKeys";
import { STREET_VIEW_MONTHLY_SAFE_LIMIT } from "@/constants/limits";

/**
 * Se prefetchea en las mismas páginas que map_enabled (ver app/page.tsx y
 * app/media/[id]/page.tsx) para que esté ya en caché al hidratar. Devuelve
 * directamente si ya se ha llegado al margen de seguridad, no el conteo en
 * sí — MediaViewer sólo necesita saber si debe ocultar el icono.
 */
export function useStreetViewBlockedByUsage(): boolean {
  const { data } = useQuery({
    queryKey: queryKeys.streetViewUsage(),
    queryFn: () => fetchStreetViewLoadCount(createClient()),
  });
  return (data ?? 0) >= STREET_VIEW_MONTHLY_SAFE_LIMIT;
}
