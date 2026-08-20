import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  // Permite probar el servidor de desarrollo (HMR incluido) desde el móvil
  // en la misma red local, no sólo desde localhost. Este equipo alterna
  // entre Ethernet (.156) y Wi-Fi (.152) según el momento, así que se
  // incluyen ambas IPs para no tener que tocar esto cada vez que cambie.
  // El comodín de trycloudflare.com cubre el túnel público (la URL cambia
  // cada vez que se relanza, así que no vale fijar un subdominio concreto).
  allowedDevOrigins: ["192.168.0.156", "192.168.0.152", "*.trycloudflare.com"],
  experimental: {
    // La galería (`/`) es dinámica (usa cookies() vía Supabase server client),
    // así que por defecto el Router Cache del cliente no la guarda nada
    // (staleTime 0): cada vez que se cierra el visor con router.back(), Next
    // la vuelve a pedir y remonta GalleryGrid entero (virtualizador y scroll
    // incluidos), y se ve como si la lista "se reconstruyera". Con esto se
    // reutiliza la página ya renderizada durante 30s al volver atrás, en vez
    // de remontarla — las actualizaciones en tiempo real (nuevas fotos,
    // reacciones) siguen llegando igual, porque van directas a la caché de
    // React Query (ver useRealtimeMedia/useRealtimeReactions), no dependen
    // de este recache.
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Las fotos ya se comprimen/redimensionan en el navegador antes de
    // subirse y hay un bucket de miniaturas dedicado (ver useUpload.ts /
    // compressImage.ts), así que no hace falta que Vercel las vuelva a
    // optimizar al servirlas — y ese paso extra tiene una cuota mensual
    // limitada en el plan actual que se agotó y tumbó TODAS las miniaturas
    // (error 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED en /_next/image).
    // Sirviendo las URLs de Supabase directas se evita depender de esa cuota.
    unoptimized: true,
  },
};

export default nextConfig;
