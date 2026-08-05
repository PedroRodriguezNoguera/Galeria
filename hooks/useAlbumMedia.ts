"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAlbumMedia } from "@/lib/data/albums";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Contenido de una carpeta, pedido sólo al expandirla; se queda en caché para
 * no repetir la petición al recogerla y volver a abrirla. `albumId` puede
 * faltar (p.ej. useAdjacentMedia fuera de una carpeta): `enabled` evita pedir
 * nada en ese caso, en vez de tener que condicionar la llamada al hook.
 */
export function useAlbumMedia(albumId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.albumMedia(albumId ?? ""),
    queryFn: () => fetchAlbumMedia(createClient(), albumId as string),
    enabled: Boolean(albumId),
  });
}
