import type { MetadataRoute } from "next";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: `${appName} — Asociación Civil habilitada por IRCCA. Plataforma exclusiva para socios.`,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c0b",
    theme_color: "#0b0c0b",
    lang: "es-UY",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
