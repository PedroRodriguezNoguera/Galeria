"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadSheet } from "./UploadSheet";
import { UploadProgress } from "./UploadProgress";
import { useUpload } from "@/hooks/useUpload";
import { getBrowserLocation } from "@/lib/media/getBrowserLocation";
import { springSnappy } from "@/animations/springs";

export function UploadFab() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { upload, status, total, completed, fileProgress, reset } = useUpload();

  function handleOpenSheet() {
    // Sin usar el resultado: sólo para que el permiso de ubicación se pida y
    // resuelva aquí, en un toque tranquilo que no compite con nada — si se
    // pidiera por primera vez al tocar "Cámara" (ver UploadSheet), compite
    // con la apertura de la cámara nativa y el diálogo de permiso nunca llega
    // a mostrarse bien, así que el permiso no queda concedido de verdad y
    // todos los intentos de ahí en adelante fallan en silencio. Una vez
    // resuelto aquí (concedido o denegado), las llamadas de UploadSheet ya no
    // tienen que negociar permiso y responden al momento.
    void getBrowserLocation();
    setSheetOpen(true);
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={handleOpenSheet}
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
