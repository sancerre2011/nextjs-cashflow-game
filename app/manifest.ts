import type { MetadataRoute } from "next";

const basePath = process.env.SITE_BASE_PATH ?? "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cashflow Player Setup",
    short_name: "Cashflow",
    description: "Mobile-first player setup screen for a Cashflow game session.",
    start_url: `${basePath}/`,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: `${basePath}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${basePath}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${basePath}/icon-maskable-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${basePath}/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${basePath}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
