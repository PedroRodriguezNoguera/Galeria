"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Spinner } from "@/components/ui/Spinner";
import type { UploadStatus } from "@/hooks/useUpload";
import { springSheet } from "@/animations/springs";

interface UploadProgressProps {
  status: UploadStatus;
  total: number;
  completed: number;
  fileProgress: number;
  onDismiss: () => void;
}

export function UploadProgress({
  status,
  total,
  completed,
  fileProgress,
  onDismiss,
}: UploadProgressProps) {
  const visible = status === "uploading";
  const overall = total > 0 ? (completed + fileProgress) / total : 0;

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={springSheet}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] left-1/2 z-50 -translate-x-1/2"
        >
          <GlassPanel strong elevation="lg" className="flex items-center gap-3 px-4 py-2.5">
            <Spinner size={18} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {total > 1 ? `Subiendo ${Math.min(completed + 1, total)} de ${total}…` : "Subiendo…"}
              </span>
              <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  className="h-full bg-foreground"
                  animate={{ width: `${Math.round(overall * 100)}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
