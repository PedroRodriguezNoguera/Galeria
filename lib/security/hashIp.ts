import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** IP hasheada con un pepper de servidor; la IP en claro nunca llega a la base de datos. */
export async function hashIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";

  const salt = process.env.RATE_LIMIT_IP_SALT;
  if (!salt) {
    throw new Error("Falta RATE_LIMIT_IP_SALT en el entorno del servidor.");
  }

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
