import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Bailio", short_name: "Bailio", description: "Gestion locative et paiement de loyer", start_url: "/", display: "standalone", background_color: "#fff7ed", theme_color: "#EA580C", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }] };
}
