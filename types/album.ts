import type { Tables } from "./database.types";
import type { MediaRecord } from "./media";

export type AlbumRecord = Tables<"albums">;

export interface AlbumWithStats extends AlbumRecord {
  memberCount: number;
  /** Hasta 3 portadas (las más recientes primero), calculadas al leer, no un campo propio: ver lib/data/albums.ts. */
  covers: Pick<MediaRecord, "thumbnail_path" | "media_type">[];
}
