export const MAX_VIDEO_SIZE_BYTES =
  Number(process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE_MB ?? 200) * 1024 * 1024;

export const MAX_REACTIONS_PER_HOUR = 300;
export const MAX_REACTIONS_PER_MEDIA = 2;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

// Las miniaturas se generan con canvas.toBlob("image/webp", ...): si el
// navegador no sabe codificar webp (Safari <17, algunos Android/WebView),
// el propio navegador cae automáticamente a PNG por especificación. El
// bucket de miniaturas admite ambos para no rechazar esos casos.
export const ALLOWED_THUMBNAIL_MIME_TYPES = ["image/webp", "image/png"] as const;

export const GALLERY_PAGE_SIZE = 24;
export const IMAGE_MAX_DIMENSION_PX = 2560;
export const IMAGE_COMPRESSION_MAX_MB = 4;
export const THUMBNAIL_DIMENSION_PX = 480;

// Google da 5.000 cargas dinámicas de Street View gratis al mes. Se corta
// antes de llegar ahí (margen de seguridad) para no arriesgarse a que un mes
// muy activo cruce a la parte de pago sin darnos cuenta.
export const STREET_VIEW_MONTHLY_FREE_LIMIT = 5000;
export const STREET_VIEW_MONTHLY_SAFE_LIMIT = 4500;

export const BINGO_MAX_NUMBER = 90;
