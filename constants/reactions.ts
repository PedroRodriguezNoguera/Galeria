import { isKnownEmoji } from "@/lib/emoji/emojiData";

/**
 * Cualquier emoji Unicode válido es una reacción permitida (ver lib/emoji/emojiData).
 * Antes era una lista fija de 12; ahora se valida contra el dataset completo,
 * tanto aquí (cliente) como en el Server Action (nunca confiar sólo en el cliente).
 */
export type ReactionEmoji = string;

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return isKnownEmoji(value);
}
