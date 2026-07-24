import type { ReactionEmoji } from "@/constants/reactions";
import type { ReactionCounts, ReactionSummary } from "@/types/reaction";

const TOP_REACTIONS_LIMIT = 3;

/** Misma regla que `get_reaction_counts_bulk` en el servidor: top 3 + total. */
export function summarizeReactionCounts(counts: ReactionCounts): ReactionSummary {
  const sorted = (Object.entries(counts) as [ReactionEmoji, number][])
    .filter(([, count]) => (count ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);

  return {
    topReactions: sorted.slice(0, TOP_REACTIONS_LIMIT).map(([emoji, count]) => ({ emoji, count })),
    totalReactions: sorted.reduce((sum, [, count]) => sum + count, 0),
  };
}
