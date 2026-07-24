import type { Tables } from "./database.types";
import type { ReactionSummary } from "./reaction";

export type MediaRecord = Tables<"media">;
export type MediaType = "image" | "video";

export interface MediaWithReactions extends MediaRecord, ReactionSummary {}

export function isMediaType(value: string): value is MediaType {
  return value === "image" || value === "video";
}
