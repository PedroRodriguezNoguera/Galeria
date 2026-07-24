/**
 * `exifr` sólo publica tipos para su build "full" (import bare `"exifr"`);
 * usamos el build "lite" vía una ruta de subpath (ver
 * lib/media/extractExifTakenAt.ts, evita que Turbopack intente empaquetar
 * las dependencias de Node del build completo) que no trae declaración
 * propia. Misma forma que el `parse` real, reducida a lo que se usa aquí.
 */
declare module "exifr/dist/lite.esm.mjs" {
  export function parse(
    data: ArrayBuffer | Blob | File | Uint8Array | string,
    options?: (string | number)[] | Record<string, unknown> | boolean,
  ): Promise<Record<string, unknown> | undefined>;
}
