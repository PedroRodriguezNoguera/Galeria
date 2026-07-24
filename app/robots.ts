import type { MetadataRoute } from "next";

// Galería semi-privada pensada para acceder por QR: no se indexa en buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
