# Galería

Galería de fotos y vídeo compartida en tiempo real para eventos en directo: cualquier asistente sube contenido desde el móvil sin registrarse y lo ve aparecer al instante en un muro colectivo, mientras un panel de administración permite moderar, organizar y exportar todo lo subido.

**Proyecto completo y funcional, no una maqueta.** Ya ha tenido uso real y público: estuvo en producción durante un evento en directo con asistentes reales subiendo fotos y vídeos, no solo probado en local.

🔗 **Demo en vivo:** [comisiongea.com](https://comisiongea.com)

## Qué resuelve

En cualquier evento con mucha gente (una fiesta, una boda, un concierto, una jornada de empresa...), las fotos y vídeos de los asistentes quedan repartidos entre cientos de móviles y grupos de chat distintos, y buena parte se pierde o nunca se comparte. Esta app centraliza todo eso en un único muro en tiempo real, accesible desde el móvil de cualquiera sin necesidad de cuenta ni instalar nada, y da a los organizadores una forma de moderar lo que se publica.

## Funcionalidades

**Galería en vivo**
- Subida de fotos y vídeos sin registro, con compresión y generación de miniatura en el propio navegador antes de subir (para no saturar la subida ni el almacenamiento).
- Extracción automática de metadatos EXIF: fecha real de captura y ubicación GPS de la foto, cuando el archivo los trae.
- Feed con scroll infinito y actualización en tiempo real (Supabase Realtime): lo que sube alguien aparece al momento para el resto, sin recargar.
- Organización en álbumes/carpetas, además del muro principal.
- Reacciones tipo emoji en cada publicación, también en tiempo real.
- Visor a pantalla completa con gestos (zoom, pan, deslizar entre fotos), precarga de las fotos vecinas y overlay de Google Street View para ubicar dónde se tomó una foto.
- Carrusel de fotos destacadas y avisos de cuenta atrás para el próximo evento programado.

**Panel de administración**
- Login propio para organizadores, separado del resto de la app.
- Moderación: ocultar, volver a mostrar o borrar definitivamente publicaciones (una a una o en bloque), con limpieza del archivo original y su miniatura en el storage al borrar.
- Exportación y descarga en bloque por carpetas, o de un archivo individual.
- Etiquetado de personas en las fotos.
- Planificador de eventos: define el calendario de actividades del evento y la cabecera de la app cambia de tema y animación automáticamente según cuál esté en curso (configurado en la versión ya usada en producción con actividades propias de una fiesta popular, pero el sistema de temas es genérico y reutilizable para cualquier tipo de evento).
- Ajustes generales: activar/desactivar el mapa, los destacados, límites de subida, etc.

**Extras**
- Bingo interactivo integrado, con cartones generados por usuario y activable/desactivable desde el admin.
- Instalable como PWA (icono en el escritorio del móvil, service worker), pensada para usarse como una app nativa durante todo el evento.
- Protección anti-abuso: límite de peticiones por IP (con hash + salt antes de guardarla, nunca en claro) en acciones sensibles como las reacciones.

## Cómo funciona por dentro

- **Frontend/backend unificado** con el App Router de Next.js: las páginas se renderizan en el servidor con los datos precargados (galería, álbumes, tema del evento activo...) e hidratan un cliente con TanStack Query, que a partir de ahí se encarga de la paginación, el caché y las actualizaciones en tiempo real.
- **Subida de archivos en dos fases**: el servidor valida tipo y tamaño y emite una URL firmada de Supabase Storage; el navegador sube el archivo directamente a esa URL. Ningún bucket admite escritura pública, así que sin pasar por esa validación no hay forma de escribir en el storage.
- **Supabase** como backend: Postgres para los datos (medios, reacciones, álbumes, calendario de eventos, cartones de bingo...), Realtime para la sincronización en vivo del feed y las reacciones, y Storage para los archivos originales y sus miniaturas.
- **Server Actions** de Next.js para todas las mutaciones (subir, reaccionar, moderar, planificar eventos...), con un cliente `service_role` separado del cliente público y comprobación de sesión de administrador en cada acción sensible.
- **Rate limiting** con ventana deslizante de 1 hora sobre una tabla sólo legible por `service_role`, para evitar spam de reacciones sin necesidad de login.

## Stack técnico

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Supabase**: Postgres, Realtime, Storage y Auth (sesión de admin)
- **TanStack Query** (caché, paginación infinita, hidratación servidor→cliente) + **TanStack Virtual**
- **Tailwind CSS v4**
- **Framer Motion** para animaciones e interacciones del visor
- **Matter.js** para las animaciones físicas decorativas de la cabecera (según el evento activo)
- **Sharp** y **exifr** para procesado de imagen y lectura de metadatos EXIF en servidor
- **Google Maps / Street View API** para el overlay de ubicación en el visor
- PWA con service worker propio

## Puesta en marcha

Requiere un proyecto de [Supabase](https://supabase.com) propio (Postgres + Storage + Realtime) y, opcionalmente, una clave de Google Maps Platform para el overlay de Street View.

```bash
pnpm install
cp .env.example .env.local   # y rellena tus propias credenciales
pnpm dev
```

Variables de entorno necesarias (ver `.env.example`):

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública de cliente (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada, solo servidor — nunca exponer al cliente |
| `RATE_LIMIT_IP_SALT` | Sal para hashear IPs antes de guardarlas (rate limiting) |
| `NEXT_PUBLIC_MAX_VIDEO_SIZE_MB` | Límite de tamaño de vídeo permitido |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Clave de Google Maps para el overlay de Street View |

El esquema de base de datos (tablas, políticas RLS y funciones) vive en Supabase y no está incluido en este repositorio.

## Proyecto personal

Diseñado, desarrollado y desplegado en solitario de principio a fin: desde el modelo de datos y las políticas de seguridad hasta la interfaz y el despliegue en producción (Vercel).
