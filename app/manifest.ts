import type { MetadataRoute } from "next";

// Iconos placeholder hasta que se suba el logo real (ver scripts/generate-placeholder-icons.mjs).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Galería",
    short_name: "Galería",
    description: "Galería compartida de fotos y vídeos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
