import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { fetchGalleryPage } from "@/lib/data/gallery";
import { fetchEventSchedule, fetchDefaultTheme } from "@/lib/data/eventSchedule";
import { fetchDestacadosEnabled, fetchMapEnabled } from "@/lib/data/featureSettings";
import { fetchFeaturedMedia } from "@/lib/data/featured";
import { fetchStreetViewLoadCount } from "@/lib/data/streetViewUsage";
import { fetchBingoSettings } from "@/lib/data/bingoSettings";
import { fetchAlbums } from "@/lib/data/albums";
import { queryKeys } from "@/lib/queryKeys";
import { FooterCaption } from "@/components/layout/FooterCaption";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { AlbumsSection } from "@/components/gallery/AlbumsSection";
import { FeaturedCarousel } from "@/components/gallery/FeaturedCarousel";
import { UploadFab } from "@/components/upload/UploadFab";
import { EventCalendarFab } from "@/components/schedule/EventCalendarFab";
import { EventCountdownNotice } from "@/components/schedule/EventCountdownNotice";
import { BingoGate } from "@/components/bingo/BingoGate";

export default async function GalleryPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // En paralelo: la galería, las 2 que deciden qué tema mostrar la cabecera
  // (event_schedule + header_settings) — antes estas dos sólo se pedían en el
  // cliente, tras la hidratación (useActiveEventTheme), añadiendo una ida y
  // vuelta de red que no hacía falta — y map_enabled (ver useMapEnabled,
  // MediaViewer). destacadosEnabled y bingoSettings se deciden aquí mismo (no
  // por React Query) porque condicionan qué se renderiza en el propio
  // servidor: si no, habría un parpadeo al hidratar.
  const [, , , , , destacadosEnabled, bingoSettings, albums] = await Promise.all([
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
    fetchDestacadosEnabled(supabase),
    fetchBingoSettings(supabase),
    fetchAlbums(supabase),
  ]);

  // Sólo se piden las fotos destacadas si de verdad se van a mostrar.
  const featuredItems = destacadosEnabled ? await fetchFeaturedMedia(supabase) : [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BingoGate initial={bingoSettings}>
        {/* pt: dejar sitio al header, que ahora es `fixed` y ya no ocupa espacio en el flujo. */}
        <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-28 pt-[calc(env(safe-area-inset-top)+7rem)] lg:max-w-4xl xl:max-w-5xl">
          <GalleryGrid />
          {albums.length > 0 ? <AlbumsSection albums={albums} /> : null}
        </main>
        <FooterCaption />
        <UploadFab />
        <EventCalendarFab />
        <EventCountdownNotice hasFeaturedCarousel={featuredItems.length > 0} />
        {/* Pantalla superpuesta (fixed, por encima de todo), no parte de la lista:
            ver FeaturedCarousel. */}
        {featuredItems.length > 0 ? <FeaturedCarousel items={featuredItems} /> : null}
      </BingoGate>
    </HydrationBoundary>
  );
}
