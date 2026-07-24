"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchGalleryPage, type GalleryCursor } from "@/lib/data/gallery";
import { queryKeys } from "@/lib/queryKeys";

export function useGalleryFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.gallery(),
    queryFn: ({ pageParam }) => fetchGalleryPage(createClient(), pageParam),
    initialPageParam: null as GalleryCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
