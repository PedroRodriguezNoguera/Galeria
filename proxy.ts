import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export default function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Corre en (casi) todas las rutas: la cookie device_id la necesita cualquier
  // página que pueda mostrar el visor con reacciones, no sólo /admin.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest).*)"],
};
