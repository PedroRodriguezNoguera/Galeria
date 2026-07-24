"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "./GlassPanel";
import { springSheet } from "@/animations/springs";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const dotColor: Record<ToastVariant, string> = {
  default: "bg-foreground-muted",
  success: "bg-emerald-500",
  error: "bg-red-500",
};

export function Toast({ title, description, variant = "default" }: ToastItem) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={springSheet}
    >
      <GlassPanel
        strong
        elevation="lg"
        className="flex min-w-[260px] max-w-sm items-start gap-3 px-4 py-3"
      >
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotColor[variant])} />
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-medium leading-tight">{title}</p>
          {description ? (
            <p className="text-sm leading-snug text-foreground-muted">{description}</p>
          ) : null}
        </div>
      </GlassPanel>
    </motion.div>
  );
}
