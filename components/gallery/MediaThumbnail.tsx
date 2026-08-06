import Image from "next/image";
import type { MediaWithReactions } from "@/types/media";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";
import { PlayIcon } from "@/components/ui/icons";

interface MediaThumbnailProps {
  media: MediaWithReactions;
}

/**
 * Sólo el contenido visual de una miniatura (imagen + insignias): sin Link ni
 * botón, para que la galería pública (navega) y el panel de admin (abre un
 * visor local) puedan envolverlo cada una a su manera sin duplicar el JSX.
 */
export function MediaThumbnail({ media }: MediaThumbnailProps) {
  const thumbnailUrl = getPublicStorageUrl("media-thumbnails", media.thumbnail_path);
  const hasReactions = media.topReactions.length > 0;

  return (
    <>
      <Image
        src={thumbnailUrl}
        alt=""
        fill
        draggable={false}
        sizes="(max-width: 640px) 33vw, 220px"
        className="select-none object-cover [-webkit-user-drag:none]"
      />

      {media.media_type === "video" ? (
        <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-foreground backdrop-blur-md backdrop-saturate-150">
          <PlayIcon className="h-3 w-3 translate-x-px" />
        </span>
      ) : null}

      {hasReactions ? (
        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-glass-pill border border-glass-border bg-glass-strong px-1.5 py-0.5 text-[11px] leading-none text-foreground backdrop-blur-md backdrop-saturate-150">
          <span className="flex -space-x-1">
            {media.topReactions.map((reaction) => (
              <span key={reaction.emoji}>{reaction.emoji}</span>
            ))}
          </span>
          <span className="font-medium tabular-nums">{media.totalReactions}</span>
        </span>
      ) : null}
    </>
  );
}
