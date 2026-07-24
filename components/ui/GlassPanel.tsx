"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type GlassPanelElevation = "sm" | "md" | "lg";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  elevation?: GlassPanelElevation;
  /** Cristal más opaco: usar sobre imágenes/vídeo para mantener legibilidad. */
  strong?: boolean;
}

const elevationClass: Record<GlassPanelElevation, string> = {
  sm: "shadow-glass-sm",
  md: "shadow-glass-md",
  lg: "shadow-glass-lg",
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, elevation = "md", strong = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-glass-lg border backdrop-blur-xl backdrop-saturate-150",
          strong ? "bg-glass-strong" : "bg-glass",
          "border-glass-border",
          elevationClass[elevation],
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
GlassPanel.displayName = "GlassPanel";
