import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_ID_COOKIE } from "@/lib/security/deviceId";
import { createAdminClient } from "@/lib/supabase/admin";

const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 años

/**
 * Refresca el token de sesión de Supabase en cada request, protege
 * /admin/dashboard, y asigna la cookie HttpOnly device_id (identidad anónima
 * server-side para reacciones) la primera vez que falta.
 * Usa getClaims() (verifica el JWT localmente contra las claves publicadas del
 * proyecto), nunca getSession() en servidor: getSession() no revalida el token
 * contra el servidor de Auth.
 */
export async function updateSession(request: NextRequest) {
  const hasDeviceId = request.cookies.has(DEVICE_ID_COOKIE);
  const deviceId = hasDeviceId
    ? request.cookies.get(DEVICE_ID_COOKIE)!.value
    : crypto.randomUUID();

  if (!hasDeviceId) {
    request.cookies.set(DEVICE_ID_COOKIE, deviceId);
  }

  function withDeviceIdCookie(res: NextResponse) {
    if (!hasDeviceId) {
      res.cookies.set(DEVICE_ID_COOKIE, deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: DEVICE_ID_MAX_AGE,
        path: "/",
      });
    }
    return res;
  }

  let response = withDeviceIdCookie(NextResponse.next({ request }));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = withDeviceIdCookie(NextResponse.next({ request }));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  // Cubre /admin/dashboard, /admin/people y cualquier pantalla admin futura:
  // sólo /admin/login queda fuera de la protección.
  if (pathname.startsWith("/admin/") && pathname !== "/admin/login" && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return withDeviceIdCookie(NextResponse.redirect(loginUrl));
  }

  if (pathname === "/admin/login" && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin/dashboard";
    return withDeviceIdCookie(NextResponse.redirect(dashboardUrl));
  }

  if (pathname === "/") {
    const redirect = await resolveAssignedRedirect(request, deviceId, hasDeviceId);
    if (redirect) return withDeviceIdCookie(redirect);
  }

  return response;
}

/**
 * Registro silencioso de "personas" por device_id y, si un admin ya le asignó
 * una publicación a este dispositivo desde /admin/people, la redirección a
 * ella en vez de a la galería normal. Nunca debe romper la navegación: si
 * falla (o el runtime no admite el cliente admin), simplemente no redirige.
 */
async function resolveAssignedRedirect(
  request: NextRequest,
  deviceId: string,
  hasDeviceId: boolean,
) {
  try {
    const admin = createAdminClient();

    if (!hasDeviceId) {
      // Primera visita de este dispositivo: no puede tener asignación todavía,
      // sólo lo damos de alta para que aparezca en /admin/people.
      await admin.from("people").insert({ device_id: deviceId });
      return null;
    }

    const { data: person } = await admin
      .from("people")
      .select("assigned_media_id")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (!person) {
      // Cookie de antes de que existiera esta tabla: se da de alta ahora
      // mismo para que aparezca en /admin/people a partir de esta visita.
      await admin.from("people").insert({ device_id: deviceId });
      return null;
    }

    if (!person.assigned_media_id) return null;

    const target = request.nextUrl.clone();
    target.pathname = `/media/${person.assigned_media_id}`;
    return NextResponse.redirect(target);
  } catch {
    return null;
  }
}
