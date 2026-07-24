// Build "lite" de exifr, no el paquete principal ("full"): el build por
// defecto de exifr referencia `fs`/`zlib` de Node (para soportar leer
// archivos por ruta y ciertos formatos poco comunes) y Turbopack los intenta
// incluir igualmente al empaquetar para el navegador, provocando un error de
// runtime ("Couldn't load fs/zlib"). El build "lite" sólo trae JPEG/TIFF
// (de sobra para leer DateTimeOriginal de una foto de móvil) sin esas
// dependencias.
import { parse } from "exifr/dist/lite.esm.mjs";

/**
 * Lee la fecha en la que se hizo la foto (EXIF DateTimeOriginal) directamente
 * del archivo ORIGINAL, antes de comprimir — la compresión puede eliminar el
 * EXIF. Devuelve `undefined` si el archivo no trae ese dato (frecuente: fotos
 * reeditadas, capturas de pantalla, o formatos como PNG que no llevan EXIF) —
 * el servidor cae a la fecha de subida en ese caso (ver confirmUpload).
 */
export async function extractExifTakenAt(file: File): Promise<string | undefined> {
  try {
    // El atajo `parse(file, ["DateTimeOriginal"])` (pick global) revienta en el
    // build "lite" con "undefined is not iterable": su diccionario de tags no
    // registra todos los segmentos que ese filtro global recorre. Limitando el
    // pick al propio bloque exif sí funciona (comprobado con un JPEG de prueba).
    const result = await parse(file, { exif: { pick: ["DateTimeOriginal"] } });
    const takenAt = result?.DateTimeOriginal;
    if (!(takenAt instanceof Date) || Number.isNaN(takenAt.getTime())) return undefined;
    return takenAt.toISOString();
  } catch {
    return undefined;
  }
}
