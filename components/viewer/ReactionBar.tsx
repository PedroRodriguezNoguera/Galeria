"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useReactions } from "@/hooks/useReactions";
import { springPop } from "@/animations/springs";
import { iconPop } from "@/animations/variants";
import { cn } from "@/lib/utils/cn";
import type { ReactionEmoji } from "@/constants/reactions";
import type { ReactionCounts } from "@/types/reaction";

// El dataset completo de emojis pesa lo suyo: se difiere hasta que el usuario
// toca "+" por primera vez, no viaja en el bundle inicial del visor.
const ReactionPicker = dynamic(() => import("./ReactionPicker"), { ssr: false });

interface ReactionBarProps {
  mediaId: string;
  initialCounts?: ReactionCounts;
  initialMine?: string[];
}

export function ReactionBar({ mediaId, initialCounts, initialMine }: ReactionBarProps) {
  const { counts, mine, react, maxReached } = useReactions(mediaId, initialCounts, initialMine);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hasOpenedPicker, setHasOpenedPicker] = useState(false);

  const entries = (Object.entries(counts) as [ReactionEmoji, number][])
    .filter(([, count]) => (count ?? 0) > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence initial={false}>
        {entries.map(([emoji, count]) => (
          <motion.button
            key={emoji}
            layout
            variants={iconPop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={springPop}
            whileTap={{ scale: 0.88 }}
            onClick={() => react(emoji)}
            className={cn(
              "flex items-center gap-1 rounded-glass-pill border px-2.5 py-1 text-sm backdrop-blur-md backdrop-saturate-150",
              mine.has(emoji)
                ? "border-foreground/25 bg-glass-strong text-foreground"
                : "border-glass-border bg-glass text-foreground",
            )}
          >
            <span>{emoji}</span>
            <span className="text-xs font-medium tabular-nums">{count}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => {
          setHasOpenedPicker(true);
          setPickerOpen(true);
        }}
        aria-label="Añadir reacción"
        whileTap={{ scale: 0.88 }}
        transition={springPop}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-glass text-lg text-foreground-muted backdrop-blur-md backdrop-saturate-150"
      >
        +
      </motion.button>

      {hasOpenedPicker ? (
        <ReactionPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(emoji) => {
            react(emoji);
            setPickerOpen(false);
          }}
          mine={mine}
          maxReached={maxReached}
        />
      ) : null}
    </div>
  );
}
