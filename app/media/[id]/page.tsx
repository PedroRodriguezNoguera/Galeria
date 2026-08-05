import { notFound } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { fetchGalleryPage } from "@/lib/data/gallery";
import { fetchMediaById } from "@/lib/data/media";
import { fetchEventSchedule, fetchDefaultTheme } from "@/lib/data/eventSchedule";
import { fetchMapEnabled } from "@/lib/data/featureSettings";
import { fetchStreetViewLoadCount } from "@/lib/data/streetViewUsage";
import { queryKeys } from "@/lib/queryKeys";
import { Header } from "@/components/layout/Header";
import { FooterCaption } from "@/components/layout/FooterCaption";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { StandaloneMediaViewer } from "@/components/viewer/StandaloneMediaViewer";
import { UploadFab } from "@/components/upload/UploadFab";
import { EventCalendarFab } from "@/components/schedule/EventCalendarFab";

interface MediaPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ album?: string }>;
}

export default async function MediaPage({ params, searchParams }: MediaPageProps) {
  const { id } = await params;
  const { album } = await searchParams;
  const supabase = await createClient();

  // Las reacciones no se esperan aquí: useReactions las pide por su cuenta en
  // cuanto el visor monta (ver InterceptedMediaModal para el motivo completo).
  const media = await fetchMediaById(supabase, id);
  if (!media || media.is_hidden) notFound();

  const queryClient = new QueryClient();
  // Las 3 consultas en paralelo: la galería, y las 2 que decide qué tema
  // mostrar la cabecera (event_schedule + header_settings) — antes estas
  // dos sólo se pedían en el cliente, tras la hidratación (useActiveEventTheme),
  // añadiendo una ida y vuelta de red que no hacía falta.
  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.gallery(),
      queryFn: () => fetchGalleryPage(supabase, null),
      initialPageParam: null,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.eventSchedule(),
      queryFn: () => fetchEventSchedule(supabase),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.headerSettings(),
      queryFn: () => fetchDefaultTheme(supabase),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.mapEnabled(),
      queryFn: () => fetchMapEnabled(supabase),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.streetViewUsage(),
      queryFn: () => fetchStreetViewLoadCount(supabase),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Header />
      {/* pt: dejar sitio al header, que ahora es `fixed` y ya no ocupa espacio en el flujo. */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-28 pt-[calc(env(safe-area-inset-top)+7rem)] lg:max-w-4xl xl:max-w-5xl">
        <GalleryGrid />
      </main>
      <FooterCaption />
      <StandaloneMediaViewer media={media} albumId={album} />
      <UploadFab />
      <EventCalendarFab />
    </HydrationBoundary>
  );
}
