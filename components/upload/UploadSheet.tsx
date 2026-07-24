"use client";

import { useRef, type ChangeEvent } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CameraIcon, PhotoLibraryIcon } from "@/components/ui/icons";

interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

export function UploadSheet({ open, onClose, onFilesSelected }: UploadSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    onClose();
    if (files.length > 0) onFilesSelected(files);
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose}>
        <div className="flex flex-col gap-2 px-2 pb-3 pt-1">
          <Button
            variant="glass"
            size="lg"
            className="w-full justify-start px-4"
            onClick={() => cameraInputRef.current?.click()}
          >
            <CameraIcon className="h-5 w-5" /> Cámara
          </Button>
          <Button
            variant="glass"
            size="lg"
            className="w-full justify-start px-4"
            onClick={() => galleryInputRef.current?.click()}
          >
            <PhotoLibraryIcon className="h-5 w-5" /> Galería
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </BottomSheet>

      {/* La cámara sólo captura una foto/vídeo por toma: sin `multiple` aquí. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      {/* La galería del dispositivo sí permite elegir varios de una vez. */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
