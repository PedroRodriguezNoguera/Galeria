import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { createClient } from "@/lib/supabase/server";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";

// Nunca cachear: cada descarga debe reflejar lo que hay en ese momento.
export const dynamic = "force-dynamic";

function extensionFromPath(path: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  return match ? match[1] : "bin";
}

/**
 * Descarga en ZIP de todo lo publicado (mismo criterio que la rejilla de
 * moderación: excluye lo asignado a una persona en /admin/people, incluye lo
 * oculto). Va en streaming de principio a fin — se pide cada archivo original
 * a Storage y se vuelca directo al ZIP, sin juntar nunca la galería entera en
 * memoria — así no importa si son unos pocos vídeos o varios GB.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return new Response("No autorizado.", { status: 401 });
  }

  const { data: posts, error } = await supabase
    .from("media")
    .select("id, storage_path, created_at, sort_date")
    .eq("is_unlisted", false)
    .order("sort_date", { ascending: true });

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

        const date = (post.sort_date ?? post.created_at).slice(0, 10);
        const extension = extensionFromPath(post.storage_path);
        archive.append(Readable.fromWeb(response.body as import("stream/web").ReadableStream), {
          name: `${date}_${post.id}.${extension}`,
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

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="galeria-${today}.zip"`,
    },
  });
}
