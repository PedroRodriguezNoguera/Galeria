// Mismo build "lite" que extractExifTakenAt (ver ese archivo): sin fs/zlib de
// Node, que Turbopack intentaría empaquetar igual para el navegador.
import { parse } from "exifr/dist/lite.esm.mjs";

export interface ExifGps {
  latitude: number;
  longitude: number;
}

/**
 * Lee las coordenadas GPS del EXIF del archivo ORIGINAL, antes de comprimir —
 * la compresión puede eliminarlas. `{ gps: true }` hace que exifr devuelva
 * `latitude`/`longitude` ya convertidas a grados decimales (con el signo
 * correcto según N/S/E/O), no los arrays DMS crudos. Devuelve `undefined` si
 * el archivo no trae GPS (frecuente: capturas de pantalla, fotos reeditadas,
 * cámaras sin GPS, o el móvil con la ubicación desactivada) — el servidor
 * guarda `null` en ese caso (ver confirmUpload).
 */
export async function extractExifGps(file: File): Promise<ExifGps | undefined> {
  try {
    const result = await parse(file, { gps: true });
    const latitude = result?.latitude;
    const longitude = result?.longitude;
    if (typeof latitude !== "number" || typeof longitude !== "number") return undefined;
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return undefined;
    return { latitude, longitude };
  } catch (error) {
    // No debe romper la subida (el archivo simplemente se guarda sin
    // coordenadas), pero silenciarlo del todo dificulta distinguir "esta foto
    // no trae GPS" de "esto ha fallado de verdad" — se deja constancia en consola.
    console.warn("No se pudo leer el GPS del EXIF", error);
    return undefined;
  }
}
