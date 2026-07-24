import esCompact from "emojibase-data/es/compact.json";
import enCompact from "emojibase-data/en/compact.json";

interface CompactEmoji {
  hexcode: string;
  label: string;
  order?: number;
  group?: number;
  tags?: string[];
  unicode: string;
  emoticon?: string;
}

export interface EmojiEntry {
  emoji: string;
  label: string;
  /** Español (nombre + tags) + inglés (nombre + tags), en minúsculas y sin duplicados. */
  keywords: string[];
  order: number;
}

const enByHexcode = new Map((enCompact as CompactEmoji[]).map((entry) => [entry.hexcode, entry]));

function buildEntry(esEmoji: CompactEmoji): EmojiEntry {
  const en = enByHexcode.get(esEmoji.hexcode);

  const rawKeywords = [esEmoji.label, ...(esEmoji.tags ?? []), en?.label, ...(en?.tags ?? [])].filter(
    (value): value is string => Boolean(value),
  );

  return {
    emoji: esEmoji.unicode,
    label: esEmoji.label,
    keywords: Array.from(new Set(rawKeywords.map((keyword) => keyword.toLowerCase()))),
    order: esEmoji.order ?? Number.MAX_SAFE_INTEGER,
  };
}

export const ALL_EMOJIS: EmojiEntry[] = (esCompact as CompactEmoji[])
  // Descarta indicadores regionales sueltos (sin "order"): no son reacciones con sentido por sí solos.
  .filter((entry) => entry.order !== undefined)
  .map(buildEntry)
  .sort((a, b) => a.order - b.order);

const ALL_EMOJI_SET = new Set(ALL_EMOJIS.map((entry) => entry.emoji));

export function isKnownEmoji(value: string): boolean {
  return ALL_EMOJI_SET.has(value);
}

export function searchEmojis(query: string): EmojiEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return ALL_EMOJIS;

  return ALL_EMOJIS.filter((entry) => entry.keywords.some((keyword) => keyword.includes(trimmed)));
}
