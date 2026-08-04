"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadSheet } from "./UploadSheet";
import { UploadProgress } from "./UploadProgress";
import { useUpload } from "@/hooks/useUpload";
import { springSnappy } from "@/animations/springs";

export function UploadFab() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { upload, status, total, completed, fileProgress, reset } = useUpload();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setSheetOpen(true)}
        whileTap={{ scale: 0.92 }}
        transition={springSnappy}
        aria-label="Subir fotos o vídeos"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-2xl font-light text-background shadow-glass-lg"
      >
        +
      </motion.button>

      <UploadSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onFilesSelected={(files, _source, location) => upload(files, location)}
      />

      <UploadProgress
        status={status}
        total={total}
        completed={completed}
        fileProgress={fileProgress}
        onDismiss={reset}
      />
    </>
  );
}
