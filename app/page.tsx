import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/server";
import { fetchGalleryPage } from "@/lib/data/gallery";
import { fetchEventSchedule, fetchDefaultTheme } from "@/lib/data/eventSchedule";
import { fetchDestacadosEnabled } from "@/lib/data/featureSettings";
import { fetchFeaturedMedia } from "@/lib/data/featured";
import { queryKeys } from "@/lib/queryKeys";
import { Header } from "@/components/layout/Header";
import { FooterCaption } from "@/components/layout/FooterCaption";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { FeaturedCarousel } from "@/components/gallery/FeaturedCarousel";
import { UploadFab } from "@/components/upload/UploadFab";
import { EventCalendarFab } from "@/components/schedule/EventCalendarFab";

export default async function GalleryPage() {
  const supabase = await createClient();
  const queryClient = new QueryClient();

  // Las 3 consultas en paralelo: la galería, y las 2 que decide qué tema
  // mostrar la cabecera (event_schedule + header_settings) — antes estas
  // dos sólo se pedían en el cliente, tras la hidratación (useActiveEventTheme),
  // añadiendo una ida y vuelta de red que no hacía falta. destacadosEnabled se
  // decide aquí mismo (no por React Query) porque condiciona qué se renderiza
  // en el propio servidor: si no, habría un parpadeo al hidratar.
  const [, , , destacadosEnabled] = await Promise.all([
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
    fetchDestacadosEnabled(supabase),
  ]);

  // Sólo se piden las fotos destacadas si de verdad se van a mostrar.
  const featuredItems = destacadosEnabled ? await fetchFeaturedMedia(supabase) : [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Header />
      {/* pt: dejar sitio al header, que ahora es `fixed` y ya no ocupa espacio en el flujo. */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-28 pt-[calc(env(safe-area-inset-top)+7rem)]">
        <GalleryGrid />
      </main>
      <FooterCaption />
      <UploadFab />
      <EventCalendarFab />
      {/* Pantalla superpuesta (fixed, por encima de todo), no parte de la lista:
          ver FeaturedCarousel. */}
      {featuredItems.length > 0 ? <FeaturedCarousel items={featuredItems} /> : null}
    </HydrationBoundary>
  );
}
