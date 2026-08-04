"use client";

import { useRef, type ChangeEvent } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CameraIcon, PhotoLibraryIcon } from "@/components/ui/icons";
import { getBrowserLocation, type GpsCoords } from "@/lib/media/getBrowserLocation";

export type UploadSource = "camera" | "gallery";

interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[], source: UploadSource, location?: GpsCoords) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

export function UploadSheet({ open, onClose, onFilesSelected }: UploadSheetProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  // Se pide en cuanto se toca "Cámara" (ver handleCameraClick), no solo al
  // volver de hacer la foto: algunos navegadores (Safari en iOS entre ellos)
  // sólo conceden el permiso de ubicación — o directamente no muestran el
  // diálogo — si se pide en respuesta directa e inmediata a un toque real.
  // Pero abrir la cámara nativa, encuadrar y disparar casi siempre tarda más
  // que el timeout de getBrowserLocation, y mientras esa UI nativa tiene el
  // foco la geolocalización puede quedar en pausa — así que este primer
  // intento casi siempre ya se resolvió a `undefined` cuando el archivo
  // vuelve. Por eso handleCameraChange reintenta una vez más justo al volver,
  // momento en que la pestaña ya recuperó el foco y no compite con la cámara.
  const pendingLocationRef = useRef<Promise<GpsCoords | undefined> | null>(null);

  function handleCameraClick() {
    pendingLocationRef.current = getBrowserLocation();
    cameraInputRef.current?.click();
  }

  async function handleCameraChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    onClose();
    if (files.length === 0) return;
    const tapTimeLocation = await pendingLocationRef.current;
    const location = tapTimeLocation ?? (await getBrowserLocation());
    onFilesSelected(files, "camera", location);
  }

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    onClose();
    if (files.length > 0) onFilesSelected(files, "gallery");
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose}>
        <div className="flex flex-col gap-2 px-2 pb-3 pt-1">
          <Button
            variant="glass"
            size="lg"
            className="w-full justify-start px-4"
            onClick={handleCameraClick}
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
        onChange={handleCameraChange}
      />
      {/* La galería del dispositivo sí permite elegir varios de una vez. */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={handleGalleryChange}
      />
    </>
  );
}
