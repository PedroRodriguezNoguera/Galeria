import "server-only";
import { cookies } from "next/headers";

export const DEVICE_ID_COOKIE = "device_id";

/**
 * Identidad anónima del visitante, gestionada enteramente por el servidor vía
 * cookie HttpOnly (asignada en proxy.ts). A diferencia de un valor que mande
 * el cliente en cada petición, JavaScript no puede leerla ni falsificarla, así
 * que nadie puede hacerse pasar por otro dispositivo para borrar sus reacciones.
 */
export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_ID_COOKIE)?.value ?? null;
}
