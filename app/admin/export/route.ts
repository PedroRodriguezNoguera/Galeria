import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { createClient } from "@/lib/supabase/server";
import { downloadFilenameForMedia, getPublicStorageUrl } from "@/lib/media/publicUrl";

// Nunca cachear: cada descarga debe reflejar lo que hay en ese momento.
export const dynamic = "force-dynamic";

/** Nombre de archivo seguro a partir del nombre de la carpeta. */
const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(COMBINING_DIACRITICS, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "carpeta"
  );
}

/**
 * Descarga en ZIP de lo publicado — todo, o sólo una carpeta si se pasa
 * `?albumId=`. Mismo criterio que la rejilla de moderación: excluye lo
 * asignado a una persona en /admin/people, incluye lo oculto. Va en
 * streaming de principio a fin — se pide cada archivo original a Storage y
 * se vuelca directo al ZIP, sin juntar nunca la galería entera en memoria —
 * así no importa si son unos pocos vídeos o varios GB.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return new Response("No autorizado.", { status: 401 });
  }

  const albumId = new URL(request.url).searchParams.get("albumId");

  let albumName: string | null = null;
  if (albumId) {
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .select("name")
      .eq("id", albumId)
      .maybeSingle();
    if (albumError) return new Response(albumError.message, { status: 500 });
    if (!album) return new Response("Carpeta no encontrada.", { status: 404 });
    albumName = album.name;
  }

  let query = supabase
    .from("media")
    .select("id, storage_path, created_at, sort_date")
    .eq("is_unlisted", false)
    .order("sort_date", { ascending: true });
  if (albumId) query = query.eq("album_id", albumId);

  const { data: posts, error } = await query;

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const archive = new ZipArchive({ zlib: { level: 6 } });

  // No se espera aquí: el streaming empieza en cuanto se devuelve la Response
  // de más abajo, y este bucle va alimentando el ZIP archivo a archivo según
  // van llegando.
  (async () => {
    for (const post of posts ?? []) {
      try {
        const url = getPublicStorageUrl("media-original", post.storage_path);
        const response = await fetch(url);
        if (!response.ok || !response.body) continue;

        archive.append(Readable.fromWeb(response.body as import("stream/web").ReadableStream), {
          name: downloadFilenameForMedia(post),
        });
      } catch {
        // Un archivo que falle no debe tirar abajo la exportación entera:
        // se salta y sigue con el resto.
        continue;
      }
    }
    await archive.finalize();
  })();

  const today = new Date().toISOString().slice(0, 10);
  const zipName = albumName ? `galeria-${slugify(albumName)}-${today}` : `galeria-${today}`;

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}.zip"`,
    },
  });
}
