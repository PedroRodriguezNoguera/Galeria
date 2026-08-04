"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reserva atómicamente una carga de Street View ANTES de tocar la API de
 * Google (ver StreetViewOverlay: se llama antes de importLibrary/getPanorama,
 * nunca después) — si devuelve false, el overlay ni siquiera intenta cargar
 * Maps JS. La atomicidad y el límite real (4.500, bajo las 5.000 gratis/mes
 * de Google) viven en la propia función de Postgres
 * (try_reserve_street_view_load), no aquí: así ninguna carrera entre
 * peticiones simultáneas puede colar más reservas de las debidas. No
 * requiere sesión de admin: cualquier visitante puede abrir Street View, así
 * que cualquiera debe poder reservar su carga.
 */
export async function reserveStreetViewLoad(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("try_reserve_street_view_load");
  if (error) throw error;
  return data ?? false;
}
