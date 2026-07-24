"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GlassPanel } from "./GlassPanel";
import { springSheet, fadeTransition } from "@/animations/springs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const DISMISS_DRAG_THRESHOLD = 120;
const DISMISS_VELOCITY_THRESHOLD = 500;

export function BottomSheet({ open, onClose, children, className }: BottomSheetProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (typeof document === "undefined") return null;

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.y > DISMISS_DRAG_THRESHOLD || info.velocity.y > DISMISS_VELOCITY_THRESHOLD) {
      onClose();
    }
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-lg backdrop-saturate-150"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            drag={prefersReducedMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={prefersReducedMotion ? fadeTransition : springSheet}
            className="relative w-full max-w-lg lg:max-w-xl"
            role="dialog"
            aria-modal="true"
          >
            <GlassPanel
              strong
              elevation="lg"
              className={cn(
                "mx-3 mb-3 rounded-glass-xl px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-3",
                className,
              )}
            >
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-foreground-muted/30" />
              {children}
            </GlassPanel>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
