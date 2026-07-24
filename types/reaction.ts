import type { Tables } from "./database.types";
import type { ReactionEmoji } from "@/constants/reactions";

export type ReactionRecord = Tables<"reactions">;
export type ReactionCounts = Partial<Record<ReactionEmoji, number>>;

export interface ReactionSummaryItem {
  emoji: ReactionEmoji;
  count: number;
}

/** Resumen ligero para tarjetas/miniaturas: sólo los emojis top + el total. */
export interface ReactionSummary {
  topReactions: ReactionSummaryItem[];
  totalReactions: number;
}
