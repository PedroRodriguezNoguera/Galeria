import { notFound } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { fetchGalleryPage } from "@/lib/data/gallery";
import { fetchMediaById, fetchReactionCounts } from "@/lib/data/media";
import { fetchEventSchedule, fetchDefaultTheme } from "@/lib/data/eventSchedule";
import { getMyReactionEmojis } from "@/lib/actions/getMyReactionEmojis";
import { queryKeys } from "@/lib/queryKeys";
import { Header } from "@/components/layout/Header";
import { FooterCaption } from "@/components/layout/FooterCaption";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { StandaloneMediaViewer } from "@/components/viewer/StandaloneMediaViewer";
import { UploadFab } from "@/components/upload/UploadFab";
import { EventCalendarFab } from "@/components/schedule/EventCalendarFab";

interface MediaPageProps {
  params: Promise<{ id: string }>;
}

export default async function MediaPage({ params }: MediaPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const media = await fetchMediaById(supabase, id);
  if (!media || media.is_hidden) notFound();

  const [initialReactionCounts, initialMyReactionEmojis] = await Promise.all([
    fetchReactionCounts(supabase, id),
    getMyReactionEmojis(id),
  ]);

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
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Header />
      {/* pt: dejar sitio al header, que ahora es `fixed` y ya no ocupa espacio en el flujo. */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-28 pt-[calc(env(safe-area-inset-top)+7rem)] lg:max-w-4xl xl:max-w-5xl">
        <GalleryGrid />
      </main>
      <FooterCaption />
      <StandaloneMediaViewer
        media={media}
        initialReactionCounts={initialReactionCounts}
        initialMyReactionEmojis={initialMyReactionEmojis}
      />
      <UploadFab />
      <EventCalendarFab />
    </HydrationBoundary>
  );
}
