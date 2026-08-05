import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchMediaById } from "@/lib/data/media";
import { InterceptedMediaModal } from "@/components/viewer/InterceptedMediaModal";

export default async function InterceptedMediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ album?: string }>;
}) {
  const { id } = await params;
  const { album } = await searchParams;
  const supabase = await createClient();

  // Sólo lo imprescindible para poder abrir el visor (y comprobar que no está
  // oculta): las reacciones NO se esperan aquí — igual que ya pasa al deslizar
  // a la siguiente foto (ver MediaViewer/ReactionBar), useReactions las pide
  // por su cuenta en cuanto monta. Esperarlas antes de abrir sólo añadía una
  // segunda ida y vuelta de red al tiempo hasta que se ve el visor.
  const media = await fetchMediaById(supabase, id);
  if (!media || media.is_hidden) notFound();

  return <InterceptedMediaModal media={media} albumId={album} />;
}
